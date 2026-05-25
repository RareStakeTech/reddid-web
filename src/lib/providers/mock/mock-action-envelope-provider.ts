/**
 * MockActionEnvelopeProvider — creates and manages ActionEnvelopes in memory.
 *
 * Envelopes are ephemeral (not persisted). They expire and are not recoverable
 * after a server restart. Production: store in Redis or db.json with TTL.
 *
 * All envelopes created by this provider:
 *   - Have signatureType: 'mock' on submission
 *   - Must be labeled in UI ("This is a mock signing flow")
 */

import crypto from 'crypto';
import type { ActionEnvelopeProvider, CreateEnvelopeInput } from '@/lib/providers/action-envelope-provider';
import type { ActionEnvelope, SignatureType } from '@/lib/types';

// In-memory store keyed by id and nonce
const _byId = new Map<string, ActionEnvelope>();
const _byNonce = new Map<string, string>(); // nonce → id

const DEFAULT_TTL: Record<string, number> = {
  login: 300,          // 5 minutes
  'wallet-link': 600,  // 10 minutes
  default: 86400,      // 24 hours
};

export class MockActionEnvelopeProvider implements ActionEnvelopeProvider {
  create(input: CreateEnvelopeInput): ActionEnvelope {
    const now = new Date();
    const nonce = crypto.randomBytes(8).toString('hex'); // 16-char hex
    const ttl = input.ttlSeconds ?? DEFAULT_TTL[input.type] ?? DEFAULT_TTL.default;
    const expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();

    const envelope: ActionEnvelope = {
      id: crypto.randomBytes(8).toString('hex'),
      type: input.type,
      domain: input.domain,
      origin: input.origin,
      requestedBy: input.requestedBy,
      subjectHandle: input.subjectHandle,
      agentId: input.agentId,
      humanReadableSummary: input.humanReadableSummary,
      payload: input.payload,
      nonce,
      createdAt: now.toISOString(),
      expiresAt,
      requiredSigner: input.requiredSigner,
      signature: null,
      signatureType: 'none',
      status: 'pending-signature',
    };

    _byId.set(envelope.id, envelope);
    _byNonce.set(nonce, envelope.id);
    return envelope;
  }

  get(id: string): ActionEnvelope | null {
    const envelope = _byId.get(id) ?? null;
    if (!envelope) return null;
    if (new Date(envelope.expiresAt) < new Date() && envelope.status === 'pending-signature') {
      const expired = { ...envelope, status: 'expired' as const };
      _byId.set(id, expired);
      return expired;
    }
    return envelope;
  }

  getByNonce(nonce: string): ActionEnvelope | null {
    const id = _byNonce.get(nonce);
    if (!id) return null;
    return this.get(id);
  }

  submit(id: string, signature: string, _signatureType: SignatureType): ActionEnvelope {
    const envelope = this.get(id);
    if (!envelope) throw new Error(`ActionEnvelope ${id} not found.`);
    if (envelope.status !== 'pending-signature') {
      throw new Error(`ActionEnvelope ${id} is not pending signature (status: ${envelope.status}).`);
    }
    if (new Date(envelope.expiresAt) < new Date()) {
      throw new Error(`ActionEnvelope ${id} has expired.`);
    }
    const signed: ActionEnvelope = {
      ...envelope,
      signature,
      signatureType: 'mock', // MockProvider always uses mock signature type
      status: 'signed',
    };
    _byId.set(id, signed);
    return signed;
  }

  cancel(id: string): ActionEnvelope {
    const envelope = this.get(id);
    if (!envelope) throw new Error(`ActionEnvelope ${id} not found.`);
    const cancelled: ActionEnvelope = { ...envelope, status: 'cancelled' };
    _byId.set(id, cancelled);
    return cancelled;
  }

  expireStale(): number {
    let count = 0;
    const now = new Date();
    for (const [id, envelope] of _byId.entries()) {
      if (envelope.status === 'pending-signature' && new Date(envelope.expiresAt) < now) {
        _byId.set(id, { ...envelope, status: 'expired' });
        count++;
      }
    }
    return count;
  }
}
