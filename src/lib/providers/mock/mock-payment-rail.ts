/**
 * MockPaymentRailAdapter — simulates native-rdd rail submission without broadcasting.
 *
 * All operations succeed. Fee is a fixed placeholder (0.01 RDD).
 * txid is mock-txid-{nonce} — never broadcast to any network.
 *
 * isMock behavior: submit() logs a warning to the server console.
 * UI must never display mock txids as real transaction confirmations.
 *
 * Swap for NativeRddRailAdapter when reddcoinjs-lib broadcast is ready.
 */

import type { PaymentIntent, PaymentRailId, PaymentStatus } from '@/lib/types';
import type {
  PaymentRailAdapter,
  FeeEstimate,
  RailSubmissionResult,
} from '@/lib/providers/payment-rail';

const MOCK_FEE_RDD = 0.01; // placeholder — real value depends on network mempool

export class MockPaymentRailAdapter implements PaymentRailAdapter {
  readonly rail: PaymentRailId = 'native-rdd';

  async estimateFee(_amount: number, _toAddress: string): Promise<FeeEstimate> {
    return {
      feeRdd: MOCK_FEE_RDD,
      feeUsd: null, // price feed not available in mock
      source: 'mock',
    };
  }

  async submit(intent: PaymentIntent): Promise<RailSubmissionResult> {
    if (intent.status !== 'signed') {
      return {
        success: false,
        txid: null,
        error: `Cannot submit: intent status is '${intent.status}', expected 'signed'.`,
      };
    }

    // Mock: never broadcasts. Log clearly so developers aren't confused.
    console.warn(
      `[MockPaymentRailAdapter] MOCK SUBMIT — intent ${intent.id} ` +
      `(${intent.amount} RDD → ${intent.toAddress}). No real broadcast.`,
    );

    return {
      success: true,
      txid: `mock-txid-${intent.id.slice(0, 8)}`,
      error: null,
    };
  }

  async getStatus(txid: string): Promise<PaymentStatus | null> {
    // Mock: any mock txid is "confirmed"; real txids are unknown
    if (txid.startsWith('mock-txid-')) {
      return 'confirmed';
    }
    return null; // not recognised
  }

  supports(rail: PaymentRailId): boolean {
    return rail === 'native-rdd';
  }
}
