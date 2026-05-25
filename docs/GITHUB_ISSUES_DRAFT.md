# GitHub Issues Draft — v0.4 Sprint

Generated from 7-day implementation sprint plan. Priority order matches implementation dependency order.

Labels used: `refactor`, `architecture`, `feature`, `fix`, `security`, `ui`, `api`, `docs`, `data-model`, `migration`, `agent`, `wallet`, `payment`, `social-proof`, `day-1` through `day-7`

---

## Issue #37 — DataStore Interface and JsonFileDataStore

**Title:** `refactor: introduce DataStore interface and JsonFileDataStore`  
**Labels:** `refactor`, `architecture`, `day-1`  
**Priority:** P0 — blocks everything else

**Problem:**  
Every API route imports directly from `@/lib/db`. When the database backend changes, all routes must be updated. This breaks the open-closed principle.

**Solution:**  
Introduce `DataStore` interface. Move flat-JSON logic to `JsonFileDataStore`. All routes call `getStore()`.

**Files to create:**
- `src/lib/store/interface.ts` — `DataStore` interface with all read/write operations
- `src/lib/store/json-file.ts` — `JsonFileDataStore` implements `DataStore`
- `src/lib/store/index.ts` — `getStore(): DataStore` singleton
- `src/lib/db.ts` — reduced to `@deprecated` re-export shim

**Files to modify:**
- All 11 API route files: replace `@/lib/db` imports with `getStore()`

**Acceptance criteria:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] All routes return identical responses before and after (manual smoke test)
- [ ] No route imports from `@/lib/db` directly (verified with grep)
- [ ] `data/db.json` readable by new store without modification

**Test cases:**
```bash
curl http://localhost:3000/api/identities | jq .count
curl http://localhost:3000/api/explore | jq .total
curl http://localhost:3000/api/search?q=test | jq .results
```

---

## Issue #38 — Expand Core Domain Types

**Title:** `feat: expand core domain types — Identity v2, WalletLink, SocialProof v2, AgentIdentity, PaymentIntent`  
**Labels:** `feature`, `data-model`, `architecture`, `day-1`  
**Priority:** P0 — all new features depend on these types

**Problem:**  
Current `Identity` type has a single `rddAddress` field, no wallets array, no agents, no revocation, no identity type, no visibility controls. Building on top of this schema creates accumulating technical debt.

**Solution:**  
Define all domain types correctly, once, in `src/lib/types/`.

**Files to create:**
- `src/lib/types/identity.ts` — `Identity`, `WalletLink`, `IdentityType`, `VisibilityLevel`, `ChainType`
- `src/lib/types/proof.ts` — `SocialProof`, `VerificationChallenge`, `ProofMethod`, `VerificationStatus`
- `src/lib/types/agent.ts` — `AgentIdentity`, `AgentType`, `AgentAction`, `AGENT_ACTIONS`
- `src/lib/types/payment.ts` — `PaymentIntent`, `PaymentStatus`, `PaymentAsset`, `PaymentRailId`
- `src/lib/types/index.ts` — barrel export

**Acceptance criteria:**
- [ ] All types compile with `strict: true`
- [ ] `Identity` has all fields from IDENTITY_MODEL.md
- [ ] `WalletLink` has chain, address, purpose, visibility, proofType, verified, primary, revokedAt
- [ ] `SocialProof` has proofMethod, verificationStatus, verifiedAt, recheckAfter, visibility
- [ ] `VerificationChallenge` has code, platform, createdAt, expiresAt, attempts
- [ ] `AgentIdentity` has all permission and spend-limit fields
- [ ] `PaymentIntent` has full status lifecycle fields
- [ ] `VisibilityLevel` exported from types, not redefined elsewhere

---

## Issue #39 — Database Migration v1 → v2

**Title:** `feat: database migration — rddAddress → wallets[], schemaVersion, SocialProof v2`  
**Labels:** `data-model`, `migration`, `day-1`  
**Priority:** P0 — required before any v2 features can be used

**Problem:**  
Existing records use `rddAddress: string`. New schema uses `wallets: WalletLink[]`. Migration must be automatic, safe, and idempotent.

**Files to create:**
- `src/lib/store/migrate.ts` — migration logic

