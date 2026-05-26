import type { NextRequest } from 'next/server';
import { getIdentityByHandle, updateIdentity, publicIdentity } from '@/lib/db';
import { sanitizeHandle, isValidUrl } from '@/lib/validation';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ handle: string }> }
) {
  const { handle } = await ctx.params;
  const clean = sanitizeHandle(handle);

  const identity = getIdentityByHandle(clean);
  if (!identity) {
    return Response.json({ error: `@${clean} not found.` }, { status: 404 });
  }

  // Strip editToken + verificationChallenges from public response
  return Response.json({ identity: publicIdentity(identity) });
}

export async function PUT(
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

  const editToken    = String(body.editToken ?? '').trim();
  const displayName  = String(body.displayName ?? '').trim().slice(0, 60);
  const bio          = String(body.bio ?? '').trim().slice(0, 160);
  const website      = String(body.website ?? '').trim().slice(0, 200);

  if (!editToken) {
    return Response.json({ error: 'editToken is required.' }, { status: 401 });
  }
  if (website && !isValidUrl(website)) {
    return Response.json({ error: 'Invalid website URL.' }, { status: 422 });
  }

  try {
    const identity = updateIdentity(clean, editToken, {
      displayName: displayName || undefined,
      bio: bio || undefined,
      website: website || undefined,
    });
    return Response.json({ identity: publicIdentity(identity) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND') return Response.json({ error: `@${clean} not found.` }, { status: 404 });
    if (msg === 'UNAUTHORIZED') return Response.json({ error: 'Edit token incorrect.' }, { status: 401 });
    return Response.json({ error: 'Update failed.' }, { status: 500 });
  }
}
