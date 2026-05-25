import type { NextRequest } from 'next/server';
import { getIdentityByHandle } from '@/lib/db';
import { sanitizeHandle } from '@/lib/validation';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/identities/[handle]'>
) {
  const { handle } = await ctx.params;
  const clean = sanitizeHandle(handle);

  const identity = getIdentityByHandle(clean);
  if (!identity) {
    return Response.json({ error: `@${clean} not found.` }, { status: 404 });
  }

  // Return identity without internal id for public API
  const { id: _id, ...public_identity } = identity;
  return Response.json({ identity: public_identity });
}