**Migration spec:**
1. Read all records from `data/db.json`
2. For records where `schemaVersion` is absent or `< 2`:
   - Create `wallets: [{ chain:'rdd', address: rddAddress, primary: true, purpose:'receive', visibility:'public', proofType:'self-reported', verified: false, addedAt: createdAt }]`
   - Add `identityType: 'human'`, `agents: []`, `parentHandle: null`
   - Add `revokedAt: null`, `revokedReason: null`, `revocationKey: null`
   - Add `avatar: null`, `publicSigningKey: null`, `editTokenCreatedAt: createdAt`
   - Expand `verificationChallenges` from `Record<string,string>` to `Record<string,VerificationChallenge>`
   - Expand `socialProofs[]` entries to add `id`, `proofMethod: 'challenge-post'`, `verificationStatus`, `visibility: 'public'`
   - Set `schemaVersion: 2`
3. Write backup to `data/db.backup.json` before mutating
4. Write migrated data

**Acceptance criteria:**
- [ ] Backup written to `data/db.backup.json` before any mutation
- [ ] All v1 fields migrated correctly
- [ ] Migration is idempotent (running twice = same result)
- [ ] New registrations after migration have `schemaVersion: 2`
- [ ] `primaryRddAddress()` helper returns correct address from migrated records

---

## Issue #40 — Reserved Handles Expansion

**Title:** `fix: expand reserved handles to cover all app routes and brand names`  
**Labels:** `fix`, `security`, `validation`, `day-1`  
**Priority:** P0 — security issue; any route path is currently registerable

**Problem:**  
Current reserved list has 12 entries. The app has 20+ routes. Handle `explore`, `verify`, `staking`, `bridge`, `platforms`, etc. can all be registered today.

**Expanded list (minimum):**
```
Route paths: explore, platforms, edit, verify, card, live, staking, bridge,
             guide, privacy, terms, search, agents, agent, wallet, wallets, payments, pay
Brand: reddcoin, redd, reddid, reddmobile, reddweb, reddrail, reddbridge,
       reddlove, rarestake, rarestaketech
App words: support, team, official, me, settings, help, about, contact,
           status, tip, creator, root, system, bot, ai
Abuse: null, undefined, anonymous, superuser, moderator, mod
Crypto confusion: bitcoin, ethereum, solana, cardano
```

**File to modify:** `src/lib/validation.ts` — replace `reserved` array with a `Set`

**Acceptance criteria:**
- [ ] `isValidHandle('explore')` returns `{ valid: false, error: 'That handle is reserved.' }`
- [ ] `isValidHandle('reddmobile')` returns invalid
- [ ] `isValidHandle('alice')` returns valid
- [ ] All 15+ app route paths are in the reserved set
- [ ] Set used for O(1) lookup
- [ ] POST /api/identities with reserved handle returns 422

---

## Issue #41 — Wallet Linkage API

**Title:** `feat: wallet linkage API — add, list, revoke wallet links`  
**Labels:** `feature`, `wallet`, `api`, `day-2`  
**Priority:** P1

**Routes to create:**
- `POST /api/identities/[handle]/wallets` — add wallet (editToken required)
- `GET /api/identities/[handle]/wallets` — list (public wallets only for unauthenticated)
- `DELETE /api/identities/[handle]/wallets/[id]` — revoke (soft delete, editToken required)

**Rules:**
- Max 10 wallets per identity
- One primary per chain
- First wallet for a chain is auto-set as primary
- Cannot revoke the only remaining primary wallet
- Soft delete: sets `revokedAt`, does not remove record

**Acceptance criteria:**
- [ ] POST creates WalletLink with generated id
- [ ] GET returns only `visibility: 'public'` wallets for unauthenticated requests
- [ ] DELETE sets `revokedAt` timestamp
- [ ] Cannot add 11th wallet (422)
- [ ] RDD address validated for RDD wallets
- [ ] TypeScript: no `any` in route handlers

---

## Issue #42 — Identity Type in Register and Edit Flows

**Title:** `feat: identity type selection in register and edit flows`  
**Labels:** `feature`, `ui`, `day-2`  
**Priority:** P1

**Changes:**
- Register page: segmented control (Person / Creator / Organization) below handle field
- Edit page: allow changing identityType (human ↔ creator ↔ organization only; bot/ai-agent via agent API)
- Edit page: add wallet management section (list wallets, add, revoke)
- `POST /api/identities` accepts `identityType?: IdentityType` (defaults to `'human'`)
- `PUT /api/identities/[handle]` accepts `identityType` (restricted types)

