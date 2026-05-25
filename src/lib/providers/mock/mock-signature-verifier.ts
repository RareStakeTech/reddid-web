/**
 * MockSignatureVerifier — accepts mock signatures; rejects all real ones.
 *
 * Real implementation needs reddcoinjs-lib for RDD message verification.
 * See docs/DIGIID_COMPATIBILITY.md for the integration plan.
 */

import type { SignatureVerifier, VerifySignatureInput } from '@/lib/providers/signature-verifier';
import type { SignatureType } from '@/lib/types';

export class MockSignatureVerifier implements SignatureVerifier {
  verify(input: VerifySignatureInput): boolean {
    // Only accept mock signatures — all real crypto returns false until implemented
    if (input.type === 'mock') {
      return typeof input.signature === 'string' && input.signature.length > 0;
    }
    // Real types: not implemented yet
    return false;
  }

  supports(type: SignatureType): boolean {
    return type === 'mock' || type === 'none';
  }
}
