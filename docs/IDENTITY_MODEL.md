# ReddID Identity Model

**Version:** 2 (prototype)  
**Last updated:** 2026-05-26

This document specifies the full data model for ReddID identities, including wallets, social proofs, agents, revocation, and visibility controls. It represents the **target model** for the v0.4 refactor. Fields marked `[v2]` are new relative to the v0.1 schema.

---

## Core Design Principles

1. Root asset is native RDD. All other chains are additive.
2. No private keys stored anywhere in this system.
3. Identity ownership is proven, not granted. Challenge-based proofs, not admin assignment.
4. Pseudonymity is supported and respected. No mandatory KYC.
5. Agents have explicit, bounded, revocable permissions. No ambient authority.
6. Public data is public. Private data is never visible in public API responses.
7. Revocation is permanent and public. Revoked identities are disclosed, not silently deleted.
8. Schema versions enable forward-compatible migrations.

---

## Identity

```typescript
type IdentityType =
  | 'human'          // default for human registrations
  | 'creator'        // content creator, emphasises tipping
  | 'organization'   // company, project, DAO
  | 'bot'            // automated non-AI script
  | 'ai-agent'       // LLM/ML-backed agent
  | 'service';       // API service, infrastructure

type VisibilityLevel = 'public' | 'unlisted' | 'private';

interface Identity {
  // ── Identifiers ───────────────────────────────────────────────────
  id: string;                          // internal UUID-like (generated)
  handle: string;                      // lowercase, 3–30 chars, [a-z0-9-]

  // ── Profile ───────────────────────────────────────────────────────
  identityType: IdentityType;          // [v2] default: 'human'
  displayName: string | null;
  bio: string | null;                  // max 160 chars
  avatar: string | null;               // [v2] URL string; never server-fetched
  website: string | null;
  publicSigningKey: string | null;     // [v2] future: ed25519 pubkey hex

  // ── Wallet linkage ─────────────────────────────────────────────────
  wallets: WalletLink[];               // [v2] replaces rddAddress
  // primaryRddAddress is DERIVED — not stored independently:
  // wallets.find(w => w.chain === 'rdd' && w.primary && !w.revokedAt)?.address

  // ── Social proofs ──────────────────────────────────────────────────
  socialProofs: SocialProof[];

  // ── Agent delegation ───────────────────────────────────────────────
  parentHandle: string | null;         // [v2] null = root identity
  agents: AgentIdentity[];             // [v2] child agent records

  // ── Revocation ─────────────────────────────────────────────────────
  revocationKey: string | null;        // [v2] SHA-256 hash of 64-char hex recovery key
  // plaintext shown ONCE at registration; used via POST /api/identities/[handle]/recover
  // Null for identities registered before Sprint 1 (v0.4.20)
  revokedAt: string | null;            // [v2] ISO timestamp
  revokedReason: string | null;        // [v2] public disclosure

  // ── Authentication ─────────────────────────────────────────────────
  editToken: string;                   // 16-char hex; localStorage-based; single-device
  editTokenCreatedAt: string;          // [v2] 30-day expiry enforced via checkEditToken()
  // NOTE: editToken is NEVER used for agent operations.
  // NOTE: editToken expires after 30 days; POST /api/identities/[handle]/token re-issues.
  // Future: authMethods[] for multi-device and agent credential support.

  // ── Verification state ─────────────────────────────────────────────
  verificationChallenges: Record<string, VerificationChallenge>;

  // ── Metadata ───────────────────────────────────────────────────────
  createdAt: string;                   // ISO timestamp
  updatedAt: string;                   // ISO timestamp
  schemaVersion: number;               // 1 = legacy; 2 = current
}
```

### Derived field: `primaryRddAddress`

Never stored. Always computed:

```typescript
export function primaryRddAddress(identity: Identity): string | null {
  return identity.wallets.find(
    w => w.chain === 'rdd' && w.primary && !w.revokedAt
  )?.address ?? null;
}
```

This ensures the public tip page always reflects the live primary address, even after a wallet rotation.

---

## WalletLink

