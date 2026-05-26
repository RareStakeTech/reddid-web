/**
 * POST /api/identities/[handle]/recover
 *
 * Emergency handle recovery. Verifies the revocationKey plaintext against the
 * stored SHA-256 hash and issues a fresh editToken.
 *
 * Use this when the editToken has been lost or compromised. The revocationKey
 * itself is NOT rotated — the user may need it again.
 *
 * Rate-limited per-handle to prevent brute-force attacks: the revocationKey is
 * 64 hex chars (256 bits of entropy) so brute-force is computationally infeasible,
 * but rate-limiting adds defence-in-depth.
 *
 * Sprint 1 / S1-06.
 */

import type { NextRequest } from 'next/server';
import { recoverByRevocationKey } from '@/lib/db';
import { sanitizeHandle } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ handle: string }> }
) {
  // Rate-limit recovery attempts per IP — not per handle, to prevent timing attacks
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = checkRateLimit(ip, 'recover', RATE_LIMITS.recover);
  if (!rl.ok) {
    return Response.json(
      { error: 'Too many recovery attempts. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  const { handle } = await ctx.params;
  const clean = sanitizeHandle(handle);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const revocationKey = String(body.revocationKey ?? '').trim();
  if (!revocationKey) {
    return Response.json({ error: 'revocationKey is required.' }, { status: 400 });
  }

  try {
    const result = recoverByRevocationKey(clean, revocationKey);
    return Response.json({
      success: true,
      editToken: result.editToken,
      expiresAt: result.expiresAt,
      message: 'Recovery successful. Store your new editToken in localStorage. Your revocationKey is unchanged.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')       return Response.json({ error: `@${clean} not found.` }, { status: 404 });
    if (msg === 'NO_RECOVERY_KEY') return Response.json({ error: 'This account has no recovery key set. It may have been registered before recovery keys were introduced.' }, { status: 422 });
    if (msg === 'UNAUTHORIZED')    return Response.json({ error: 'Recovery key incorrect.' }, { status: 401 });
    return Response.json({ error: 'Recovery failed.' }, { status: 500 });
  }
}
