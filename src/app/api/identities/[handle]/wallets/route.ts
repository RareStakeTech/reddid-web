import type { NextRequest } from 'next/server';
import { getStore } from '@/lib/store';
import { sanitizeHandle, isValidRddAddress } from '@/lib/validation';
import type { ChainType, WalletPurpose, VisibilityLevel } from '@/lib/types';

/**
 * POST /api/identities/[handle]/wallets
 * Body: { editToken, chain, address, label?, purpose?, visibility?, primary? }
 *
 * Adds a wallet to an identity. All wallets added via this endpoint are
 * 'self-reported' proofType in v0.3. Cryptographic wallet-signature proof
 * is planned for v0.5 via ActionEnvelope + InstructionSigner.
 *
 * GET /api/identities/[handle]/wallets
 * Returns all non-revoked wallets. Private wallets filtered unless editToken provided.
 */

interface Props {
  params: Promise<{ handle: string }>;
}

const VALID_CHAINS: ChainType[]     = ['rdd', 'bsc', 'base', 'gajumaru', 'other'];
const VALID_PURPOSES: WalletPurpose[] = ['receive', 'tipping', 'bridge', 'agent', 'watch-only'];
const VALID_VISIBILITY: VisibilityLevel[] = ['public', 'unlisted', 'private'];

export async function GET(request: NextRequest, { params }: Props) {
  const { handle } = await params;
  const h = sanitizeHandle(handle);
  if (!h) return Response.json({ error: 'Invalid handle.' }, { status: 400 });

  const store = getStore();
  const identity = store.getIdentityByHandle(h);
  if (!identity) return Response.json({ error: `@${h} not found.` }, { status: 404 });

  const editToken = request.nextUrl.searchParams.get('editToken') ?? '';
  const isOwner = editToken && identity.editToken === editToken;

  const wallets = (identity.wallets ?? []).filter(w => {
    if (w.revokedAt) return false;
    if (!isOwner && w.visibility === 'private') return false;
    return true;
  });

  return Response.json({ wallets });
}

export async function POST(request: NextRequest, { params }: Props) {
  const { handle } = await params;
  const h = sanitizeHandle(handle);
  if (!h) return Response.json({ error: 'Invalid handle.' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const editToken  = String(body.editToken  ?? '').trim();
  const chain      = String(body.chain      ?? 'rdd').trim() as ChainType;
  const address    = String(body.address    ?? '').trim();
  const label      = body.label ? String(body.label).trim().slice(0, 60) : null;
  const purpose    = String(body.purpose    ?? 'receive').trim() as WalletPurpose;
  const visibility = String(body.visibility ?? 'public').trim() as VisibilityLevel;
  const primary    = Boolean(body.primary ?? false);

  if (!editToken) return Response.json({ error: 'editToken is required.' }, { status: 401 });
  if (!address)   return Response.json({ error: 'address is required.'   }, { status: 400 });
  if (!VALID_CHAINS.includes(chain)) {
    return Response.json({ error: `chain must be one of: ${VALID_CHAINS.join(', ')}` }, { status: 422 });
  }
  if (!VALID_PURPOSES.includes(purpose)) {
    return Response.json({ error: `purpose must be one of: ${VALID_PURPOSES.join(', ')}` }, { status: 422 });
  }
  if (!VALID_VISIBILITY.includes(visibility)) {
    return Response.json({ error: `visibility must be one of: ${VALID_VISIBILITY.join(', ')}` }, { status: 422 });
  }
  // Only validate RDD address format — other chains have different formats
  if (chain === 'rdd' && !isValidRddAddress(address)) {
    return Response.json({ error: 'Invalid RDD address format.' }, { status: 422 });
  }

  try {
    const wallet = getStore().addWallet(h, editToken, {
      chain, address, label, purpose, visibility, primary,
    });
    return Response.json({ wallet }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')        return Response.json({ error: `@${h} not found.` },                        { status: 404 });
    if (msg === 'UNAUTHORIZED')     return Response.json({ error: 'Edit token incorrect.' },                    { status: 401 });
    if (msg === 'WALLET_LIMIT')     return Response.json({ error: 'Maximum 20 wallets per identity.' },         { status: 422 });
    if (msg === 'DUPLICATE_ADDRESS') return Response.json({ error: 'This address is already linked.' },         { status: 409 });
    return Response.json({ error: 'Failed to add wallet.' }, { status: 500 });
  }
}
