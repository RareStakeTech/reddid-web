/**
 * POST /api/identities/[handle]/token
 *
 * Rotate the editToken. Accepts expired tokens so users can recover from expiry.
 * Still rejects wrong tokens to prevent unauthorized rotation.
 *
 * Sprint 1 / S1-01 — editToken expiry + reissue.
 */

import type { NextRequest } from 'next/server';
import { reissueToken } from '@/lib/db';
import { sanitizeHandle } from '@/lib/validation';

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ handle: string }> }
) {
  const { handle } = await ctx.params;
  const clean = sanitizeHandle(handle);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const editToken = String(body.editToken ?? '').trim();
  if (!editToken) {
    return Response.json({ error: 'editToken is required.' }, { status: 401 });
  }

  try {
    const result = reissueToken(clean, editToken);
    return Response.json({
      success: true,
      editToken: result.editToken,
      expiresAt: result.expiresAt,
      message: 'Edit token rotated. Store the new token — the old one is now invalid.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')    return Response.json({ error: `@${clean} not found.` }, { status: 404 });
    if (msg === 'UNAUTHORIZED') return Response.json({ error: 'Edit token incorrect.' }, { status: 401 });
    return Response.json({ error: 'Token reissue failed.' }, { status: 500 });
  }
}
