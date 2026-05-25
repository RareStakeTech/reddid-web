/**
 * MockCredentialProvider — issues and stores credentials in memory.
 *
 * In MVP, credentials are held in a process-level Map. They do not
 * survive server restarts. Production: store in db.json under identity records
 * or in a separate credentials table.
 *
 * All issued credentials have:
 *   - proof.type: 'mock'
 *   - source: as specified by the caller
 *   - trustLevel: computed by MockTrustEvaluator
 *
 * Labeled as mock — UI must not imply these are externally verified.
 */

import crypto from 'crypto';
import type { CredentialProvider, IssueCredentialInput, VerificationResult } from '@/lib/providers/credential-provider';
import type { Credential } from '@/lib/types';
import { MockTrustEvaluator } from './mock-trust-evaluator';

const trustEvaluator = new MockTrustEvaluator();

// In-memory store — not persisted. Replace with db.json storage in v0.5.
const _store = new Map<string, Credential>();

export class MockCredentialProvider implements CredentialProvider {
  issue(input: IssueCredentialInput): Credential {
    const now = new Date().toISOString();
    const credential: Credential = {
      id: crypto.randomBytes(8).toString('hex'),
      type: input.type,
      issuer: input.issuer,
      subject: input.subject,
      claims: input.claims,
      proof: {
        type: 'mock',
        verificationMethod: null,
        proofValue: null,
        createdAt: now,
      },
      status: 'active',
      visibility: input.visibility ?? 'public',
      issuedAt: now,
      expiresAt: input.expiresAt ?? null,
      revocationRef: null,
      source: input.source,
      // trustLevel is computed at issue time, not stored separately
      trustLevel: trustEvaluator.evaluate({
        id: '',
        type: input.type,
        issuer: input.issuer,
        subject: input.subject,
        claims: input.claims,
        proof: { type: 'mock', verificationMethod: null, proofValue: null, createdAt: now },
        status: 'active',
        visibility: input.visibility ?? 'public',
        issuedAt: now,
        expiresAt: input.expiresAt ?? null,
        revocationRef: null,
        source: input.source,
        trustLevel: 'self-reported', // placeholder for evaluator call
      }),
    };
    _store.set(credential.id, credential);
    return credential;
  }

  get(id: string): Credential | null {
    return _store.get(id) ?? null;
  }

  getBySubject(handle: string): Credential[] {
    return Array.from(_store.values()).filter(c => c.subject === handle);
  }

  revoke(id: string, revokedBy: string, _reason: string): Credential {
    const credential = _store.get(id);
    if (!credential) throw new Error(`Credential ${id} not found`);
    const revoked: Credential = { ...credential, status: 'revoked' };
    _store.set(id, revoked);
    return revoked;
  }

  verify(credential: Credential): VerificationResult {
    if (credential.status === 'revoked') {
      return { valid: false, reason: 'Credential has been revoked.', trustLevel: 'revoked' };
    }
    if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
      return { valid: false, reason: 'Credential has expired.', trustLevel: 'revoked' };
    }
    const trustLevel = trustEvaluator.evaluate(credential);
    return {
      valid: true,
      reason: `Valid. Trust level: ${trustLevel}.`,
      trustLevel,
    };
  }
}
