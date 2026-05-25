import type { NextRequest } from 'next/server';
import { getStore } from '@/lib/store';
import { getProviders } from '@/lib/providers';
import { sanitizeHandle } from '@/lib/validation';
import { primaryRddAddress } from '@/lib/types';
import type { PaymentAsset, PaymentRailId } from '@/lib/types';

const VALID_ASSETS: PaymentAsset[] = ['rdd', 'wrdd-bsc', 'wrdd-base', 'rdd-rail'];
const VALID_RAILS: PaymentRailId[] = ['native-rdd', 'bsc-wrdd', 'base-wrdd', 'gajumaru-rail'];

/**
 * POST /api/payments
 * Body: { toHandle, amount, asset?, rail?, memo?, platform?, fromHandle?, agentId? }
 *
 * Creates a PaymentIntent in 'draft' status. The intent includes a snapshot of
 * the recipient's primary wallet address at creation time.
 *
 * Returns: { intent: PaymentIntent }
 *
 * This endpoint does NOT broadcast anything. It creates a structured payment
 * request that can be presented to the sender as a BIP21 URI, QR, or deeplink.
 * Actual submission goes through /api/payments/[id]/submit (v0.5).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const toHandle   = sanitizeHandle(String(body.toHandle   ?? ''));
  const fromHandle = body.fromHandle ? sanitizeHandle(String(body.fromHandle)) : null;
  const amount     = Number(body.amount ?? 0);
  const asset      = String(body.asset  ?? 'rdd').trim() as PaymentAsset;
  const rail       = String(body.rail   ?? 'native-rdd').trim() as PaymentRailId;
  const memo       = body.memo ? String(body.memo).slice(0, 160) : null;
  const platform   = body.platform ? String(body.platform).trim().toLowerCase() : null;
  const agentId    = body.agentId  ? String(body.agentId).trim()  : null;

  if (!toHandle)     return Response.json({ error: 'toHandle is required.'         }, { status: 400 });
  if (!amount || amount <= 0) return Response.json({ error: 'amount must be > 0.'  }, { status: 400 });
  if (!VALID_ASSETS.includes(asset)) {
    return Response.json({ error: `Invalid asset. Valid: ${VALID_ASSETS.join(', ')}` }, { status: 422 });
  }
  if (!VALID_RAILS.includes(rail)) {
    return Response.json({ error: `Invalid rail. Valid: ${VALID_RAILS.join(', ')}` }, { status: 422 });
  }

  // Resolve the recipient's primary wallet address at creation time
  const store = getStore();
  const recipient = store.getIdentityByHandle(toHandle);
  if (!recipient) {
    return Response.json({ error: `@${toHandle} not found.` }, { status: 404 });
  }
  const toAddress = primaryRddAddress(recipient);
  if (!toAddress) {
    return Response.json({ error: `@${toHandle} has no receiving wallet configured.` }, { status: 422 });
  }

  const { paymentIntentProvider } = getProviders();
  const intent = paymentIntentProvider.create({
    fromHandle,
    toHandle,
    toAddress,
    amount,
    asset,
    rail,
    memo,
    platform,
    agentId,
    requiresApproval: false, // PolicyEngine check deferred to v0.5 agent flow
  });

  return Response.json({ intent }, { status: 201 });
}
