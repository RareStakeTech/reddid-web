import type { NextRequest } from 'next/server';
import { createVerificationChallenge } from '@/lib/db';
import { sanitizeHandle } from '@/lib/validation';
import { PLATFORM_MAP } from '@/lib/platforms';

/**
 * POST /api/verify/challenge
 * Body: { handle, platform, editToken }
 * Returns: { challenge: "a1b2c3d4", expiresAt: "2026-..." }
 *
 * Generates (or regenerates) an 8-char hex challenge code the user must post
 * publicly on the given platform to prove they control that account.
 *
 * Supported platforms are driven by PLATFORM_MAP in platforms.ts — the same
 * source of truth used by the /platforms page and Love Button.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const handle    = sanitizeHandle(String(body.handle ?? ''));
  const platform  = String(body.platform ?? '').trim().toLowerCase();
  const editToken = String(body.editToken ?? '').trim();

  if (!handle)    return Response.json({ error: 'handle is required.' },    { status: 400 });
  if (!platform)  return Response.json({ error: 'platform is required.' },  { status: 400 });
  if (!editToken) return Response.json({ error: 'editToken is required.' }, { status: 401 });

  // Validate against the canonical platform registry — not a hardcoded list
  if (!PLATFORM_MAP[platform]) {
    const known = Object.keys(PLATFORM_MAP).sort().join(', ');
    return Response.json(
      { error: `Unsupported platform. Known platforms: ${known}` },
      { status: 422 },
    );
  }

  try {
    const { code, expiresAt } = createVerificationChallenge(handle, platform, editToken);
    return Response.json({ challenge: code, expiresAt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')    return Response.json({ error: `@${handle} not found.` },  { status: 404 });
    if (msg === 'UNAUTHORIZED') return Response.json({ error: 'Edit token incorrect.' }, { status: 401 });
    return Response.json({ error: 'Failed to create challenge.' }, { status: 500 });
  }
}