```typescript
type ChainType = 'rdd' | 'bsc' | 'base' | 'gajumaru' | 'other';
type WalletPurpose = 'receive' | 'tipping' | 'bridge' | 'agent' | 'watch-only';
type WalletProofType = 'none' | 'signed-challenge' | 'self-reported';

interface WalletLink {
  id: string;                          // generated
  chain: ChainType;
  address: string;
  label: string | null;                // user-supplied name, e.g. "Hot wallet"
  purpose: WalletPurpose;
  visibility: VisibilityLevel;
  proofType: WalletProofType;
  proofSignature: string | null;       // future: ECDSA / ed25519 signature
  proofNonce: string | null;           // future: replay-prevention nonce
  verified: boolean;                   // true only if signature verified server-side
  primary: boolean;                    // one primary per chain per identity
  addedAt: string;
  revokedAt: string | null;            // soft-delete
}
```

### Wallet rules

- Maximum 10 wallets per identity (hard limit)
- Exactly one primary wallet per chain (enforced on add)
- Primary wallet cannot be revoked unless another wallet of the same chain is promoted
- RDD wallets: validated as legacy (R…) or SegWit (rdd1…) format
- BSC/Base wallets: EVM hex address `0x…` (not validated cryptographically yet)
- Gajumaru: reserved for future use; not exposed in UI
- `visibility: 'private'` wallets are stripped from all public API responses

### Migration from v1

All v1 records have a single `rddAddress` string. Migration creates:

```json
{
  "id": "<generated>",
  "chain": "rdd",
  "address": "<old rddAddress value>",
  "label": null,
  "purpose": "receive",
  "visibility": "public",
  "proofType": "self-reported",
  "proofSignature": null,
  "proofNonce": null,
  "verified": false,
  "primary": true,
  "addedAt": "<identity.createdAt>",
  "revokedAt": null
}
```

---

## SocialProof

```typescript
type ProofMethod =
  | 'challenge-post'   // user posts 8-char challenge code publicly on platform
  | 'signed-message'   // user signs a message with platform keypair (future)
  | 'dns-txt'          // DNS TXT record proof (future, websites)
  | 'self-reported';   // user claims without any verification mechanism

type VerificationStatus =
  | 'pending'          // challenge issued, not yet confirmed
  | 'verified'         // proof confirmed (trust-based for now)
  | 'failed'           // confirmation attempted and rejected
  | 'expired'          // challenge expired without confirmation
  | 'revoked';         // proof deliberately removed by owner

interface SocialProof {
  id: string;                          // generated
  platform: string;                    // platform id from platforms.ts
  username: string;                    // claimed handle on that platform
  proofMethod: ProofMethod;
  proofUrl: string | null;             // URL where proof was posted
  // NOTE: proofUrl is stored for future server-side verification (S3-01 / Sprint 3).
  // It is NEVER exposed in public API responses — stripped by publicIdentity() serializer.
  proofSignature: string | null;       // future: cryptographic signature
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;           // when verification succeeded
  recheckAfter: string | null;         // future: scheduled re-verification
  visibility: VisibilityLevel;         // controls public API exposure
  addedAt: string;
}

// Public-facing type: proofUrl always stripped
type PublicSocialProof = Omit<SocialProof, 'proofUrl'>;
```

### Verification state machine

```
[challenge issued] → PENDING
     │
     ├─ user posts code + submits proof URL → VERIFIED (trust-based, v0.3)
     ├─ user posts code + auto-verify succeeds → VERIFIED (v0.4)
     ├─ challenge expires (8h) → EXPIRED
     ├─ confirmation attempted but fails → FAILED
     └─ owner deletes proof → REVOKED
```

### VerificationChallenge

```typescript
interface VerificationChallenge {
  code: string;          // 8-char hex, e.g. "a1b2c3d4"
  platform: string;
  createdAt: string;
  expiresAt: string;     // createdAt + 8 hours
  attempts: number;      // max 5 before rate-limiting
}
```

Challenge codes must be included verbatim in a public post, bio, or DNS record on the claimed platform. They are not secret — they are proofs of control, not passwords.

---

## AgentIdentity

Agents are **child identity records under a parent identity**. They are not standalone root handles.

