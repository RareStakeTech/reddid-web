/**
 * PresentationProvider — creates selective credential presentations.
 *
 * A Presentation lets a holder show specific credentials to a verifier
 * without exposing their full profile. Generated on demand; not persisted.
 *
 * See docs/CREDENTIALS.md § Privacy model for use cases.
 */

import type { Presentation, Credential } from '@/lib/types';

export interface CreatePresentationInput {
  holder: string;
  credentialIds: string[];
  purpose: string;
  audience: string | null;
  ttlSeconds?: number; // default: 3600 (1 hour)
}

export interface PresentationProvider {
  /**
   * Create a Presentation containing the specified credentials.
   * In MVP: unsigned (proof is null). Future: signed with holder's key.
   */
  create(input: CreatePresentationInput): Presentation;

  /**
   * Resolve the full credential objects for a presentation.
   * Returns only credentials the holder actually owns.
   */
  resolve(presentation: Presentation): Credential[];

  /**
   * Verify a presentation: checks that all credentials are valid,
   * not revoked, and that the holder matches.
   */
  verify(presentation: Presentation): { valid: boolean; reason: string };
}

export type { Presentation } from '@/lib/types';
