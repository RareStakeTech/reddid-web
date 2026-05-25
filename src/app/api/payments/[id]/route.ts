import type { NextRequest } from 'next/server';
import { getProviders } from '@/lib/providers';

/**
 * GET /api/payments/[id]
 * Returns: { intent: PaymentIntent }
 *
 * Used by the /pay/[handle] page to poll a PaymentIntent's status,
 * and by the sender to confirm a payment has been received.
 *
 * Expired intents are returned with status:'expired' so the UI can prompt
 * the user to create a new request.
 *
 * DELETE /api/payments/[id]
 * Cancels a PaymentIntent. Only draft/requested intents can be cancelled.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const { paymentIntentProvider } = getProviders();
  const intent = paymentIntentProvider.get(id);
  if (!intent) {
    return Response.json({ error: `PaymentIntent ${id} not found.` }, { status: 404 });
  }
  return Response.json({ intent });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const { paymentIntentProvider } = getProviders();
  try {
    const intent = paymentIntentProvider.cancel(id);
    return Response.json({ intent });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('not found')) {
      return Response.json({ error: `PaymentIntent ${id} not found.` }, { status: 404 });
    }
    return Response.json({ error: 'Failed to cancel PaymentIntent.' }, { status: 500 });
  }
}