```typescript
type AgentType =
  | 'bot'              // automated non-AI script
  | 'ai-agent'         // LLM/ML-backed agent
  | 'service'          // API service or infrastructure
  | 'automation'       // scheduled or event-driven automation
  | 'human-delegate'   // another human acting on behalf of the owner
  | 'org-delegate';    // organizational sub-entity

interface AgentIdentity {
  id: string;                          // generated
  parentHandle: string;                // the root identity that owns this agent
  agentSlug: string;                   // short name, e.g. "tip-bot"
  displayHandle: string;               // @parent.agent-slug (for display only)
  agentType: AgentType;
  displayPurpose: string;              // public description, max 200 chars

  // ── Authorization ──────────────────────────────────────────────────
  controllerKey: string | null;        // pubkey that can authenticate as this agent
  allowedActions: AgentAction[];       // explicit allowlist
  allowedRails: PaymentRailId[];       // which rails this agent may use

  // ── Spend limits ────────────────────────────────────────────────────
  perTxLimitRdd: number | null;        // max RDD per transaction (null = any)
  dailyLimitRdd: number | null;        // max RDD per calendar day
  monthlyLimitRdd: number | null;      // max RDD per calendar month
  allowedRecipients: string[] | null;  // handle allowlist (null = any registered handle)
  humanApprovalThresholdRdd: number | null; // transactions above this need owner approval

  // ── Lifecycle ──────────────────────────────────────────────────────
  expiresAt: string | null;            // agent auto-expires if set
  revokedAt: string | null;
  revokedReason: string | null;
  activityLogRef: string | null;       // future: pointer to activity log

  createdAt: string;
}

export const AGENT_ACTIONS = [
  'tip',               // initiate payment intents up to per-tx limit
  'read-profile',      // read public identity profiles
  'post-proof',        // submit social proof on parent's behalf
  'create-intent',     // create payment intents (may require approval)
  'read-balance',      // query wallet balance info
] as const;

export type AgentAction = typeof AGENT_ACTIONS[number];
```

### Agent namespace rules

- Root handles: `[a-z0-9-]{3,30}` — NO dots
- Agent `agentSlug`: `[a-z0-9-]{3,30}` — follows same rules as handle
- `displayHandle`: `@{parentHandle}.{agentSlug}` — display-only, not registerable
- Dotted strings are never accepted as root handle registrations
- An agent's `displayHandle` is not a unique identifier — `id` is
- An agent cannot outlive its parent; revoking a parent revokes all agents

### Agent public disclosure

All active agents are publicly visible at `/[handle]/agents`. This is intentional — accountable agent delegation requires transparency.

Public fields: `displayHandle`, `agentType`, `displayPurpose`, `allowedActions`, `expiresAt`

Private fields (not in public response): `controllerKey`, `perTxLimitRdd`, `dailyLimitRdd`, `monthlyLimitRdd`, `allowedRecipients`, `humanApprovalThresholdRdd`

> **Decision note (2026-05-25):** Spend limits are kept private to avoid adversarial exploitation (attackers knowing the approval threshold). `displayPurpose` provides sufficient public accountability.

---

## PaymentIntent

```typescript
type PaymentAsset = 'rdd' | 'wrdd-bsc' | 'wrdd-base' | 'rdd-rail';
type PaymentRailId = 'native-rdd' | 'bsc-wrdd' | 'base-wrdd' | 'gajumaru-rail' | 'mock';
type PaymentStatus =
  | 'draft'            // created but not yet shared
  | 'requested'        // shared with payer, awaiting action
  | 'signed'           // payer has signed the tx
  | 'submitted'        // tx broadcast to network
  | 'confirmed'        // tx confirmed on-chain
  | 'failed'           // tx failed
  | 'cancelled'        // cancelled before submission
  | 'expired';         // expiresAt passed without action

interface PaymentIntent {
  id: string;
  fromHandle: string | null;           // null = anonymous tip
  toHandle: string;
  toAddress: string;                   // populated from primary wallet at creation time
  amount: number;                      // in RDD units (not satoshis)
  asset: PaymentAsset;
  rail: PaymentRailId;
  memo: string | null;                 // max 160 chars
  platform: string | null;            // originating context (twitter, kick, etc.)
  agentId: string | null;             // if created by an agent
  status: PaymentStatus;
  requiresApproval: boolean;          // true if agent's humanApprovalThreshold exceeded
  approvedAt: string | null;
  txid: string | null;
  externalRef: string | null;
  createdAt: string;
  expiresAt: string;                   // createdAt + 24h default
  updatedAt: string;
}
```