**New components:**
- `src/components/IdentityTypeBadge.tsx` — displays type chip on public profiles

**Acceptance criteria:**
- [ ] Register page shows type selector; value stored in POST body
- [ ] Public profile shows type badge for non-human identities only
- [ ] `bot` and `ai-agent` cannot be set via register or edit (422)
- [ ] Edit page shows current wallets with revoke buttons

---

## Issue #43 — Social Proof State Machine + Challenge Fix

**Title:** `fix: social proof — challenge expiry, attempt limits, platform list from registry`  
**Labels:** `fix`, `security`, `social-proof`, `day-3`  
**Priority:** P1

**Problems to fix:**
1. Challenges never expire
2. `verify/challenge` uses hardcoded 7-platform list (not `platforms.ts`)
3. No attempt counter on failed confirmations

**Changes:**
- `VerificationChallenge` becomes an object with `expiresAt` and `attempts`
- `POST /api/verify/challenge`: uses `LIVE_PLATFORMS` from `platforms.ts`; returns `expiresAt`
- `POST /api/verify/confirm`: checks `expiresAt` (return 410 if expired); increments `attempts` (return 429 if ≥ 5); sets `verificationStatus: 'verified'` on success
- Social proof gets `proofMethod: 'challenge-post'`, `verifiedAt: now()`, `recheckAfter: +30d`

**Acceptance criteria:**
- [ ] Challenge expires after 8 hours
- [ ] Confirming expired challenge returns 410
- [ ] 6th attempt returns 429
- [ ] All 13 live platforms accepted by challenge route
- [ ] `verificationStatus` field present in all proof responses

---

## Issue #44 — Verification Status Display

**Title:** `feat: social proof verification status display on profile and verify pages`  
**Labels:** `feature`, `ui`, `social-proof`, `day-3`  
**Priority:** P2

**Changes:**
- Public profile: verified = green ✓, pending = amber ⏳ (to owner only)
- Verify page: show `expiresAt` countdown, attempt counter, current status per proof
- All badges labeled "Self-Reported" until `verificationStatus === 'verified'`

**Acceptance criteria:**
- [ ] Verified proofs show green ✓ on public profile
- [ ] `verificationStatus` shown on verify page with countdown
- [ ] Failed/expired proofs not shown to general public
- [ ] "Self-Reported" label present on all proofs until verified

---

## Issue #45 — Agent Identity API

**Title:** `feat: agent identity API — create, list, revoke`  
**Labels:** `feature`, `agent`, `api`, `day-4`  
**Priority:** P1

**Routes to create:**
- `POST /api/agents/[handle]` — create agent (editToken required)
- `GET /api/agents/[handle]` — list active agents (public)
- `DELETE /api/agents/[handle]/[agentId]` — revoke agent (editToken required, soft delete)

**Validation:**
- `childHandle` must be `{parentHandle}.{slug}` format (slug: 3-30 chars, `[a-z0-9-]`)
- Max 20 agents per identity
- `allowedRails` must be subset of available rails (`['native-rdd', 'mock']` for now)
- `allowedActions` must be subset of `AGENT_ACTIONS`

**Acceptance criteria:**
- [ ] POST creates AgentIdentity, returns without sensitive fields
- [ ] Child handle validated as `parent.slug` format
- [ ] GET returns active agents without spend limits or controllerKey
- [ ] DELETE sets `revokedAt`; agent removed from public listing
- [ ] Cannot create 21st agent (422)
- [ ] Invalid allowedRails returns 422

---

## Issue #46 — Agent Management UI

**Title:** `feat: agent management UI (/agents) and public disclosure (/[handle]/agents)`  
**Labels:** `feature`, `ui`, `agent`, `day-4`  
**Priority:** P1

**Pages to create:**
- `src/app/agents/page.tsx` — "My Agents" management (editToken from localStorage)
- `src/app/[handle]/agents/page.tsx` — public agent disclosure

**New component:**
- `src/components/AgentCard.tsx` — compact and full variants

**Acceptance criteria:**
- [ ] `/agents` loads agent list, shows create form with all fields
- [ ] Create form validates `childHandle` format client-side
- [ ] Revoke button requires confirmation dialog
- [ ] `/[handle]/agents` shows active agents without sensitive fields
- [ ] Agent type badge visually distinct from identity type badge
- [ ] Empty state renders correctly

