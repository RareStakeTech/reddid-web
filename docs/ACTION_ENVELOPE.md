# ActionEnvelope — ReddID Signing and Approval Model

**Last updated:** 2026-05-25
**Status:** Types defined. Mock implementation. No live signing yet.

---

## Purpose

An `ActionEnvelope` is the standard container for every action that requires user review, wallet signing, or human approval. It is not specific to payments — it covers login, wallet proof, tip approval, social proof, agent authorization, revocation, and future GRIDS/Digi-ID compatibility.

The goal: users never sign an opaque blob. Every request has a `humanReadableSummary`, a nonce, a domain binding, and an expiry.

---

## Why this exists

Without a unified signing model:
- Login, wallet-link, and payment each invent their own challenge format
- A future Digi-ID integration requires a different format
- A future GRIDS signing integration requires yet another format
- Agent actions have no verifiable authorization trail

With `ActionEnvelope`:
- One abstraction covers all cases
- The same UI can show "what you are signing" for any action type
- Adapters (Digi-ID, GRIDS, EIP-191, RDD-message) implement the same interface
- Expiry and nonce prevent replay attacks by design

---

## Type definition

```typescript
type ActionEnvelopeType =
  | 'login'               // challenge-response login (Digi-ID style)
  | 'wallet-link'         // prove control of an RDD address
  | 'tip'                 // initiate a tip to a handle
  | 'payment-request'     // request payment from a payer
  | 'agent-action'        // agent initiating an action within its allowedActions
  | 'agent-approval'      // human approving an agent action above threshold
  | 'revoke-agent'        // owner revoking an agent
  | 'social-proof'        // submitting a challenge-response proof
  | 'credential-issue'    // issuing a credential to a subject
  | 'credential-present'  // presenting selected credentials to a verifier
  | 'bridge-action';      // future: bridge deposit/withdrawal (NOT LIVE)

interface ActionEnvelope {
  id: string;
  type: ActionEnvelopeType;
  domain: string;               // e.g. "redd.love" — binds envelope to a specific origin
  origin: string;               // full origin URL
  requestedBy: string | null;   // handle or service that created the request
  subjectHandle: string | null; // the ReddID handle this action concerns
  agentId: string | null;       // if an agent is acting on behalf of the owner
  humanReadableSummary: string; // REQUIRED — plain English description shown to the user
  payload: Record<string, unknown>; // action-specific data
  nonce: string;                // 16-char hex — unique per envelope, prevents replay
  createdAt: string;
  expiresAt: string;            // default: createdAt + 5 minutes (login), + 24h (payment)
  requiredSigner: string | null;// RDD address or pubkey that must sign
  signature: string | null;     // populated after signing
  signatureType: 'none' | 'rdd-message' | 'evm-eip191' | 'gajumaru-grids' | 'ed25519' | 'mock';
  status: 'draft' | 'pending-signature' | 'signed' | 'submitted' | 'confirmed' | 'expired' | 'cancelled' | 'failed';
}
```

---

## Human-readable summary requirement

Every `ActionEnvelope` MUST have a non-empty `humanReadableSummary`. Examples:

| Type | Summary |
|------|---------|
| `wallet-link` | `"Prove you control RDD address Rxxxx...yyyy to link it to @alice"` |
| `login` | `"Log in to redd.love as @alice from this device"` |
| `tip` | `"Send 100 RDD to @bob from @alice via native-rdd rail"` |
| `agent-action` | `"Agent alice.tip-bot: create payment intent for 50 RDD to @carol"` |
| `agent-approval` | `"Approve agent alice.tip-bot to send 2,000 RDD — above your 1,000 RDD threshold"` |
| `revoke-agent` | `"Revoke agent alice.tip-bot immediately — all pending actions cancelled"` |
| `social-proof` | `"Confirm that @twitteruser is @alice on Twitter"` |

Vague summaries like "Sign this request" or "Approve action" are not acceptable.

---

## Nonce and expiry

- `nonce`: 16-char hex, cryptographically random, unique per envelope. Prevents replay.
- `expiresAt`: server-enforced. Expired envelopes are rejected even if signed.
- `domain`: binds the envelope to the specific origin. A signature from `redd.love` is not valid on `evil.com`.

---

## Signature types

| Type | What it is | Status |
|------|-----------|--------|
| `none` | No signature required (read-only actions) | Live |
| `mock` | Simulated signature for prototype flows | Live (must be labeled) |
| `rdd-message` | ReddCoin Core `verifymessage` style ECDSA | Planned (v0.5) |
| `evm-eip191` | Ethereum EIP-191 personal_sign | Planned (v0.6) |
| `gajumaru-grids` | GRIDS instruction envelope signature | Planned (v1.0) |
| `ed25519` | EdDSA — future W3C DID verification method | Future |

MVP uses `signatureType: 'mock'` for all signing flows. This must be visibly labeled in UI.

---

## Compatibility

### Digi-ID
Digi-ID uses a QR code containing a signed URI with a callback. An `ActionEnvelope` of type `login` or `wallet-link` maps to this pattern:
- `payload.callbackUrl` = the server endpoint to POST the signed envelope to
- `payload.challenge` = the nonce
- `requiredSigner` = the RDD address being proven
- `signatureType` = `'rdd-message'` (when live)

See `docs/DIGIID_COMPATIBILITY.md` for full mapping.

### GRIDS
GRIDS uses signed instruction envelopes with a human-readable summary and structured payload. The `ActionEnvelope` type is designed to be compatible:
- `humanReadableSummary` maps to GRIDS human-readable action description
- `payload` maps to GRIDS instruction data
- `signatureType: 'gajumaru-grids'` will invoke the GRIDS signing flow when live

See `docs/GRIDS_COMPATIBILITY.md` for full mapping.

---

## Provider interface

```typescript
interface ActionEnvelopeProvider {
  create(input: CreateEnvelopeInput): ActionEnvelope;
  get(id: string): ActionEnvelope | null;
  submit(id: string, signature: string, signatureType: string): ActionEnvelope;
  expire(id: string): ActionEnvelope;
  cancel(id: string): ActionEnvelope;
}
```

Current implementation: `MockActionEnvelopeProvider` — stores envelopes in memory, sets `signatureType: 'mock'`, must label all signed envelopes clearly.

---

## Security notes

- Envelopes are server-created. A client cannot self-issue a valid envelope.
- `domain` and `origin` are set by the server, not the client.
- Expired envelopes are rejected at submission time, not at display time.
- An envelope may only be submitted once (`status` transitions are one-way).
- Agent-action envelopes require the agent's `controllerKey` to sign (future — mock for now).
