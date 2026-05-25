import type { NextRequest } from 'next/server';
import { createVerificationChallenge } from '@/lib/db';
import { sanitizeHandle } from '@/lib/validation';

const SUPPORTED_PLATFORMS = ['twitter', 'youtube', 'reddit', 'instagram', 'twitch', 'tiktok', 'github'];

/**
 * POST /api/verify/challenge
 * Body: { handle, platform, editToken }
 * Returns: { challenge: "a1b2c3d4" }
 *
 * Generates (or regenerates) an 8-char hex challenge code the user must post
 * publicly on the given platform to prove they control that account.
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

  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return Response.json(
      { error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(', ')}` },
      { status: 422 }
    );
  }

  try {
    const challenge = createVerificationChallenge(handle, platform, editToken);
    return Response.json({ challenge });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')    return Response.json({ error: `@${handle} not found.` },  { status: 404 });
    if (msg === 'UNAUTHORIZED') return Response.json({ error: 'Edit token incorrect.' }, { status: 401 });
    return Response.json({ error: 'Failed to create challenge.' }, { status: 500 });
  }
}
