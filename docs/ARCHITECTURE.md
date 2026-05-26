# ReddWeb Architecture

**Product:** ReddWeb — the public web surface of the ReddID ecosystem  
**Repo:** `reddid-web` (Next.js 16, TypeScript strict, App Router)  
**Status:** v0.4 prototype — flat-file DB, adapter interfaces partially defined  
**Last updated:** 2026-05-25

---

## Product Vocabulary

| Term | Definition |
|---|---|
| **RDD** | Native ReddCoin — the root asset. A UTXO coin from 2014, Bitcoin/Litecoin-derived. Not an ERC-20 token. |
| **ReddID** | The identity, naming, wallet-linkage, social proof, delegation, reputation, and revocation layer. |
| **ReddMobile** | Future user control surface — PWA/app for managing identity, wallets, tipping, agents, and payment rails. |
| **ReddWeb** | The public web surface: public profiles, creator pages, identity lookup, dashboards. This repo. |
| **ReddRail** | Future social-payment rail. Likely powered by Gajumaru/Groot/Associate Chains/state channels. Not live. |
| **ReddBridge** | Future reserve/accounting bridge for native RDD ↔ wRDD ↔ ReddRail representations. Not live. |
| **wRDD** | Future wrapped ReddCoin on EVM chains (BSC first, possibly Base). Liquidity plumbing, not the main story. |
| **Gajumaru** | Likely future high-throughput infrastructure partner for state-channel micropayments. Not live. |

---

## Current Architecture (v0.4)

```
┌─────────────────────────────────────────────────────────┐
│                     reddid-web                          │
│            (Next.js 16, App Router, TypeScript)         │
│                                                         │
│  Pages                    API Routes                    │
│  ─────                    ──────────                    │
│  / (home)                 GET  /api/identities          │
│  /register                POST /api/identities          │
│  /[handle]                GET  /api/identities/[handle] │
│  /explore                 PUT  /api/identities/[handle] │
│  /platforms               GET  /api/identities/by-social│
│  /edit/[handle]           GET  /api/explore             │
│  /verify                  GET  /api/search              │
│  /card/[handle]           GET  /api/og/[handle]         │
│  /live/[handle]           GET  /api/live/[handle]/events│
│  /pay/[handle]            GET  /api/reserve             │
│  /bridge                  POST /api/verify/challenge    │
│  /staking                 POST /api/verify/confirm      │
│  /roadmap                 POST /api/payments            │
│  /reserve                 GET  /api/payments/[id]       │
│  /docs                    GET  /api/agents/[handle]     │
│  /guide                   POST /api/agents/[handle]     │
│  /privacy                 DELETE /api/agents/[h]/[id]  │
│  /terms                   GET  /api/identities/[h]/wallets│
│  /agents                  POST /api/identities/[h]/wallets│
│  /[handle]/agents         DELETE /api/identities/[h]/wallets/[id]│
│                                                         │
│  src/lib/                                               │
│  ─────────                                              │
│  types/          ← domain types (Identity, Wallet, …)  │
│  store/          ← DataStore interface + JsonFile impl  │
│  adapters/       ← PaymentRail, SocialProof, Bridge, … │
│  platforms.ts    ← canonical platform registry         │
│  validation.ts   ← handle/address/URL validation       │
│                                                         │
│  Data layer                                             │
│  ──────────                                             │
│  data/db.json    ← flat-file JSON (prototype only)      │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  External APIs (real)                   │
│  CoinGecko — price/market data          │
│  Blockbook v2 — on-chain tx/balance     │
└─────────────────────────────────────────┘
```

---

## Target Architecture (post-refactor)

### Layer model

```
┌──────────────────────────────────────────────────────────────┐
│  Presentation layer (Next.js pages + components)             │
└──────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  API route layer (src/app/api/**)                            │
│  - Validates input (Zod schemas)                             │
│  - Calls getStore() for all data operations                  │
│  - Calls adapters for payment/proof/bridge operations        │
│  - Returns publicIdentity() for all external responses       │
└──────────────────────────────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
┌──────────────────────┐   ┌────────────────────────────────┐
│  DataStore interface │   │  Adapter interfaces             │
│  (src/lib/store/)    │   │  (src/lib/adapters/)           │
│                      │   │                                 │
│  JsonFileDataStore   │   │  PaymentRailAdapter             │
│  (current impl)      │   │    → MockRail (current)         │
│                      │   │    → NativeRddRail (stub)       │
│  Future:             │   │    → GajumaruRail (future)      │
│  TursoDataStore      │   │                                 │
│  PostgresDataStore   │   │  SocialProofProvider            │
└──────────────────────┘   │    → ChallengePostProvider      │
                           │    → AutoVerifyProvider (future)│
                           │                                 │
                           │  BridgeStatusAdapter            │
                           │    → MockBridgeStatus (current) │
                           │    → LiveBridgeStatus (future)  │
                           │                                 │
                           │  WalletLinkProvider             │
                           │    → SelfReportedProvider       │
                           │    → SignedChallengeProvider    │
                           └────────────────────────────────┘
```