### Payment intent rules

- `toHandle` must exist and have a public primary RDD wallet
- `amount` must be > 0 and ≤ 1,000,000 RDD
- Default rail: `'native-rdd'` (routes to `MockRail` until `NativeRddRail` is live)
- All intents created through `MockRail` are labeled as mock in their response
- Intents expire after 24h; status transitions to `'expired'` at read time
- Agent-initiated intents check `perTxLimitRdd` and `humanApprovalThresholdRdd` before creation

---

## Revocation Model

### Identity revocation

An identity can be revoked by the holder of `revocationKey`. Once revoked:
- Public profile shows revocation banner with `revokedAt` and `revokedReason`
- No payment intents can be created for a revoked identity
- All agent sub-identities are implicitly revoked
- Wallet addresses are not shown on the public profile (prevent fraudulent re-use)
- The handle is not freed for re-registration (prevents squatting on the revoked name)

### Wallet revocation

Soft-delete. Sets `revokedAt`. The wallet record is retained for audit purposes. A new wallet must be promoted to primary before the current primary can be revoked.

### Agent revocation

Soft-delete. Sets `revokedAt` and `revokedReason`. Revoked agents are not shown in public agent listings. Parent can revoke any of their agents. Agents cannot revoke themselves.

### Social proof revocation

Owner calls `DELETE /api/identities/[handle]/socials/[platform]` (requires editToken). The store calls `removeSocialProof()`, which soft-deletes by setting `verificationStatus: 'revoked'`. The record is retained for audit. Revoked proofs are filtered from all public API responses by `publicIdentity()`. The underlying social account is not affected and can be re-added with a fresh challenge if desired.

---

## Visibility and Privacy Model

### Three-tier visibility

| Level | Public API | Owner (editToken) | Admin |
|---|---|---|---|
| `public` | ✅ visible | ✅ visible | ✅ visible |
| `unlisted` | ❌ hidden | ✅ visible | ✅ visible |
| `private` | ❌ hidden | ✅ visible | ✅ visible |

Default visibility:
- Wallet added via UI: `public`
- Social proof: `public`
- Future: user can change any wallet or proof to `unlisted` or `private`

### `publicIdentity()` serializer

Strips from all public API responses:
- `editToken`
- `editTokenCreatedAt`
- `verificationChallenges`
- `revocationKey`
- All wallets where `visibility !== 'public'` or `revokedAt !== null`
- All social proofs where `visibility !== 'public'` or `verificationStatus === 'revoked'`
- `proofUrl` from every social proof (exposed as `PublicSocialProof[]` — proofUrl stored server-side only)
- All agent fields except: `displayHandle`, `agentType`, `displayPurpose`, `allowedActions`, `expiresAt`
- Replaces `agents[]` with `agentCount: number` (full list at `/[handle]/agents`)

Adds to public response:
- `agentCount: number` (derived)
- `primaryRddAddress: string | null` (derived from wallets[])

---

## Handle and Namespace Policy

### Root handle rules

```
Format:  [a-z0-9][a-z0-9-]*[a-z0-9]
Length:  3–30 characters
Dots:    NOT allowed in root handles
Case:    lowercase only (sanitized on input)
Start:   alphanumeric only
End:     alphanumeric only
Double:  no consecutive hyphens
```

### Reserved handles (minimum set)

```
Route paths:
  admin, api, register, roadmap, reserve, docs, explore, platforms,
  edit, verify, card, live, staking, bridge, guide, privacy, terms,
  search, agents, agent, wallet, wallets, payments, pay

Brand:
  reddcoin, redd, reddid, reddmobile, reddweb, reddrail, reddbridge,
  reddlove, rarestake, rarestaketech

App/role:
  support, team, official, me, settings, help, about, contact,
  status, tip, creator, root, moderator, mod, bot, ai, system

Abuse/system:
  null, undefined, anonymous, superuser

Crypto confusion:
  bitcoin, ethereum, solana, cardano
```

### Agent namespace

Agent slugs are stored as records within the parent identity. They are not registered in the root handle namespace. The `displayHandle` format (`@parent.agentslug`) is display-only and uses the same character rules as root handles for the `agentslug` portion.

Dotted strings (`alice.bot`) cannot be registered as root handles. The dot is not a valid character in root handle regex.
