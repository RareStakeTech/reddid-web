# ReddID Next (reddid-web)

**Native Ɍ ReddCoin identity and tipping layer.**  
Register a `@handle`, link your RDD wallet, verify your social accounts, and receive tips — no wrapped tokens, no custodians.

Part of the [ReddRails](https://github.com/RareStakeTech) ecosystem by [Rare Stake Technology LLC](https://rarestaketech.com).

---

## What it does

| Feature | Status |
|---|---|
| `@handle` registration with RDD wallet | ✅ Live |
| Public tip page with BIP21 QR codes | ✅ Live |
| Social proof verification (challenge-post) | ✅ Live |
| Shareable tip card (`/card/@handle`) | ✅ Live |
| Live session simulator (`/live/@handle`) | ✅ Live (demo) |
| Creator explore directory | ✅ Live |
| Agent identity delegation | ✅ API ready |
| Wallet multi-chain management | ✅ API ready |
| Payment intent creation | ✅ API ready (mock) |
| Reserve dashboard | 🔲 Placeholder |
| ReddRail state-channel tips | 🔲 Planned (v0.5+) |
| Gajumaru bridge integration | 🔲 Planned (v1.0) |
| Digi-ID wallet login | 🔲 Planned (v0.5) |

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Data is stored in `data/db.json` (created automatically on first registration).  
Schema migrations run automatically on startup.

---

## Architecture

```
src/
  app/              Next.js App Router pages + API routes
  lib/
    types.ts        All TypeScript types (Identity, Credential, ActionEnvelope, …)
    db.ts           Public API shim — delegates to store/, provides publicIdentity()
    platforms.ts    Canonical platform registry (single source of truth)
    rate-limit.ts   In-memory rate limiter (swap for Redis in production)
    validation.ts   Handle, address, and URL validation
    migrate.ts      Schema migration runner (v0→v1→v2)
    store/          DataStore interface + JsonFileDataStore
    providers/      Adapter interfaces + Mock implementations
      mock/         MockPolicyEngine, MockRevocationRegistry, MockTrustEvaluator, …
  components/       React components (TrustBadge, QRCodeDisplay, CopyButton, …)
```

### Provider pattern

All external integrations (signing, credentials, bridge status) are behind typed interfaces in `src/lib/providers/`. Call `getProviders()` to get the active set. All providers are mock implementations in v0.4 — swap individual entries in `providers/index.ts` when real implementations are ready.

### Identity model

Identities are stored at `data/db.json`. Each identity has:
- `wallets[]` — canonical multi-chain wallet list (v2); `rddAddress` kept for migration compat
- `socialProofs[]` — verified social links with trust levels
- `agents[]` — delegated sub-identities with spend limits
- `verificationChallenges` — ephemeral 8-hour challenge codes (private, never exposed)
- `editToken` — 16-char hex, stored client-side only; required for mutations

### Trust levels

| Level | Meaning |
|---|---|
| `self-reported` | User asserts; no independent check |
| `challenge-post-verified` | 8-char hex challenge confirmed in a public post |
| `wallet-signature-verified` | ECDSA signature verified (v0.5+) |
| `community-attested` | Multiple community attestations |
| `project-attested` | Signed by project team |
| `third-party-credentialed` | External verifier credential |
| `disputed` | Flagged — treat with caution |
| `revoked` | Permanently removed |

---

## Key API routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/identities` | Register a new handle |
| GET/PATCH | `/api/identities/[handle]` | Get or update an identity |
| POST | `/api/verify/challenge` | Generate a verification challenge |
| POST | `/api/verify/confirm` | Record a social proof |
| GET/POST | `/api/identities/[handle]/wallets` | List or add wallets |
| PATCH/DELETE | `/api/identities/[handle]/wallets/[id]` | Set primary or remove wallet |
| GET/POST | `/api/agents/[handle]` | List or create agents |
| DELETE | `/api/agents/[handle]/[id]` | Revoke an agent |
| POST | `/api/payments` | Create a payment intent |
| GET/DELETE | `/api/payments/[id]` | Get or cancel payment intent |
| POST | `/api/report` | Submit an abuse report |
| GET | `/api/explore` | Browse public identities |
| GET | `/api/search` | Fuzzy search handles |

---

## Documentation

Extended documentation lives in `docs/`:

- `ARCHITECTURE.md` — system design, DataStore, provider layer
- `IDENTITY_MODEL.md` — Identity v2, wallet types, trust levels
- `PRODUCT_SPEC.md` — product goals, mock labeling rules
- `SECURITY_PRIVACY.md` — threat model, security checklist
- `ROADMAP.md` — v0.3–v1.0+ milestones
- `USER_PROTECTION_PRINCIPLES.md` — 15 invariants that cannot be violated
- `ACTION_ENVELOPE.md` — universal signing/approval model
- `CREDENTIALS.md` — credential type registry, soulbound model
- `TRUST_LEVELS.md` — TrustLevel definitions and display rules
- `REVOCATION.md` — revocation model, audit trail
- `AGENT_AUTHORIZATION.md` — PolicyEngine evaluation order
- `DIGIID_COMPATIBILITY.md` — Digi-ID integration plan
- `GRIDS_COMPATIBILITY.md` — Gajumaru GRIDS integration plan

---

## Important constraints

- **No private keys stored** — the server never sees or stores wallet private keys
- **No live bridge** — bridge and wRDD features are placeholders pending Gajumaru QPQ
- **No mandatory KYC** — identity is opt-in and self-sovereign
- **editToken is NOT for agent operations** — agents use their own `controllerKey`
- **Mock labels required** — any demo/simulated surface must show a visible mock label

---

## Development status

v0.4 sprint complete. See `docs/ROADMAP.md` for the v0.5 plan.

GitHub: [github.com/RareStakeTech/reddid-web](https://github.com/RareStakeTech/reddid-web)
