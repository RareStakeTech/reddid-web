/**
 * InstructionSigner — generates signing requests from ActionEnvelopes.
 *
 * Separates execution context (web app) from signing context (wallet).
 * Designed for future compatibility with Gajumaru GRIDS and Digi-ID.
 *
 * Current implementation: MockInstructionSigner — returns a mock signing request.
 * All mock-signed envelopes are labeled signatureType: 'mock'.
 *
 * See docs/GRIDS_COMPATIBILITY.md and docs/DIGIID_COMPATIBILITY.md.
 */

import type { ActionEnvelope } from '@/lib/types';

export interface SigningRequest {
  envelopeId: string;
  qrUrl: string;           // QR-encodable URL for mobile wallet scanning
  deepLink: string;        // Deep link for wallet apps
  humanReadableSummary: string;
  expiresAt: string;
  isMock: boolean;         // must be true for MockInstructionSigner output
}

export interface SubmissionResult {
  success: boolean;
  txid: string | null;
  error: string | null;
}

export interface InstructionSigner {
  /**
   * Generate a signing request from an ActionEnvelope.
   * Returns a QR URL and deep link for the user to review and sign.
   */
  createSigningRequest(envelope: ActionEnvelope): SigningRequest;

  /**
   * Verify that a returned signature is valid for the given envelope.
   */
  verifySignature(envelope: ActionEnvelope, signature: string): boolean;

  /**
   * Submit a signed envelope to the appropriate chain or service.
   * In MVP: mock — returns success without any real submission.
   */
  submit(envelope: ActionEnvelope): Promise<SubmissionResult>;
}