---

## Issue #47 — PaymentRailAdapter Interface and MockRail

**Title:** `feat: PaymentRailAdapter interface and MockRail implementation`  
**Labels:** `feature`, `architecture`, `payment`, `day-5`  
**Priority:** P1

**Files to create:**
- `src/lib/adapters/payment-rail.ts` — interface + MockRail + NativeRddRail stub
- `src/lib/adapters/index.ts` — exports all adapters

**Acceptance criteria:**
- [ ] `MockRail` implements `PaymentRailAdapter` fully
- [ ] `NativeRddRail` stub exists and throws on every method
- [ ] `getRail('mock')` returns MockRail
- [ ] `getRail('native-rdd')` returns stub (does not throw at construction)
- [ ] `getRail('gajumaru-rail')` throws (not registered)
- [ ] All interfaces exported from adapters barrel

---

## Issue #48 — Payment Intent API and Pay Page

**Title:** `feat: payment intent API and /pay/[handle] page`  
**Labels:** `feature`, `payment`, `api`, `ui`, `day-5`  
**Priority:** P1

**Routes to create:**
- `POST /api/payments` — create intent
- `GET /api/payments/[id]` — get intent status

**Page to create:**
- `src/app/pay/[handle]/page.tsx` — payment request page (no login required)

**Pay page features:**
- Creator info display
- Tip amount chips (100/500/1K/5K/custom RDD)
- Dynamic BIP21 QR code
- "Open in RDD wallet" button
- "Copy address" fallback
- Clear label: "Send RDD from your wallet. This is a payment request, not a transaction."

**Acceptance criteria:**
- [ ] POST creates PaymentIntent with status `'requested'`, expiry `+24h`
- [ ] GET returns intent; expired intents show status `'expired'` (checked at read time)
- [ ] `/pay/[handle]` renders with server-provided identity data
- [ ] BIP21 QR updates client-side when amount chip changes
- [ ] Mock payment intents clearly labeled

---

## Issue #49 — Complete Adapter Interface Definitions

**Title:** `feat: complete all adapter interface definitions`  
**Labels:** `architecture`, `day-6`  
**Priority:** P2

**Files to create:**
- `src/lib/adapters/social-proof.ts` — `SocialProofProvider` interface + `ChallengePostProvider`
- `src/lib/adapters/bridge-status.ts` — `BridgeStatusAdapter` interface + `MockBridgeStatus`
- `src/lib/adapters/wallet-link.ts` — `WalletLinkProvider` interface

**Files to modify:**
- `src/app/api/reserve/route.ts` — use `BridgeStatusAdapter` instead of `getReserveSnapshot()`
- `src/lib/db.ts` — final shim; zero business logic remaining

**Acceptance criteria:**
- [ ] All three interfaces defined with correct TypeScript signatures
- [ ] `MockBridgeStatus` implements `BridgeStatusAdapter`
- [ ] `ChallengePostProvider` implements `SocialProofProvider`
- [ ] `/api/reserve` uses adapter pattern
- [ ] `db.ts` is pure re-export shim

---

## Issue #50 — Public Profile v2

**Title:** `feat: public profile v2 — wallets, identity type, agent count, visibility filtering`  
**Labels:** `feature`, `ui`, `day-6`  
**Priority:** P1

**Changes to `/[handle]/page.tsx`:**
- Show wallets[] (public only) with `WalletBadge` component
- Show `IdentityTypeBadge` for non-human identities
- Show "N authorized agents →" link if `agentCount > 0`
- Show revocation banner if `revokedAt !== null` (hide all payment options)
- Add "Request payment →" button linking to `/pay/[handle]`

**`publicIdentity()` v2:**
- Filter wallets by visibility
- Include `agentCount` derived field
- Strip all private fields
- Include `revokedAt`, `revokedReason` (public revocation record)

**New components:**
- `src/components/WalletBadge.tsx`

**Acceptance criteria:**
- [ ] Revoked identity shows banner, no payment options
- [ ] Private wallets not in GET /api/identities/[handle]
- [ ] `agentCount` present in public identity response
- [ ] `WalletBadge` shows chain, truncated address, type (legacy/segwit), primary indicator

---

## Issue #51 — Documentation Files

**Title:** `docs: README, ARCHITECTURE, SECURITY, CONTRIBUTING`  
**Labels:** `documentation`, `day-7`  
**Priority:** P1

