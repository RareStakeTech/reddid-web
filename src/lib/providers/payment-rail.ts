/**
 * PaymentRailAdapter — abstracts submission of a PaymentIntent to a specific rail.
 *
 * One adapter per rail type. Currently only 'native-rdd' will have a mock
 * implementation. BSC/Base wRDD adapters come in v1.0 when bridge is live.
 * Gajumaru state-channel rail comes when Gajumaru infrastructure is confirmed.
 *
 * See docs/ARCHITECTURE.md — Payment Rail section.
 */

import type { PaymentIntent, PaymentRailId, PaymentStatus } from '@/lib/types';

export interface FeeEstimate {
  /** Network fee in RDD units */
  feeRdd: number;
  /** USD equivalent (null if price feed unavailable) */
  feeUsd: number | null;
  /** Human-readable explanation of where the fee estimate came from */
  source: 'mock' | 'node' | 'api';
}

export interface RailSubmissionResult {
  success: boolean;
  txid: string | null;
  error: string | null;
}

export interface PaymentRailAdapter {
  /** The rail this adapter handles */
  readonly rail: PaymentRailId;

  /**
   * Estimate the network fee for this payment.
   * Returns immediately — does not broadcast.
   */
  estimateFee(amount: number, toAddress: string): Promise<FeeEstimate>;

  /**
   * Submit a signed payment intent to the network.
   * Intent must have status:'signed' before calling submit.
   */
  submit(intent: PaymentIntent): Promise<RailSubmissionResult>;

  /**
   * Check the current on-chain / in-channel status of a transaction.
   * Returns null if the txid is not recognised.
   */
  getStatus(txid: string): Promise<PaymentStatus | null>;

  /** Whether this adapter can handle the given rail. */
  supports(rail: PaymentRailId): boolean;
}

export type { PaymentRailId, PaymentStatus } from '@/lib/types';
