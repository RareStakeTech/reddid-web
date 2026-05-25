/**
 * Provider registry — single entry point for all mock/real provider instances.
 *
 * Call getProviders() anywhere in server-side code to get the active set of
 * providers. In MVP all providers are mock implementations. Swap individual
 * entries here when real implementations are ready — no call sites change.
 *
 * Provider instances are singletons for the lifetime of the process.
 * Mock stores that use in-memory Maps (credentials, envelopes, presentations)
 * are reset on server restart; that is expected and documented.
 *
 * See docs/ARCHITECTURE.md — Provider Layer section.
 */

import type { PolicyEngine } from '@/lib/providers/policy-engine';
import type { RevocationRegistry } from '@/lib/providers/revocation-registry';
import type { TrustEvaluator } from '@/lib/providers/trust-evaluator';
import type { CredentialProvider } from '@/lib/providers/credential-provider';
import type { ActionEnvelopeProvider } from '@/lib/providers/action-envelope-provider';
import type { PresentationProvider } from '@/lib/providers/presentation-provider';
import type { SignatureVerifier } from '@/lib/providers/signature-verifier';
import type { InstructionSigner } from '@/lib/providers/instruction-signer';
import type { PaymentRailAdapter } from '@/lib/providers/payment-rail';
import type { PaymentIntentProvider } from '@/lib/providers/payment-intent-provider';

import { MockPolicyEngine } from '@/lib/providers/mock/mock-policy-engine';
import { MockRevocationRegistry } from '@/lib/providers/mock/mock-revocation-registry';
import { MockTrustEvaluator } from '@/lib/providers/mock/mock-trust-evaluator';
import { MockCredentialProvider } from '@/lib/providers/mock/mock-credential-provider';
import { MockActionEnvelopeProvider } from '@/lib/providers/mock/mock-action-envelope-provider';
import { MockPresentationProvider } from '@/lib/providers/mock/mock-presentation-provider';
import { MockSignatureVerifier } from '@/lib/providers/mock/mock-signature-verifier';
import { MockInstructionSigner } from '@/lib/providers/mock/mock-instruction-signer';
import { MockPaymentRailAdapter } from '@/lib/providers/mock/mock-payment-rail';
import { MockPaymentIntentProvider } from '@/lib/providers/mock/mock-payment-intent-provider';

export interface Providers {
  policyEngine: PolicyEngine;
  revocationRegistry: RevocationRegistry;
  trustEvaluator: TrustEvaluator;
  credentialProvider: CredentialProvider;
  envelopeProvider: ActionEnvelopeProvider;
  presentationProvider: PresentationProvider;
  signatureVerifier: SignatureVerifier;
  instructionSigner: InstructionSigner;
  /** Rail adapter for the primary native-rdd payment rail (mock in MVP). */
  paymentRail: PaymentRailAdapter;
  /** Creates and manages PaymentIntent lifecycle (mock in-memory store in MVP). */
  paymentIntentProvider: PaymentIntentProvider;
}

let _providers: Providers | null = null;

/**
 * Returns the singleton provider registry.
 * All providers are mock implementations in MVP.
 *
 * To swap a provider: replace the corresponding `new Mock*()` with
 * the real implementation. Types are enforced by the Providers interface.
 */
export function getProviders(): Providers {
  if (_providers) return _providers;
  _providers = {
    policyEngine: new MockPolicyEngine(),
    revocationRegistry: new MockRevocationRegistry(),
    trustEvaluator: new MockTrustEvaluator(),
    credentialProvider: new MockCredentialProvider(),
    envelopeProvider: new MockActionEnvelopeProvider(),
    presentationProvider: new MockPresentationProvider(),
    signatureVerifier: new MockSignatureVerifier(),
    instructionSigner: new MockInstructionSigner(),
    paymentRail: new MockPaymentRailAdapter(),
    paymentIntentProvider: new MockPaymentIntentProvider(),
  };
  return _providers;
}
