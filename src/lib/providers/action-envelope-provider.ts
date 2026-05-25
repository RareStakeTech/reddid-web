/**
 * ActionEnvelopeProvider — creates and manages ActionEnvelope lifecycle.
 *
 * Every signing or approval request goes through this provider.
 * The provider enforces nonce uniqueness, expiry, and status transitions.
 *
 * See docs/ACTION_ENVELOPE.md for the full model.
 */

import type {
  ActionEnvelope,
  ActionEnvelopeType,
  SignatureType,
} from '@/lib/types';

export interface CreateEnvelopeInput {
  type: ActionEnvelopeType;
  domain: string;
  origin: string;
  requestedBy: string | null;
  subjectHandle: string | null;
  agentId: string | null;
  humanReadableSummary: string;
  payload: Record<string, unknown>;
  requiredSigner: string | null;
  ttlSeconds?: number;           // default: 300 (5 minutes) for auth, 86400 for payment
}

export interface ActionEnvelopeProvider {
  /** Create a new ActionEnvelope with a fresh nonce. */
  create(input: CreateEnvelopeInput): ActionEnvelope;

  /** Get an envelope by id. Returns null if not found or expired. */
  get(id: string): ActionEnvelope | null;

  /** Get an envelope by nonce. */
  getByNonce(nonce: string): ActionEnvelope | null;

  /**
   * Record a signature and mark the envelope as 'signed'.
   * Validates that the envelope is still valid and not expired.
   */
  submit(
    id: string,
    signature: string,
    signatureType: SignatureType,
  ): ActionEnvelope;

  /** Cancel an envelope before it is signed. */
  cancel(id: string): ActionEnvelope;

  /** Mark expired envelopes. Safe to call periodically. */
  expireStale(): number;
}

export type { ActionEnvelope } from '@/lib/types';
