/**
 * SignatureVerifier — verifies cryptographic signatures for wallet proofs and login.
 *
 * Used by the wallet-link flow, Digi-ID login, and ActionEnvelope submission.
 * Current implementation: MockSignatureVerifier (always returns false for real sigs;
 * accepts mock signatures for prototype flows).
 *
 * Live implementation: requires reddcoinjs-lib for RDD message verification.
 * See docs/DIGIID_COMPATIBILITY.md for the integration plan.
 */

import type { SignatureType } from '@/lib/types';

export interface VerifySignatureInput {
  message: string;       // the message that was signed (e.g. the ActionEnvelope nonce)
  address: string;       // the claimed address / pubkey
  signature: string;     // the signature to verify
  type: SignatureType;
}

export interface SignatureVerifier {
  /**
   * Verify a signature.
   * Returns true only if the signature is cryptographically valid.
   * Mock implementation: returns true for signatureType 'mock', false for all others.
   */
  verify(input: VerifySignatureInput): boolean;

  /**
   * Check if this verifier can handle the given signature type.
   */
  supports(type: SignatureType): boolean;
}
