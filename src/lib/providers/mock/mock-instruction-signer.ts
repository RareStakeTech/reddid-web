/**
 * MockInstructionSigner — generates signing requests without real wallet integration.
 *
 * Returns a placeholder QR URL and deep link that a future real signer would
 * replace with actual GRIDS or Digi-ID encoded instructions.
 *
 * All output is labeled isMock: true. All signatures are signatureType: 'mock'.
 *
 * Swap this for GRIDSInstructionSigner when Gajumaru Associate Chains are live.
 * Swap for DigiIDInstructionSigner when Digi-ID wallet support is confirmed.
 */

import type {
  InstructionSigner,
  SigningRequest,
  SubmissionResult,
} from '@/lib/providers/instruction-signer';
import type { ActionEnvelope } from '@/lib/types';

const MOCK_BASE_URL = 'https://redd.love';

export class MockInstructionSigner implements InstructionSigner {
  createSigningRequest(envelope: ActionEnvelope): SigningRequest {
    // In production: encode envelope as GRIDS instruction or Digi-ID URI
    const mockPayload = Buffer.from(
      JSON.stringify({ id: envelope.id, nonce: envelope.nonce, type: envelope.type }),
    ).toString('base64url');

    return {
      envelopeId: envelope.id,
      qrUrl: `${MOCK_BASE_URL}/api/mock-sign?payload=${mockPayload}`,
      deepLink: `reddid://sign?payload=${mockPayload}`,
      humanReadableSummary: envelope.humanReadableSummary,
      expiresAt: envelope.expiresAt,
      isMock: true, // MUST be checked by UI to show mock label
    };
  }

  verifySignature(envelope: ActionEnvelope, signature: string): boolean {
    // Mock: accept any non-empty signature for 'mock' type envelopes
    // Real implementation: use reddcoinjs-lib or GRIDS SDK
    return (
      envelope.signatureType === 'mock' &&
      typeof signature === 'string' &&
      signature.length > 0
    );
  }

  async submit(envelope: ActionEnvelope): Promise<SubmissionResult> {
    // Mock: always succeed
    // Real implementation: broadcast to Gajumaru or RDD network
    if (envelope.status !== 'signed') {
      return { success: false, txid: null, error: 'Envelope is not signed.' };
    }
    return {
      success: true,
      txid: `mock-txid-${envelope.nonce}`,
      error: null,
    };
  }
}
