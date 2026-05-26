/**
 * POST /api/identities/[handle]/export
 *
 * GDPR-style full data export. Returns the caller's complete identity record,
 * minus the internal revocationKey hash (not meaningful personal data).
 *
 * Uses POST so the editToken stays in the request body rather than query params
 * (query params appear in server logs and browser history).
 *
 * Sprint 1 / S1-03.
 */

import type { NextRequest } from 'next/server';
import { exportIdentity } from '@/lib/db';
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
    const data = exportIdentity(clean, editToken);
    return Response.json({
      exportedAt: new Date().toISOString(),
      format: 'reddid-identity-v2',
      identity: data,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')    return Response.json({ error: `@${clean} not found.` }, { status: 404 });
    if (msg === 'UNAUTHORIZED') return Response.json({ error: 'Edit token incorrect.' }, { status: 401 });
    if (msg === 'TOKEN_EXPIRED') return Response.json({ error: 'Edit token has expired. Use POST /api/identities/{handle}/token to reissue.' }, { status: 401 });
    return Response.json({ error: 'Export failed.' }, { status: 500 });
  }
}
