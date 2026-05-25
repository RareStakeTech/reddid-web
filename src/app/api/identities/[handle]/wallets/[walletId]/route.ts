import type { NextRequest } from 'next/server';
import { getStore } from '@/lib/store';
import { sanitizeHandle } from '@/lib/validation';

/**
 * DELETE /api/identities/[handle]/wallets/[walletId]
 * Body: { editToken }
 *
 * Removes (soft-deletes) a wallet. Cannot remove the last wallet on an identity.
 *
 * PATCH /api/identities/[handle]/wallets/[walletId]
 * Body: { editToken, primary: true }
 *
 * Set a wallet as primary for its chain. The only mutation allowed
 * on existing wallet records in v0.3 (label/purpose edits are deferred to v0.5).
 */

interface Props {
  params: Promise<{ handle: string; walletId: string }>;
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { handle, walletId } = await params;
  const h = sanitizeHandle(handle);
  if (!h || !walletId) return Response.json({ error: 'handle and walletId are required.' }, { status: 400 });

  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* editToken may be in header eventually */ }

  const editToken = String(body.editToken ?? '').trim();
  if (!editToken) return Response.json({ error: 'editToken is required.' }, { status: 401 });

  try {
    getStore().removeWallet(h, editToken, walletId);
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')        return Response.json({ error: `@${h} not found.` },              { status: 404 });
    if (msg === 'UNAUTHORIZED')     return Response.json({ error: 'Edit token incorrect.' },          { status: 401 });
    if (msg === 'LAST_WALLET')      return Response.json({ error: 'Cannot remove the last wallet.' }, { status: 422 });
    if (msg === 'WALLET_NOT_FOUND') return Response.json({ error: `Wallet ${walletId} not found.` }, { status: 404 });
    return Response.json({ error: 'Failed to remove wallet.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const { handle, walletId } = await params;
  const h = sanitizeHandle(handle);
  if (!h || !walletId) return Response.json({ error: 'handle and walletId are required.' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const editToken = String(body.editToken ?? '').trim();
  if (!editToken) return Response.json({ error: 'editToken is required.' }, { status: 401 });

  if (body.primary !== true) {
    return Response.json({ error: 'Only { primary: true } is supported in v0.3.' }, { status: 422 });
  }

  try {
    const wallet = getStore().setPrimaryWallet(h, editToken, walletId);
    return Response.json({ wallet });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')        return Response.json({ error: `@${h} not found.` },              { status: 404 });
    if (msg === 'UNAUTHORIZED')     return Response.json({ error: 'Edit token incorrect.' },          { status: 401 });
    if (msg === 'WALLET_NOT_FOUND') return Response.json({ error: `Wallet ${walletId} not found.` }, { status: 404 });
    if (msg === 'WALLET_REVOKED')   return Response.json({ error: 'Cannot set a revoked wallet as primary.' }, { status: 422 });
    return Response.json({ error: 'Failed to update wallet.' }, { status: 500 });
  }
}
