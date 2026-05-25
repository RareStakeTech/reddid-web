/**
 * SocialProofAdapter — platform-side verification of challenge-post proofs.
 *
 * v0.3: trust-based — user claims to have posted; we take their word.
 * v0.5: this adapter performs the actual platform API check before marking
 *   a social proof as 'verified'.
 *
 * One adapter per platform. Platform-specific adapters will use OAuth tokens
 * or public read APIs to check that the challenge code appears in the user's
 * recent posts or bio.
 *
 * See docs/DIGIID_COMPATIBILITY.md and the v0.5 roadmap section.
 */

export interface SocialProofVerificationResult {
  found: boolean;
  /** URL where the challenge code was found, if applicable */
  foundAt: string | null;
  /** Human-readable explanation */
  reason: string;
  /** Which source was used to verify */
  source: 'mock' | 'platform-api' | 'scrape';
}

export interface SocialProofAdapter {
  /** The platform this adapter handles (matches SocialProof.platform) */
  readonly platform: string;

  /**
   * Attempt to verify that `expectedCode` appears in `username`'s recent
   * public posts or bio on this platform.
   *
   * @param username   The platform username to check
   * @param expectedCode  The 8-char hex challenge code to look for
   * @param proofUrl   Optional direct URL the user provided
   */
  verify(
    username: string,
    expectedCode: string,
    proofUrl: string | null,
  ): Promise<SocialProofVerificationResult>;

  /** Whether this adapter can handle the given platform. */
  supports(platform: string): boolean;
}
