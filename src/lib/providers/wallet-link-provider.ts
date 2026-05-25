/**
 * WalletLinkProvider — manages wallet[] entries on an identity.
 *
 * Wallets are stored in Identity.wallets[]. The primary RDD wallet is
 * derived via primaryRddAddress(). Non-primary wallets are future-facing
 * (BSC wRDD, Base wRDD, Gajumaru rail).
 *
 * Proof types:
 *   'self-reported' — user claims ownership, no cryptographic proof (MVP)
 *   'wallet-signature' — ECDSA signature from the wallet's private key (v0.5+)
 *
 * See docs/IDENTITY_MODEL.md — Wallet section.
 */

import type { WalletLink, ChainType, VisibilityLevel, WalletPurpose } from '@/lib/types';

export interface AddWalletInput {
  chain: ChainType;
  address: string;
  label: string | null;
  purpose: WalletPurpose;
  visibility: VisibilityLevel;
  /** Set to true to make this the primary wallet for its chain. */
  primary: boolean;
}

export interface WalletLinkProvider {
  /**
   * Add a wallet to an identity. editToken required.
   * Throws DUPLICATE_ADDRESS if the same address+chain is already linked.
   */
  addWallet(
    handle: string,
    editToken: string,
    input: AddWalletInput,
  ): WalletLink;

  /** Remove a wallet entry by id. editToken required. Cannot remove the last wallet. */
  removeWallet(handle: string, editToken: string, walletId: string): void;

  /**
   * Set a wallet as primary for its chain.
   * Clears primary=true on all other wallets of the same chain.
   */
  setPrimary(handle: string, editToken: string, walletId: string): WalletLink;
}

export type { WalletLink } from '@/lib/types';
