/**
 * CredentialProvider — issues, stores, and verifies credentials.
 *
 * See docs/CREDENTIALS.md for the full credential model and type registry.
 */

import type {
  Credential,
  CredentialType,
  CredentialSource,
  VisibilityLevel,
} from '@/lib/types';

export interface IssueCredentialInput {
  type: CredentialType;
  issuer: string;
  subject: string;
  claims: Record<string, unknown>;
  source: CredentialSource;
  visibility?: VisibilityLevel;
  expiresAt?: string | null;
}

export interface VerificationResult {
  valid: boolean;
  reason: string;
  trustLevel: import('@/lib/types').TrustLevel;
}

export interface CredentialProvider {
  /** Issue a new credential. Returns the stored credential with generated id. */
  issue(input: IssueCredentialInput): Credential;

  /** Get a credential by id. */
  get(id: string): Credential | null;

  /** Get all credentials for a subject handle. */
  getBySubject(handle: string): Credential[];

  /** Revoke a credential by id. Creates a RevocationEvent. */
  revoke(id: string, revokedBy: string, reason: string): Credential;

  /**
   * Verify a credential.
   * Checks status, expiry, proof validity, and revocation.
   * In MVP: proof is always 'mock' — validity check is structural only.
   */
  verify(credential: Credential): VerificationResult;
}

export type { Credential } from '@/lib/types';
