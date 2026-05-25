/**
 * TrustEvaluator — computes TrustLevel for credentials, social proofs, and wallets.
 *
 * Pure function interface: takes a record, returns a TrustLevel.
 * No network calls. No side effects.
 *
 * See docs/TRUST_LEVELS.md for the full trust level model.
 */

import type { Credential, SocialProof, WalletLink, TrustLevel } from '@/lib/types';

export interface TrustEvaluator {
  /** Evaluate the trust level of a credential based on its source and proof. */
  evaluate(credential: Credential): TrustLevel;

  /** Shortcut: evaluate a SocialProof directly. */
  evaluateSocialProof(proof: SocialProof): TrustLevel;

  /** Shortcut: evaluate a WalletLink directly. */
  evaluateWallet(wallet: WalletLink): TrustLevel;
}

export type { TrustLevel } from '@/lib/types';
