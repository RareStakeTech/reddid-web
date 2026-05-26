# ReddID Next — Architecture

**Version:** v0.4.12  
**Last updated:** 2026-05-25

This document describes the system design, directory layout, data model, adapter interfaces, and deployment approach for `reddid-web` (the Next.js web application). It is the authoritative reference for contributors and is read alongside `CONTRIBUTING.md` and `docs/ROADMAP.md`.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Directory Layout](#directory-layout)
3. [Data Model](#data-model)
4. [DataStore Layer](#datastore-layer)
5. [Provider / Adapter Layer](#provider--adapter-layer)
6. [API Routes](#api-routes)
7. [Page Routes](#page-routes)
8. [Client vs Server Components](#client-vs-server-components)
9. [Configuration & Environment Variables](#configuration--environment-variables)
10. [Deployment](#deployment)

---

## Design Principles

**Interface-first, mock-fast.** Every external dependency (database, payment rails, social proof verification, blockchain RPCs) is accessed through a typed interface. Mock implementations ship as default; production replacements are drop-in swaps with no call-site changes.

**No server state in the edge.** The app runs on a Node.js server (Railway / self-hosted). `JsonFileDataStore` persists identities to `data/db.json` on a persistent volume. SQLite (`SqliteDataStore`) is the planned v0.4 upgrade path.

**Non-custodial by design.** ReddID never holds private keys. Wallet linkage records addresses and optional signatures; the actual transaction happens in the user's wallet application.

**App Router conventions.** All pages use Next.js App Router. `params` and `searchParams` must be awaited in server components. Client interactivity lives in `'use client'` components; server components render data and wrap client components.

---

## Directory Layout

```
reddid-web/
├── src/
│   ├── app/                        # Next.js App Router pages + API routes
│   │   ├── [handle]/               # Public tip page (server component)
│   │   ├── api/                    # REST API endpoints (all server-side)
│   │   │   ├── agents/[handle]/    # Agent CRUD
│   │   │   ├── identities/         # Identity CRUD + wallet + social lookup
│   │   │   ├── og/[handle]/        # OG image generation (Edge runtime)
│   │   │   ├── payments/           # Payment intent lifecycle
│   │   │   ├── search/             # Fuzzy handle search
│   │   │   ├── verify/             # Social proof challenge + confirm
│   │   │   ├── explore/            # Directory listing
│   │   │   ├── live/[handle]/      # SSE event stream
│   │   │   ├── report/             # Abuse reports
│   │   │   └── reserve/            # Bridge reserve snapshot
│   │   ├── card/[handle]/          # Shareable tip card (+ QR download)
│   │   ├── edit/[handle]/          # Identity edit form
│   │   ├── explore/                # Creator directory with search/filter
│   │   ├── guide/                  # User guide page
│   │   ├── pay/[handle]/           # BIP21 payment request page
│   │   ├── platforms/              # Platform support matrix
│   │   ├── register/               # Handle registration form
│   │   ├── search/                 # Handle search results (client page)
│   │   ├── staking/                # PoSV staking calculator
│   │   ├── verify/                 # Social proof flow
│   │   ├── bridge/, reserve/       # ReddBridge concept pages
│   │   ├── docs/, roadmap/         # Technical docs pages
│   │   ├── privacy/, terms/        # Legal pages
│   │   ├── live/[handle]/          # Live session (SSE demo)
│   │   ├── layout.tsx              # Root layout (NavBar, fonts, metadata)
│   │   ├── page.tsx                # Homepage
│   │   ├── not-found.tsx           # Custom 404
│   │   ├── error.tsx               # Error boundary
│   │   └── sitemap.ts              # Dynamic sitemap
│   ├── components/                 # Reusable client + server components
│   │   ├── NavBar.tsx              # Top navigation (server, QuickLookup client)
│   │   ├── QuickLookup.tsx         # Handle search widget ('use client')
│   │   ├── LiveBalance.tsx         # Async balance from Blockbook ('use client')
│   │   ├── MarketTicker.tsx        # CoinGecko price ticker ('use client')
│   │   ├── RecentTips.tsx          # Latest Blockbook transactions
│   │   ├── QRCodeDisplay.tsx       # QR code rendering
│   │   ├── ShareButton.tsx         # Web Share API / clipboard ('use client')
│   │   ├── CopyButton.tsx          # Clipboard copy button ('use client')
│   │   ├── CountUp.tsx             # Animated counter ('use client')
│   │   └── TrustBadge.tsx          # Proof-status badge
│   └── lib/                        # Server-side business logic
│       ├── types.ts                # All domain types (Identity, WalletLink, ...)
│       ├── config.ts               # Environment variable config with defaults
│       ├── db.ts                   # Convenience wrappers around getStore()
│       ├── migrate.ts              # DB schema migration (v1 → v2)
│       ├── platforms.ts            # Canonical 17-platform registry
│       ├── rate-limit.ts           # In-memory rate limiting
│       ├── validation.ts           # Handle + address validators
│       ├── store/
│       │   ├── interface.ts        # DataStore interface
│       │   ├── index.ts            # getStore() factory
│       │   └── json-file-store.ts  # Flat-JSON implementation (default)
│       └── providers/
│           ├── *.ts                # Provider interfaces (one file per domain)
│           ├── index.ts            # getProviders() registry
│           └── mock/               # Mock implementations (all active in MVP)
├── public/                         # Static assets
│   ├── brand/                      # SVG logos from brand.reddcoin.com
│   ├── icon-192.png, icon-512.png  # PWA icons
│   └── manifest.webmanifest        # PWA manifest
├── docs/                           # Extended documentation
│   ├── ROADMAP.md                  # Feature roadmap + sprint backlog
│   └── IDENTITY_MODEL.md           # Deep-dive on Identity v2 schema
├── scripts/
│   └── generate-icons.js           # SVG → PNG PWA icon generator (sharp)
├── ARCHITECTURE.md                 # This file
├── CONTRIBUTING.md                 # Contributor guide
├── SECURITY.md                     # Responsible disclosure policy
├── CHANGELOG.md                    # Per-version change log
└── .env.example                    # Documented environment variables
```

---

## Data Model

All types live in `src/lib/types.ts`. Key types:

### `Identity`

The central record. Supports v1 (bare `rddAddress`) and v2 (rich `wallets[]`) via the `schemaVersion` field. `primaryRddAddress()` is a type-level helper that handles both schemas.

```
Identity
├── id, handle, createdAt, updatedAt
├── identityType       ('human' | 'creator' | 'organization' | 'bot' | 'ai-agent' | 'service')
├── displayName, bio, avatar, website
├── rddAddress         (deprecated v1; retained for migration fallback)
├── wallets[]          (v2; WalletLink records, one primary per chain)
├── socialProofs[]     (platform + username + verificationStatus)
├── verificationChallenges  (per-platform challenge codes + expiry + attempts)
├── agents[]           (child AgentIdentity records)
├── editToken          (single-token auth for self-service edits)
└── revokedAt          (soft-delete)
```

### `WalletLink`

Replaces the v1 `rddAddress` string. Tracks chain, purpose, proof type, and revocation.

```
WalletLink
├── id, chain ('rdd' | 'bsc' | 'base' | 'gajumaru' | 'other')
├── address, label, purpose, visibility
├── primary            (one primary per chain per identity)
├── proofType          ('none' | 'signed-challenge' | 'self-reported')
├── proofSignature, proofNonce, verified
└── addedAt, revokedAt
```

### `SocialProof`

A linked social platform entry. `verificationStatus` moves from `pending` → `verified` (trust-based in v0.3; API-verified in v0.5).

### `AgentIdentity`

A child record representing an AI agent, bot, or delegate acting on behalf of an identity. Contains spend limits (hidden from public API via `PublicAgent`), allowed actions, allowed payment rails, and revocation fields.

### `PaymentIntent`

Tracks a payment request lifecycle from `draft` through `submitted`/`confirmed`/`failed`. Snapshots the recipient's address at creation time so address changes don't affect in-flight payments.

### `PublicIdentity` / `PublicAgent`

Serialised views with sensitive fields removed. `editToken`, `verificationChallenges`, `revocationKey`, private-visibility wallets, revoked agents, and agent spend limits are all stripped.

### `DbSchema`

The flat-JSON database schema:
```ts
interface DbSchema {
  identities: Identity[];
  revocationEvents: RevocationEvent[];
  version: number;           // schema migration version
}
```

---

## DataStore Layer

```
src/lib/store/
├── interface.ts      ← DataStore interface
├── index.ts          ← getStore() factory
└── json-file-store.ts
```

### `DataStore` interface

Defines all persistence operations: `getIdentity`, `getByHandle`, `getAllIdentities`, `createIdentity`, `updateIdentity`, `addWallet`, `removeWallet`, `addSocialProof`, `addAgent`, `removeAgent`, `createPaymentIntent`, `getPaymentIntent`, `updatePaymentIntentStatus`, `getAbuseReports`, `addAbuseReport`.

### `JsonFileDataStore` (current default)

Reads and writes `data/db.json` (path configurable via `REDDID_DB_PATH`). All writes are synchronous `fs.writeFileSync`. Not safe under high concurrent writes — use SQLite for production scale.

### Swapping to SQLite (planned v0.4)

Implement `SqliteDataStore` satisfying the same `DataStore` interface using `better-sqlite3`. Register it in `getStore()`. No route files change.

```ts
// src/lib/store/index.ts (future)
export function getStore(): DataStore {
  if (process.env.USE_SQLITE === 'true') return new SqliteDataStore();
  return new JsonFileDataStore();
}
```

---

## Provider / Adapter Layer

```
src/lib/providers/
├── *.ts              ← Interface definitions (one per domain concern)
├── index.ts          ← getProviders() singleton registry
└── mock/             ← Mock implementations (all active in MVP)
```

`getProviders()` returns a singleton `Providers` object. All 12 providers are mock implementations in MVP. Swap by replacing `new Mock*()` with the real class — the `Providers` interface enforces the contract.

| Provider | Interface | Mock | Real (future) |
|---|---|---|---|
| `policyEngine` | `PolicyEngine` | Always allows | Per-agent spend-limit checks |
| `revocationRegistry` | `RevocationRegistry` | Writes to `db.json` | SQLite table |
| `trustEvaluator` | `TrustEvaluator` | Returns `self-reported` | Proof analysis engine |
| `credentialProvider` | `CredentialProvider` | In-memory Map | SQLite / IPFS |
| `envelopeProvider` | `ActionEnvelopeProvider` | In-memory Map | SQLite |
| `presentationProvider` | `PresentationProvider` | In-memory Map | SQLite |
| `signatureVerifier` | `SignatureVerifier` | Always returns `true` | reddcoinjs-lib ECDSA |
| `instructionSigner` | `InstructionSigner` | No-op | GRIDS/reddcoinjs |
| `paymentRail` | `PaymentRailAdapter` | Returns mock txid | NativeRddRail (Blockbook) |
| `paymentIntentProvider` | `PaymentIntentProvider` | In-memory Map | SQLite |
| `socialProofAdapter` | `SocialProofAdapter` | Trust-based passthrough | Platform API scraper |
| `bridgeStatusAdapter` | `BridgeStatusAdapter` | Returns zeros + `isLive: false` | LiveBridgeStatus |

**Important:** Mock providers that use in-memory Maps (credentials, envelopes, presentations, payment intents) are reset on server restart. This is expected in MVP and documented.

---

## API Routes

All API routes live under `src/app/api/`. All are server-only (no `'use client'`).

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/identities` | Register a new handle |
| `GET` | `/api/identities/[handle]` | Get public identity |
| `PUT/PATCH` | `/api/identities/[handle]` | Update identity (requires editToken) |
| `GET` | `/api/identities/by-social` | Look up identity by platform + username |
| `POST` | `/api/identities/[handle]/wallets` | Add a wallet |
| `DELETE` | `/api/identities/[handle]/wallets/[walletId]` | Remove a wallet |
| `POST` | `/api/agents/[handle]` | Create an agent |
| `GET` | `/api/agents/[handle]` | List agents for a handle |
| `DELETE` | `/api/agents/[handle]/[id]` | Revoke an agent |
| `POST` | `/api/verify/challenge` | Issue a social proof challenge code |
| `POST` | `/api/verify/confirm` | Confirm a social proof challenge |
| `GET` | `/api/explore` | Directory listing (all public identities) |
| `GET` | `/api/search?q=&limit=` | Fuzzy handle + display name search |
| `POST` | `/api/payments` | Create a payment intent |
| `GET` | `/api/payments/[id]` | Get a payment intent |
| `GET` | `/api/reserve` | Bridge reserve snapshot |
| `POST` | `/api/report` | Submit an abuse report |
| `GET` | `/api/og/[handle]` | OG image (PNG, Edge runtime) |
| `GET` | `/api/live/[handle]/events` | SSE stream (demo mode) |

### Authentication

Self-service mutations (edit, add wallet, create agent, revoke agent) require an `editToken` in the request body or `Authorization: Bearer` header. The editToken is issued at registration and is single-factor. There is no session system.

---

## Page Routes

| Route | Type | Description |
|---|---|---|
| `/` | Server | Homepage — recent registrations, feature overview |
| `/[handle]` | Server | Public tip page |
| `/register` | Client | Handle registration form |
| `/edit/[handle]` | Client | Identity edit form + profile completion indicator |
| `/verify` | Client | Social proof challenge flow |
| `/explore` | Client | Creator directory with search/filter/pagination |
| `/search` | Server + Client | Handle search results (`Suspense` wrapper) |
| `/pay/[handle]` | Server + Client | BIP21 payment request page |
| `/card/[handle]` | Server + Client | Shareable tip card + QR download |
| `/live/[handle]` | Client | Live session demo (SSE) |
| `/guide` | Server | User guide |
| `/platforms` | Server | Platform support matrix |
| `/staking` | Server + Client | PoSV staking calculator |
| `/bridge` | Server | ReddBridge concept (labeled "Not Live") |
| `/reserve` | Server | Bridge reserve dashboard |
| `/roadmap` | Server | Roadmap page |
| `/docs` | Server | Technical design doc |
| `/privacy` | Server | Privacy policy |
| `/terms` | Server | Terms of use |

---

## Client vs Server Components

The App Router default is Server Components. Use `'use client'` only when the component needs:
- React state or effects (`useState`, `useEffect`, `useRef`)
- Browser APIs (`navigator.clipboard`, `window.print`, `XMLSerializer`)
- Event handlers (`onClick`, `onChange`)
- Next.js client hooks (`useRouter`, `useSearchParams`, `usePathname`)

**Pattern: server page wraps client component in Suspense**

Required for any page using `useSearchParams`:
```tsx
// page.tsx (server)
import { Suspense } from 'react';
import SearchClient from './SearchClient';

export default function SearchPage() {
  return <Suspense fallback={<Spinner />}><SearchClient /></Suspense>;
}

// SearchClient.tsx ('use client')
'use client';
import { useSearchParams } from 'next/navigation';
```

**Pattern: extract client buttons from server card pages**

Server components cannot have `onClick`. Extract all interactive buttons to a `'use client'` sibling:
```tsx
// card/[handle]/page.tsx (server) — renders data, imports client buttons
import CardClientButtons from './CardClientButtons';
// ...
<CardClientButtons handle={...} addr={...} />

// card/[handle]/CardClientButtons.tsx — 'use client', all interactive logic
'use client';
```

---

## Configuration & Environment Variables

All configuration lives in `src/lib/config.ts`. Server-only values use bare env var names; values needed in the browser must use the `NEXT_PUBLIC_` prefix.

| Variable | Default | Used in |
|---|---|---|
| `REDDID_DB_PATH` | `{cwd}/data/db.json` | `JsonFileDataStore`, `MockRevocationRegistry`, `migrate.ts` |
| `REDDID_BLOCKBOOK_URL` | `https://blockbook.reddcoin.com` | Server-side API calls |
| `NEXT_PUBLIC_REDDID_BLOCKBOOK_URL` | `https://blockbook.reddcoin.com` | `LiveBalance.tsx` (client component) |
| `NEXT_PUBLIC_REDDID_BASE_URL` | `https://redd.love` | `sitemap.ts`, OG URLs, canonical links |
| `NODE_ENV` | — | Next.js standard |

See `.env.example` for full documentation and Railway deployment notes.

---

## Deployment

### Development

```bash
cp .env.example .env.local
npm install
npm run dev
```

The `data/` directory is created automatically on first write. It is gitignored.

### Production (Railway)

1. Add a **Railway Volume** mounted at `/app/data`
2. Set `REDDID_DB_PATH=/app/data/db.json`
3. Set `NEXT_PUBLIC_REDDID_BASE_URL=https://redd.love`
4. `npm run build && npm start` (Railway auto-detects Next.js)

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs:
- `npx tsc --noEmit` — TypeScript type check
- `npm run build` — full Next.js build
- `npm run lint` — ESLint zero-warnings gate

All three must pass before merging to `master`.

### Persistence notes

- `JsonFileDataStore` uses synchronous reads/writes. Safe for single-server deployments; not safe under concurrent high-write load.
- In-memory providers (credentials, envelopes, payment intents) are reset on server restart. This is expected in MVP.
- Planned upgrade: `SqliteDataStore` with `better-sqlite3` for atomic writes and concurrent safety.

---

## Future Integration Points

### Gajumaru / ReddRail (v1.0)

The `PaymentRailAdapter` interface is already defined. Add `GajumaruRail` implementing it and register in `getProviders()`. No route changes needed.

### Platform API Verification (v0.5)

`SocialProofAdapter` currently trusts user claims (`MockSocialProofAdapter` returns `verified` on every `confirm()` call). Replace with a real adapter that scrapes the platform URL for the challenge code.

### Wallet Signature Verification (v0.5)

`SignatureVerifier` interface accepts address + message + signature. Replace `MockSignatureVerifier` with a reddcoinjs-lib ECDSA implementation. The `WalletLink.verified` field will reflect real cryptographic proof.

### SQLite DataStore (v0.4 target)

Implement `SqliteDataStore` satisfying the `DataStore` interface. Register in `getStore()`. Run `migrate.ts` once to import `db.json` records into SQLite. No route changes.

---

*Questions or corrections → open an issue or see `CONTRIBUTING.md` for the PR workflow.*
