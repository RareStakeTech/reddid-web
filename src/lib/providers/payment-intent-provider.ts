/**
 * PaymentIntentProvider — creates, stores, and updates PaymentIntent records.
 *
 * A PaymentIntent is created by the payer (or an agent on their behalf),
 * shared with the recipient, then signed and submitted via a PaymentRailAdapter.
 *
 * In MVP: in-memory storage, ephemeral. Production: persist to db.json or
 * a real database with TTL-based expiry.
 *
 * See docs/ARCHITECTURE.md — PaymentIntent lifecycle.
 */

import type { PaymentIntent, PaymentRailId, PaymentAsset, PaymentStatus } from '@/lib/types';

export interface CreatePaymentIntentInput {
  fromHandle: string | null;
  toHandle: string;
  toAddress: string;
  amount: number;
  asset: PaymentAsset;
  rail: PaymentRailId;
  memo: string | null;
  platform: string | null;
  agentId: string | null;
  requiresApproval: boolean;
  /** TTL in seconds; defaults to 86400 (24h) */
  ttlSeconds?: number;
}

export interface PaymentIntentProvider {
  /** Create a new PaymentIntent in 'draft' status. */
  create(input: CreatePaymentIntentInput): PaymentIntent;

  /** Get a PaymentIntent by id. Returns null if not found or expired. */
  get(id: string): PaymentIntent | null;

  /** Transition a PaymentIntent to a new status. */
  updateStatus(
    id: string,
    status: PaymentStatus,
    extras?: { txid?: string; approvedAt?: string },
  ): PaymentIntent;

  /** Cancel a PaymentIntent (sets status:'cancelled'). */
  cancel(id: string): PaymentIntent;

  /** Expire all stale intents whose expiresAt has passed. Returns count. */
  expireStale(): number;
}

export type { PaymentIntent, PaymentStatus } from '@/lib/types';