---

## DataStore Abstraction

**Current problem:** Every API route imports directly from `@/lib/db`. Swapping the database requires touching every file.

**Solution:** A `DataStore` interface, with `JsonFileDataStore` as the concrete implementation. All routes call `getStore()` from `src/lib/store/index.ts`.

```typescript
// src/lib/store/interface.ts — abbreviated
export interface DataStore {
  // Identity
  getIdentity(handle: string): Identity | null;
  getIdentityById(id: string): Identity | null;
  getIdentityBySocial(platform: string, username: string): Identity | null;
  getAllIdentities(): Identity[];
  createIdentity(input: CreateIdentityInput): Identity;
  updateIdentity(handle: string, editToken: string, updates: UpdateIdentityInput): Identity;
  revokeIdentity(handle: string, revocationKey: string, reason: string): Identity;

  // Wallets
  addWalletLink(handle: string, editToken: string, wallet: CreateWalletInput): WalletLink;
  removeWalletLink(handle: string, editToken: string, walletId: string): void;
  listWallets(handle: string, includePrivate: boolean): WalletLink[];

  // Social Proofs
  createChallenge(handle: string, platform: string, editToken: string): VerificationChallenge;
  recordSocialProof(handle: string, proof: CreateSocialProofInput, editToken: string): SocialProof;
  updateProofStatus(handle: string, proofId: string, status: VerificationStatus): void;

  // Agents
  createAgent(handle: string, editToken: string, agent: CreateAgentInput): AgentIdentity;
  listAgents(handle: string, includeRevoked: boolean): AgentIdentity[];
  revokeAgent(handle: string, editToken: string, agentId: string, reason: string): void;

  // Payment Intents
  createPaymentIntent(intent: CreatePaymentIntentInput): PaymentIntent;
  getPaymentIntent(id: string): PaymentIntent | null;
  updatePaymentStatus(id: string, status: PaymentStatus, txid?: string): PaymentIntent;

  // Utility
  countIdentities(): number;
  searchIdentities(query: string, limit: number): Identity[];
}
```

**Singleton export:**
```typescript
// src/lib/store/index.ts
import { JsonFileDataStore } from './json-file';
let store: DataStore | null = null;
export function getStore(): DataStore {
  if (!store) store = new JsonFileDataStore();
  return store;
}
```

**File locations:**
```
src/lib/store/
  interface.ts     ← DataStore interface
  json-file.ts     ← JsonFileDataStore (current db.ts logic, migrated)
  migrate.ts       ← schema migration v1 → v2
  index.ts         ← getStore() singleton
```

**Migration rule (v1 → v2):**
- `rddAddress` string → `wallets: [{ chain:'rdd', address: rddAddress, primary: true, purpose:'receive', visibility:'public', proofType:'self-reported', verified: false }]`
- `verificationChallenges: Record<string, string>` → `Record<string, VerificationChallenge>` (add `expiresAt`, `attempts`)
- `socialProofs[].proofUrl` → add `id`, `proofMethod`, `verificationStatus`, `visibility`
- Add `identityType: 'human'`, `agents: []`, `parentHandle: null`
- Add `revokedAt: null`, `revokedReason: null`, `revocationKey: null`
- Add `avatar: null`, `publicSigningKey: null`
- Add `editTokenCreatedAt: createdAt`
- Set `schemaVersion: 2`

---

## Adapter Model

### PaymentRailAdapter

Interface that every payment rail must implement. Current: `MockRail`. Future: `NativeRddRail`, `GajumaruRail`, `BSCwRDDRail`.

```typescript
interface PaymentRailAdapter {
  readonly id: PaymentRailId;
  readonly displayName: string;
  readonly isLive: boolean;
  readonly assetSymbol: string;

  createPaymentIntent(params): Promise<PaymentIntent>;
  estimateFee(amount, toAddress): Promise<FeeEstimate>;
  requestSignature(intent): Promise<SignatureRequest>;
  submitPayment(intentId, signature): Promise<SubmitResult>;
  getPaymentStatus(intentId): Promise<PaymentStatus>;
  cancelPayment(intentId): Promise<void>;
}
```

`getRail(id)` factory returns the correct implementation. Any rail not registered throws.

### SocialProofProvider

Interface for verifying social proof claims. Current: `ChallengePostProvider` (trust-based). Future: `AutoVerifyProvider` (platform API scraping).

```typescript
interface SocialProofProvider {
  readonly platform: string;
  readonly supportsAutoVerify: boolean;
  generateChallenge(handle: string): string;
  verifyProof(params): Promise<VerifyResult>;
}
```

### BridgeStatusAdapter

Interface for the reserve dashboard. Current: `MockBridgeStatus` (all zeros). Future: `LiveBridgeStatus` (real RDD reserve indexing).

```typescript
interface BridgeStatusAdapter {
  readonly isLive: boolean;
  getStatus(): Promise<BridgeStatus>;
}
```

### WalletLinkProvider

