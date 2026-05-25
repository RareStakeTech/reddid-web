/**
 * MockPaymentIntentProvider — creates and manages PaymentIntents in memory.
 *
 * Intents are ephemeral (not persisted). They are lost on server restart.
 * Production: persist to db.json paymentIntents[] with TTL-based expiry.
 *
 * All intents created by this provider have status:'draft' on creation.
 * The UI must not display mock intents as real transactions.
 */

import crypto from 'crypto';
import type { PaymentIntent, PaymentStatus } from '@/lib/types';
import type {
  PaymentIntentProvider,
  CreatePaymentIntentInput,
} from '@/lib/providers/payment-intent-provider';

const DEFAULT_TTL_SECONDS = 86400; // 24 hours

// In-memory store — keyed by id
const _store = new Map<string, PaymentIntent>();

export class MockPaymentIntentProvider implements PaymentIntentProvider {
  create(input: CreatePaymentIntentInput): PaymentIntent {
    const now = new Date();
    const ttl = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const intent: PaymentIntent = {
      id: crypto.randomBytes(8).toString('hex'),
      fromHandle: input.fromHandle,
      toHandle: input.toHandle,
      toAddress: input.toAddress,
      amount: input.amount,
      asset: input.asset,
      rail: input.rail,
      memo: input.memo ? input.memo.slice(0, 160) : null,
      platform: input.platform,
      agentId: input.agentId,
      status: 'draft',
      requiresApproval: input.requiresApproval,
      approvedAt: null,
      txid: null,
      externalRef: null,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };
    _store.set(intent.id, intent);
    return intent;
  }

  get(id: string): PaymentIntent | null {
    const intent = _store.get(id) ?? null;
    if (!intent) return null;
    // Auto-expire if TTL has passed and still in a non-terminal state
    const terminal: PaymentStatus[] = ['confirmed', 'failed', 'cancelled', 'expired'];
    if (!terminal.includes(intent.status) && new Date(intent.expiresAt) < new Date()) {
      const expired = { ...intent, status: 'expired' as const, updatedAt: new Date().toISOString() };
      _store.set(id, expired);
      return expired;
    }
    return intent;
  }

  updateStatus(
    id: string,
    status: PaymentStatus,
    extras?: { txid?: string; approvedAt?: string },
  ): PaymentIntent {
    const intent = this.get(id);
    if (!intent) throw new Error(`PaymentIntent ${id} not found.`);
    const updated: PaymentIntent = {
      ...intent,
      status,
      txid: extras?.txid ?? intent.txid,
      approvedAt: extras?.approvedAt ?? intent.approvedAt,
      updatedAt: new Date().toISOString(),
    };
    _store.set(id, updated);
    return updated;
  }

  cancel(id: string): PaymentIntent {
    return this.updateStatus(id, 'cancelled');
  }

  expireStale(): number {
    let count = 0;
    const now = new Date();
    const terminal: PaymentStatus[] = ['confirmed', 'failed', 'cancelled', 'expired'];
    for (const [id, intent] of _store.entries()) {
      if (!terminal.includes(intent.status) && new Date(intent.expiresAt) < now) {
        _store.set(id, { ...intent, status: 'expired', updatedAt: now.toISOString() });
        count++;
      }
    }
    return count;
  }
}
