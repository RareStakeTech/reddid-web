import { NextRequest } from 'next/server';
import { createIdentity, getIdentityByHandle, addSocialProof, publicIdentity } from '@/lib/db';
import { isValidHandle, isValidRddAddress, isValidUrl, sanitizeHandle } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { ALL_PLATFORM_IDS } from '@/lib/platforms';

export async function POST(request: NextRequest) {
  // Rate limit: max 3 registrations per IP per hour (in-memory; swap for Redis in prod)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = checkRateLimit(ip, 'register', RATE_LIMITS.register);
  if (!rl.ok) {
    return Response.json(
      { error: 'Too many registrations from this IP. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const rawHandle   = String(body.handle ?? '').trim();
  const rddAddress  = String(body.rddAddress ?? '').trim();
  const displayName = String(body.displayName ?? '').trim().slice(0, 60);
  const bio         = String(body.bio ?? '').trim().slice(0, 160);
  const website     = String(body.website ?? '').trim().slice(0, 200);

  // Optional social links — array of { platform, username } submitted at registration
  const rawSocialLinks = Array.isArray(body.socialLinks) ? body.socialLinks : [];
  const socialLinks = rawSocialLinks
    .filter((l): l is { platform: string; username: string } =>
      l !== null &&
      typeof l === 'object' &&
      typeof l.platform === 'string' &&
      typeof l.username === 'string' &&
      ALL_PLATFORM_IDS.includes(l.platform) &&
      l.username.trim().length > 0
    )
    .slice(0, 10) // max 10 social links at registration
    .map(l => ({ platform: l.platform, username: l.username.trim().slice(0, 100) }));

  // Validate handle
  const handleClean = sanitizeHandle(rawHandle);
  const handleCheck = isValidHandle(handleClean);
  if (!handleCheck.valid) {
    return Response.json({ error: handleCheck.error }, { status: 422 });
  }

  // Validate RDD address
  if (!rddAddress) {
    return Response.json({ error: 'RDD address is required.' }, { status: 422 });
  }
  if (!isValidRddAddress(rddAddress)) {
    return Response.json(
      { error: 'Invalid RDD address. Mainnet addresses start with R and are 34 characters.' },
      { status: 422 }
    );
  }

  // Validate optional website
  if (website && !isValidUrl(website)) {
    return Response.json({ error: 'Invalid website URL.' }, { status: 422 });
  }

  // Check for existing handle
  const existing = getIdentityByHandle(handleClean);
  if (existing) {
    return Response.json({ error: `@${handleClean} is already taken.` }, { status: 409 });
  }

  // Create
  try {
    const { identity: baseIdentity, revocationKeyPlaintext } = createIdentity({
      handle: handleClean,
      displayName: displayName || undefined,
      rddAddress,
      bio: bio || undefined,
      website: website || undefined,
    });

    let identity = baseIdentity;

    // Attach any social links provided at registration (self-reported, no verification required)
    for (const link of socialLinks) {
      try {
        identity = addSocialProof(handleClean, {
          platform: link.platform,
          username: link.username,
          proofMethod: 'self-reported',
          proofUrl: null,
          verificationStatus: 'pending',
          visibility: 'public',
        });
      } catch {
        // Non-fatal — continue if one social link fails
      }
    }

    // Return editToken + revocationKey once — client must save both.
    // Neither appears in GET responses. revocationKey is shown to user exactly once.
    return Response.json({
      success: true,
      identity: publicIdentity(identity),
      editToken: identity.editToken,
      revocationKey: revocationKeyPlaintext,
    }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Registration failed.';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  // Returns total count only — no bulk listing for privacy
  const { countIdentities } = await import('@/lib/db');
  const count = countIdentities();
  return Response.json({ count });
}
