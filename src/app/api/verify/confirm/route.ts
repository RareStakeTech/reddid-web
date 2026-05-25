import type { NextRequest } from 'next/server';
import { confirmSocialProof, publicIdentity } from '@/lib/db';
import { sanitizeHandle, isValidUrl } from '@/lib/validation';

/**
 * POST /api/verify/confirm
 * Body: { handle, platform, username, proofUrl, editToken }
 *
 * Records a social proof after the user claims to have posted the challenge code.
 *
 * v0.1: trust-based — stores what the user submits without external verification.
 * v0.2 will add platform API verification (check bio / recent posts for the code).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const handle    = sanitizeHandle(String(body.handle    ?? ''));
  const platform  = String(body.platform  ?? '').trim().toLowerCase();
  const username  = String(body.username  ?? '').trim();
  const proofUrl  = String(body.proofUrl  ?? '').trim();
  const editToken = String(body.editToken ?? '').trim();

  if (!handle)    return Response.json({ error: 'handle is required.'    }, { status: 400 });
  if (!platform)  return Response.json({ error: 'platform is required.'  }, { status: 400 });
  if (!username)  return Response.json({ error: 'username is required.'  }, { status: 400 });
  if (!editToken) return Response.json({ error: 'editToken is required.' }, { status: 401 });

  if (proofUrl && !isValidUrl(proofUrl)) {
    return Response.json({ error: 'proofUrl must be a valid https:// URL.' }, { status: 422 });
  }

  try {
    const identity = confirmSocialProof(handle, platform, username, proofUrl, editToken);
    return Response.json({ identity: publicIdentity(identity) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')    return Response.json({ error: `@${handle} not found.` },  { status: 404 });
    if (msg === 'UNAUTHORIZED') return Response.json({ error: 'Edit token incorrect.' }, { status: 401 });
    return Response.json({ error: 'Failed to confirm proof.' }, { status: 500 });
  }
}
