import { NextRequest } from 'next/server';
import { createIdentity, getIdentityByHandle } from '@/lib/db';
import { isValidHandle, isValidRddAddress, isValidUrl, sanitizeHandle } from '@/lib/validation';

export async function POST(request: NextRequest) {
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
    const identity = createIdentity({
      handle: handleClean,
      displayName: displayName || undefined,
      rddAddress,
      bio: bio || undefined,
      website: website || undefined,
    });
    return Response.json({ success: true, identity }, { status: 201 });
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