Interface for proving wallet ownership. Current: `SelfReportedProvider` (stores address, no cryptographic proof). Future: `SignedChallengeProvider` (ECDSA / reddcoinjs-lib).

```typescript
interface WalletLinkProvider {
  readonly chain: ChainType;
  generateNonce(): string;
  buildSigningMessage(handle, address, nonce): string;
  verifySignature(message, signature, address): Promise<WalletVerifyResult>;
}
```

---

## ReddID / ReddMobile / ReddWeb / ReddRail / ReddBridge Boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│  ReddID Layer (identity.ts, store/, adapters/)                   │
│  - Handles, wallets, social proofs, agents, revocation           │
│  - Lives in this repo as the data model and API                  │
│  - Future: on-chain anchoring via RDD Core or Gajumaru           │
├──────────────────────────────────────────────────────────────────┤
│  ReddWeb Layer (src/app/**)                                      │
│  - Public profiles, creator pages, explore, lookup               │
│  - Lives in this repo as the web surface                         │
├──────────────────────────────────────────────────────────────────┤
│  ReddMobile Layer (future)                                       │
│  - PWA or native app for user control                            │
│  - Consumes ReddID API; not in this repo yet                     │
├──────────────────────────────────────────────────────────────────┤
│  ReddRail Layer (future, adapters/payment-rail.ts interface)     │
│  - Social-payment rail on Gajumaru/Groot/Associate Chains        │
│  - Adapter interface designed here; implementation separate      │
├──────────────────────────────────────────────────────────────────┤
│  ReddBridge Layer (future, adapters/bridge-status.ts interface)  │
│  - RDD ↔ wRDD ↔ ReddRail bridge and reserve accounting          │
│  - Status interface designed here; bridge contract separate      │
└──────────────────────────────────────────────────────────────────┘
```

**Critical constraints:**
- This repo never touches private keys
- This repo does not custody funds
- This repo must function without Gajumaru being live
- wRDD/BSC/Base integrations are additive via adapter pattern
- The DataStore can be swapped without touching API routes

---

## Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Async params, Server Components, Route Handlers |
| Language | TypeScript 5 (strict) | No `any` except legacy migration paths |
| Validation | Zod 4 | Runtime schema validation on all API inputs |
| Icons | Lucide React | Consistent icon set |
| QR | react-qr-code | BIP21 payment QR generation |
| Styling | Inline CSS-in-JSX | No Tailwind in use despite being installed |
| DB (prototype) | Flat JSON file | `data/db.json`, single-process, no concurrent writes |
| DB (future) | Turso / LibSQL or Postgres | Swap via DataStore interface |
| Price API | CoinGecko `simple/price` | Real, 5-min refresh |
| Chain API | Blockbook v2 | Real, address balance + tx history |
| OG images | `@vercel/og` (ImageResponse) | Node.js runtime (not edge) |
| CI | GitHub Actions | tsc, build, eslint |

> **Warning — SQLite (Sprint 4, S4-01):** The planned SQLite data store must only be used with a **single Railway instance**. SQLite uses file-level write locking; under Railway auto-scaling or any multi-instance deployment on a shared volume, concurrent writers will cause data corruption or crashes. If horizontal scaling becomes necessary before migrating to Turso/Postgres, disable auto-scaling and pin to exactly one replica.

---

## What Is Mocked (Must Be Labeled in UI)

| Feature | Reality | Label Required |
|---|---|---|
| Live session tips | Simulated random events | "Demo Mode — Simulated Activity" |
| Reserve dashboard | All zeros, placeholder | "Not Live — Placeholder Data" |
| Bridge page | Static concept page | "Concept — Not Active" |
| Staking calculator | Pure arithmetic | "Estimate Only — Not Financial Advice" |
| Social proof verify | Trust-based self-report | "Self-Reported — Not Independently Verified" |
| Payment rail | MockRail — no real tx | Mock status on all payment intents |

---

## File Map Summary

```
src/
├── app/
│   ├── api/               ← route handlers (all use getStore())
│   ├── [handle]/          ← public profile + agents disclosure
│   ├── agents/            ← my agents management (editToken required)
│   ├── pay/[handle]/      ← payment request page (no login)
│   ├── guide/             ← user guide
│   ├── privacy/           ← privacy policy
│   └── terms/             ← terms of use
├── components/            ← shared UI components
└── lib/
    ├── types/             ← core domain types (identity, payment, proof, agent)
    ├── store/             ← DataStore interface + JsonFileDataStore
    ├── adapters/          ← PaymentRail, SocialProof, Bridge, WalletLink
    ├── platforms.ts       ← platform registry
    └── validation.ts      ← handle/address/URL validation + reserved list
docs/
├── ARCHITECTURE.md        ← this file
├── PRODUCT_SPEC.md
├── IDENTITY_MODEL.md
├── SECURITY_PRIVACY.md
├── ROADMAP.md
└── GITHUB_ISSUES_DRAFT.md
TODO.md
README.md
ARCHITECTURE.md
SECURITY.md
CONTRIBUTING.md
```
