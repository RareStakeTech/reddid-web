/**
 * MockSocialProofAdapter — always returns found:false in v0.3.
 *
 * The mock does not make any platform API calls. It always returns
 * found:false with source:'mock', which tells confirmSocialProof
 * to remain trust-based (no external verification performed).
 *
 * When real platform adapters are built in v0.5, they will be registered
 * in a per-platform map and selected by getProviders() or a factory method.
 *
 * Swap for TwitterSocialProofAdapter, GitHubSocialProofAdapter, etc.
 * when v0.5 platform verification is ready.
 */

import type {
  SocialProofAdapter,
  SocialProofVerificationResult,
} from '@/lib/providers/social-proof-adapter';

export class MockSocialProofAdapter implements SocialProofAdapter {
  readonly platform = 'mock';

  async verify(
    _username: string,
    _expectedCode: string,
    _proofUrl: string | null,
  ): Promise<SocialProofVerificationResult> {
    // Not implemented — real platform API check is a v0.5 feature.
    return {
      found: false,
      foundAt: null,
      reason: 'Platform API verification not yet implemented (v0.3 is trust-based).',
      source: 'mock',
    };
  }

  supports(platform: string): boolean {
    // The mock adapter accepts all platforms as a passthrough.
    // Real adapters each declare their own specific platform id.
    return typeof platform === 'string' && platform.length > 0;
  }
}
