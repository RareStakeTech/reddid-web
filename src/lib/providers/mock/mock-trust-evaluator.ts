/**
 * MockTrustEvaluator — computes TrustLevel from credential, social proof, or wallet fields.
 *
 * This is not a "mock" in the sense that its logic is fake — the evaluation rules
 * are real. It is called "mock" because it operates without any live platform
 * API verification. All social proof trust stops at 'challenge-post-verified'
 * until platform API auto-verify is implemented in v0.5.
 */

import type { TrustEvaluator, TrustLevel } from '@/lib/providers/trust-evaluator';
import type { Credential, SocialProof, WalletLink } from '@/lib/types';

export class MockTrustEvaluator implements TrustEvaluator {
  evaluate(credential: Credential): TrustLevel {
    // Revoked credentials
    if (credential.status === 'revoked') return 'revoked';

    // Expired credentials
    if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
      return 'revoked'; // treat expired same as revoked for trust purposes
    }

    // Map source to trust level
    switch (credential.source) {
      case 'self-asserted':    return 'self-reported';
      case 'mock':             return 'self-reported';
      case 'challenge-post':   return 'challenge-post-verified';
      case 'wallet-signature': return 'wallet-signature-verified';
      case 'community-attestation': return 'community-attested';
      case 'project-attestation':   return 'project-attested';
      case 'third-party':           return 'third-party-credentialed';
      default:                 return 'self-reported';
    }
  }

  evaluateSocialProof(proof: SocialProof): TrustLevel {
    // v0.3 proofs don't have verificationStatus — treat as self-reported
    if (!proof.verificationStatus) return 'self-reported';

    switch (proof.verificationStatus) {
      case 'revoked':  return 'revoked';
      case 'expired':  return 'revoked'; // expired = no longer valid
      case 'failed':   return 'self-reported'; // failed attempt = back to baseline
      case 'pending':  return 'self-reported';
      case 'verified':
        // Further refine by proof method
        switch (proof.proofMethod) {
          case 'challenge-post':  return 'challenge-post-verified';
          case 'signed-message':  return 'wallet-signature-verified';
          case 'dns-txt':         return 'challenge-post-verified';
          case 'self-reported':   return 'self-reported';
          default:                return 'challenge-post-verified'; // default for 'verified'
        }
      default:
        return 'self-reported';
    }
  }

  evaluateWallet(wallet: WalletLink): TrustLevel {
    if (wallet.revokedAt) return 'revoked';
    if (wallet.verified && wallet.proofType === 'signed-challenge') {
      return 'wallet-signature-verified';
    }
    if (wallet.proofType === 'self-reported') return 'self-reported';
    return 'self-reported';
  }
}
