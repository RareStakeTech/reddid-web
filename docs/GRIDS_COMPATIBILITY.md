# GRIDS Compatibility — ReddID and Gajumaru GRIDS

**Last updated:** 2026-05-25
**Status:** Design only. Not implemented. Planned for v1.0.

---

## What Gajumaru GRIDS is

GRIDS (Generalised Reconciliation and Instruction Delivery System) is the signing and instruction-delivery framework for the Gajumaru network. It separates:
- **Execution context**: the connected web application that constructs instructions
- **Signing context**: the wallet or hardware device that holds the private key

A user reviews a human-readable instruction summary before signing. The signature authorizes the instruction without the web app ever touching the private key. GRIDS is designed for compatibility with air-gapped signers, mobile wallets, and hardware wallets.

---

## Why ReddID cares about GRIDS

1. **Agent authorization**: When a user creates an agent with spending limits, the authorization could be delivered as a signed GRIDS instruction envelope. The agent's `controllerKey` receives a bounded credential that it can use without further human approval (within policy limits).

2. **Payment authorization**: A ReddRail payment request, once the rail is live, will be a signed instruction on the Gajumaru Associate Chain. GRIDS is the signing protocol.

3. **Air-gap compatibility**: Some users want to authorize actions from an offline device. GRIDS' QR/URL-based instruction delivery supports this.

4. **Human-readable signing**: Every GRIDS instruction has a human-readable summary. This matches ReddID's `ActionEnvelope.humanReadableSummary` requirement exactly.

---

## GRIDS architecture

```
Web App (execution context)
  ↓ constructs instruction
ActionEnvelope (human-readable, signed)
  ↓ encoded as QR or URL
Mobile wallet / hardware signer (signing context)
  ↓ user reviews humanReadableSummary
  ↓ user approves
  ↓ wallet signs with private key
Signature returned to web app
  ↓ submitted to Gajumaru / ReddRail
```

Keys never touch the web app. Instructions are always human-reviewable before signing.

---

## ActionEnvelope → GRIDS mapping

| ActionEnvelope field | GRIDS equivalent |
|---------------------|-----------------|
| `humanReadableSummary` | Human-readable instruction description |
| `payload` | Instruction data |
| `nonce` | Instruction nonce (replay prevention) |
| `domain` | Origin domain binding |
| `expiresAt` | Instruction expiry |
| `requiredSigner` | Required signing key / address |
| `signature` | Completed signature |
| `signatureType: 'gajumaru-grids'` | GRIDS signature format |

The `ActionEnvelope` is designed to map to GRIDS without field renaming. A `GRIDSAdapter` will handle encoding/decoding.

---

## InstructionSigner interface

```typescript
interface InstructionSigner {
  /**
   * Generate a signable instruction from an ActionEnvelope.
   * Returns a QR code URL or deep link for the user to scan.
   */
  createSigningRequest(envelope: ActionEnvelope): SigningRequest;

  /**
   * Verify that a returned signature is valid for the envelope.
   */
  verifySignature(envelope: ActionEnvelope, signature: string): boolean;

  /**
   * Submit a signed envelope to the appropriate chain or service.
   */
  submit(envelope: ActionEnvelope): Promise<SubmissionResult>;
}

interface SigningRequest {
  qrUrl: string;          // QR-encodable URL for mobile signing
  deepLink: string;       // Deep link for wallet apps
  expiresAt: string;
  humanReadableSummary: string;
}
```

Current implementation: `MockInstructionSigner` — generates a mock signing request URL, auto-"signs" with `signatureType: 'mock'`, must label all mock-signed envelopes clearly.

---

## Agent credentials via GRIDS (planned)

When the system issues an `AgentAuthorizationCredential`, the future flow will be:

1. Parent identity creates the agent via `/api/agents/[handle]`
2. Server creates an `ActionEnvelope` of type `credential-issue`
3. `InstructionSigner` encodes as QR / deep link
4. User's wallet signs, authorizing the agent credential
5. Credential is stored with `proof.type: 'gajumaru-grids'`
6. Agent's `controllerKey` receives the credential for future use

In v0.4, step 3–5 use the mock signer: credential is stored with `proof.type: 'mock'` and must be labeled as such.

---

## Payment authorization via GRIDS (planned, v1.0)

When ReddRail is live on Gajumaru:

1. User creates a `PaymentIntent` on ReddID
2. System creates an `ActionEnvelope` of type `tip` or `payment-request`
3. User scans QR with their Gajumaru-compatible wallet
4. Wallet reviews the instruction: "Send 100 RDD to @bob via ReddRail"
5. User approves; wallet signs with GRIDS
6. Signed instruction submitted to the Gajumaru Associate Chain
7. ReddRail state channel executes the payment

---

## Dependency

GRIDS implementation depends on:
- Gajumaru Associate Chains being live (estimated Q3/Q4 2026)
- `GajumaruRail` adapter implementation
- The `reddcoinjs-lib` or Gajumaru SDK exposing the GRIDS signing spec

Until then, the `ActionEnvelope` type is fully compatible and the `MockInstructionSigner` handles all signing flows.

---

## What is guaranteed to not change when GRIDS is live

- `ActionEnvelope` type definition (no breaking changes needed)
- `InstructionSigner` interface (adapter pattern absorbs the integration)
- `PolicyEngine` interface (already evaluates the envelope)
- `AgentAuthorizationCredential` type

The only new code required: `GRIDSInstructionSigner` implementing `InstructionSigner`, registered in `getProviders()`.
