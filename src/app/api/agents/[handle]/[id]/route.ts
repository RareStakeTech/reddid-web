import type { NextRequest } from 'next/server';
import { getStore } from '@/lib/store';
import { sanitizeHandle } from '@/lib/validation';

/**
 * DELETE /api/agents/[handle]/[id]
 * Body: { editToken, reason? }
 *
 * Revokes an agent. Revocation is permanent — the record is retained
 * with revokedAt set (not deleted) for audit purposes.
 *
 * Only the parent's editToken can revoke agents.
 * The agent's own controllerKey cannot self-revoke (server-side only).
 */

interface Props {
  params: Promise<{ handle: string; id: string }>;
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { handle, id } = await params;
  const h = sanitizeHandle(handle);
  if (!h) return Response.json({ error: 'Invalid handle.' }, { status: 400 });
  if (!id) return Response.json({ error: 'Agent id is required.' }, { status: 400 });

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // body is optional — proceed with defaults
  }

  const editToken = String(body.editToken ?? '').trim();
  const reason    = String(body.reason    ?? '').trim();

  if (!editToken) return Response.json({ error: 'editToken is required.' }, { status: 401 });

  try {
    const agent = getStore().revokeAgent(h, id, editToken, reason || 'Revoked by owner.');
    return Response.json({ agent });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')            return Response.json({ error: `@${h} not found.` },                    { status: 404 });
    if (msg === 'UNAUTHORIZED')         return Response.json({ error: 'Edit token incorrect.' },                { status: 401 });
    if (msg === 'AGENT_NOT_FOUND')      return Response.json({ error: `Agent ${id} not found.` },              { status: 404 });
    if (msg === 'AGENT_ALREADY_REVOKED') return Response.json({ error: 'Agent is already revoked.' },          { status: 409 });
    return Response.json({ error: 'Failed to revoke agent.' }, { status: 500 });
  }
}