**Files to create:**
- `README.md` — replace create-next-app stub
- `ARCHITECTURE.md` — abbreviated version (link to `docs/ARCHITECTURE.md` for full)
- `SECURITY.md` — responsible disclosure + threat model
- `CONTRIBUTING.md` — dev setup + contribution guide

**README must include:**
- What this is (2 sentences)
- Product vocabulary table (RDD, ReddID, ReddMobile, ReddWeb, ReddRail, ReddBridge)
- Quickstart (3 commands that actually work)
- Architecture overview
- Environment variables (none needed for dev)
- Contributing link
- Security link
- License

**Acceptance criteria:**
- [ ] `npm install && npm run dev` in README actually works
- [ ] ARCHITECTURE.md lists all 4 adapter interfaces with method signatures
- [ ] SECURITY.md states "no private keys stored" explicitly
- [ ] CONTRIBUTING.md has working dev setup instructions

---

## Issue #52 — In-App Guide, Privacy, Terms Pages

**Title:** `feat: in-app user guide, privacy policy, and terms of use pages`  
**Labels:** `documentation`, `ui`, `day-7`  
**Priority:** P2

**Pages to create:**
- `src/app/guide/page.tsx` — user guide (8+ scenarios)
- `src/app/privacy/page.tsx` — what data, where it lives, how to delete
- `src/app/terms/page.tsx` — beta disclaimer, no custody, user responsibility

**NavBar/footer updates:**
- Add "Guide" link to NavBar
- Add Guide, Privacy, Terms to footer
- Add `guide`, `privacy`, `terms` to reserved handles

**Acceptance criteria:**
- [ ] `/guide` covers all 8 user scenarios
- [ ] `/privacy` lists every piece of stored data explicitly
- [ ] `/terms` includes beta disclaimer and no-custody statement
- [ ] All three pages linked from footer
- [ ] Handle reserved for all three

---

## Issue #53 — Mock/Demo Labeling

**Title:** `fix: add visible mock/demo labels to all simulated surfaces`  
**Labels:** `fix`, `ux`, `day-1`  
**Priority:** P0 — required before any public demo

**Required labels (per PRODUCT_SPEC.md):**

| Page | Label to add |
|---|---|
| `/live/[handle]` | Yellow banner: "Demo Mode — Simulated Activity" |
| `/reserve` | Yellow banner: "Not Live — Placeholder Data" |
| `/bridge` | Yellow banner: "Concept Only — Bridge Not Active" |
| `/staking` | Yellow banner: "Estimate Only — Not Connected to Live Data" |
| Social proof badges (unverified) | Label: "Self-Reported" |
| Payment intents (mock rail) | Label: "Mock Payment — Not a Real Transaction" |

**Acceptance criteria:**
- [ ] All 6 surfaces have visible, non-dismissable labels
- [ ] Labels use amber (#fbbf24) color scheme (consistent with existing "coming soon" banners)
- [ ] "Demo Mode" label on `/live/[handle]` visible above the tip feed
- [ ] "Self-Reported" label on unverified social proof badges (distinct from verified)

---

## Summary Table

| Issue | Title | Priority | Day | Blocks |
|---|---|---|---|---|
| #37 | DataStore interface | P0 | 1 | All API work |
| #38 | Core domain types | P0 | 1 | All features |
| #39 | DB migration v1→v2 | P0 | 1 | Identity expansion |
| #40 | Reserved handles | P0 | 1 | Security |
| #53 | Mock/demo labels | P0 | 1 | Public demo |
| #41 | Wallet linkage API | P1 | 2 | Profile v2 |
| #42 | Identity type UI | P1 | 2 | Profile v2 |
| #43 | Social proof fix | P1 | 3 | Proof display |
| #44 | Proof status display | P2 | 3 | — |
| #45 | Agent API | P1 | 4 | Agent UI |
| #46 | Agent management UI | P1 | 4 | — |
| #47 | PaymentRailAdapter | P1 | 5 | Payment API |
| #48 | Payment intent + pay page | P1 | 5 | — |
| #49 | Adapter interfaces | P2 | 6 | — |
| #50 | Public profile v2 | P1 | 6 | — |
| #51 | Docs files | P1 | 7 | — |
| #52 | Guide/privacy/terms | P2 | 7 | — |
