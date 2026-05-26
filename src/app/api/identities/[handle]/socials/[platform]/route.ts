/**
 * DELETE /api/identities/[handle]/socials/[platform]
 *
 * Revoke a linked social account. Sets verificationStatus='revoked' —
 * the record is kept for audit purposes but is hidden from publicIdentity()
 * and therefore from all public tip page consumers.
 *
 * Body: { editToken }
 *
 * Errors:
 *   400 — platform missing
 *   401 — editToken missing, wrong, or expired
 *   404 — handle or social proof not found
 *   422 — proof already revoked
 *   500 — unexpected error
 *
 * Sprint 3 / S3-04.
 */

import type { NextRequest } from 'next/server';
import { removeSocialProof, publicIdentity, getIdentityByHandle } from '@/lib/db';
import { sanitizeHandle } from '@/lib/validation';

interface Props {
  params: Promise<{ handle: string; platform: string }>;
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { handle, platform } = await params;
  const h = sanitizeHandle(handle);

  if (!h)        return Response.json({ error: 'handle is required.' },   { status: 400 });
  if (!platform) return Response.json({ error: 'platform is required.' }, { status: 400 });

  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* empty body */ }

  const editToken = String(body.editToken ?? '').trim();
  if (!editToken) return Response.json({ error: 'editToken is required.' }, { status: 401 });

  try {
    const identity = removeSocialProof(h, platform, editToken);
    return Response.json({ ok: true, identity: publicIdentity(identity) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'HANDLE_NOT_FOUND') return Response.json({ error: `@${h} not found.` },                          { status: 404 });
    if (msg === 'UNAUTHORIZED')     return Response.json({ error: 'Edit token incorrect.' },                      { status: 401 });
    if (msg === 'TOKEN_EXPIRED')    return Response.json({ error: 'Edit token has expired. Use POST /api/identities/{handle}/token to reissue.' }, { status: 401 });
    if (msg === 'NOT_FOUND')        return Response.json({ error: `No active ${platform} social proof found.` }, { status: 404 });
    console.error('[socials DELETE]', err);
    return Response.json({ error: 'Failed to revoke social proof.' }, { status: 500 });
  }
}

/**
 * GET /api/identities/[handle]/socials/[platform]
 *
 * Returns the public social proof record for a given platform.
 * Useful for checking current verification status.
 */
export async function GET(
  _req: NextRequest,
  { params }: Props,
) {
  const { handle, platform } = await params;
  const h = sanitizeHandle(handle);

  const identity = getIdentityByHandle(h);
  if (!identity) return Response.json({ error: `@${h} not found.` }, { status: 404 });

  const pub = publicIdentity(identity);
  const proof = pub.socialProofs.find(p => p.platform === platform);
  if (!proof) return Response.json({ error: `No ${platform} proof found.` }, { status: 404 });

  return Response.json({ proof });
}
