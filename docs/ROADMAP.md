# ReddWeb Roadmap

**Last updated:** 2026-05-25

This roadmap reflects the current implementation plan. It is a working document — not a marketing promise.

---

## Milestone: v0.3 — Social Identity Layer ✅ COMPLETE

**Status:** Deployed to GitHub. CI green.

### Completed
- [x] Handle registration + public tip pages
- [x] Social proof recording (challenge-post, trust-based)
- [x] 12-platform Love Button browser extension (MV3)
- [x] PoSV staking calculator (client-side math)
- [x] ReddBridge placeholder page
- [x] Platform registry (`platforms.ts`) — 17 platforms, 13 live
- [x] /platforms support matrix page with plugin spec
- [x] /explore creator directory with search/filter
- [x] /api/search fuzzy search endpoint
- [x] RDD market ticker (live CoinGecko)
- [x] Recent tips display (live Blockbook v2)
- [x] OG image generation per handle
- [x] Shareable tip card (/card/[handle])
- [x] Live session prototype (SSE, demo mode)
- [x] PWA manifest
- [x] GitHub Actions CI (tsc + build + lint)
- [x] PLUGINS.md plugin specification for browser extension

---

## Milestone: v0.4 — Foundation Refactor ⬅ CURRENT SPRINT

**Target:** 7 working days from sprint start

### Immediate Refactor Tasks (must complete first)

- [ ] **Commit 1:** Expand reserved handles; add visible demo/mock labels to all mocked surfaces
- [ ] **Commit 2:** Create `DataStore` interface; move flat-JSON logic to `JsonFileDataStore`; route all API calls through `getStore()`
- [ ] **Commit 3:** Add `schemaVersion`; add migration scaffold (`migrate.ts`); document migration strategy
- [ ] **Commit 4:** Expand `Identity` model; migrate `rddAddress` to `wallets[]`; add `primaryRddAddress` derived field
- [ ] **Commit 5:** Expand `SocialProof` and `VerificationChallenge` models; add challenge expiration; add attempt counters; fix `verify/challenge` to use `platforms.ts`
- [ ] **Commit 6:** Add `PaymentIntent` type; add `MockPaymentRail` adapter; no real payments yet
- [ ] **Commit 7:** Add `AgentIdentity` model as child records; add agent permission schema; add revocation fields
- [ ] **Commit 8:** Add adapter interface shells: `PaymentRailAdapter`, `SocialProofAdapter`, `WalletLinkProvider`, `BridgeStatusAdapter`
- [ ] **Commit 9:** Separate public vs private identity response; strip private fields; add visibility handling
- [ ] **Commit 10:** Add rate-limit hooks/placeholders; add abuse/reporting model; update README and all docs

### New Features (v0.4)

- [ ] Wallet linkage API (`POST/GET/DELETE /api/identities/[handle]/wallets`)
- [ ] Identity type selection in register and edit flows
- [ ] Agent identity API (`POST/GET /api/agents/[handle]`, `DELETE /api/agents/[handle]/[id]`)
- [ ] "My Agents" management UI (`/agents` page)
- [ ] Public agent disclosure page (`/[handle]/agents`)
- [ ] Payment intent API (`POST /api/payments`, `GET /api/payments/[id]`)
- [ ] Payment request page (`/pay/[handle]`)
- [ ] User guide page (`/guide`)
- [ ] Privacy policy page (`/privacy`)
- [ ] Terms of use page (`/terms`)
- [ ] Proper README (replace create-next-app stub)
- [ ] `ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md` at repo root

### Acceptance Gate (v0.4)
- `npx tsc --noEmit` passes with zero errors
- `npm run build` succeeds
- All existing routes return same shape as pre-refactor
- Existing `data/db.json` records are migrated and readable
- Reserved handles cover all route paths
- All mocked surfaces have visible labels
- New docs committed

---

## Milestone: v0.5 — Verification + Analytics

**Target:** Post-v0.4, estimated 2–3 weeks

- [ ] Platform API social proof auto-verification (scrape bio/posts for challenge code)
- [ ] Profile analytics: tip count, unique tippers, activity chart
- [ ] Nostr support (npub + NIP-05 identity) — currently `planned` in platforms.ts
- [ ] Farcaster / Warpcast profiles — currently `planned` in platforms.ts
- [ ] Substack + LinkedIn — currently `planned` in platforms.ts
- [ ] Wallet signature verification (reddcoinjs-lib ECDSA, RDD signed message)
- [ ] `GET /api/identities/[handle]/export` — data export with editToken
- [ ] `DELETE /api/identities/[handle]` — account deactivation with editToken
- [ ] In-memory rate limiting (registration, challenge, editToken attempts)
- [ ] `POST /api/abuse` — report impersonation or abuse
- [ ] Automated test suite (vitest + Testing Library)

---

## Milestone: v0.6 — ReddMobile PWA

**Target:** Q1 2027 (estimate)

- [ ] Progressive Web App — installable on mobile, offline-capable
- [ ] Service worker caching strategy
- [ ] Integrated BIP21 send from mobile browser (no desktop required)
- [ ] Web Push API for tip notifications
- [ ] QR scan to tip any registered handle
- [ ] Full rebrand to ReddMobile in UI and metadata
- [ ] Read-only wallet balance in-app (Blockbook connection)
- [ ] Address book for frequent recipients
- [ ] Multi-address support in UI

---

## Milestone: v1.0 — ReddBridge Live

**Dependency:** Gajumaru Associate Chains live (estimated Q3/Q4 2026 per Gajumaru team)

**Note:** This milestone cannot begin until Gajumaru Associate Chain support is confirmed and tested. All v0.x milestones are designed to be independent of this dependency.

- [ ] `NativeRddRail` adapter implementation (Blockbook + wallet RPC)
- [ ] Real wRDD minting on Gajumaru EVM (if Associate Chains confirmed)
- [ ] Live bridge reserve dashboard (real RDD reserve indexing)
- [ ] ReddRail state channels for streaming micropayments
- [ ] `GajumaruRail` adapter implementation
- [ ] DeFi integration entry points

---

## Future / Post-v1.0

**These items are intentionally deferred. They are designed into the architecture but not built yet.**

- Native iOS/Android app
- On-chain ReddID name anchoring (RDD L1 or Gajumaru)
- Creator DAO tooling on Gajumaru
- AI agent live autonomous spending (after full agent credential system)
- Cross-platform content monetization layer
- W3C DID / Verifiable Credential compatibility
- Complex reputation scoring
- BSC/Base wRDD contract deployment and wRDD rail
- Marketplace or DEX (not planned — out of scope for this product)
- Token-gated content (not planned — avoid VC framing)
- KYC (never — by principle)

---

## Immediate Refactor Tasks (This Week)

Ordered by dependency. Do not skip steps.

| Order | Task | Issue | Risk |
|---|---|---|---|
| 1 | Expand reserved handles + mock labels | #40 | Low — validation change |
| 2 | DataStore interface + JsonFileDataStore | #37 | Medium — touches all routes |
| 3 | Schema migration v1→v2 | #39 | Medium — DB mutation |
| 4 | Expanded Identity/WalletLink/SocialProof/Agent types | #38 | Low — additive types |
| 5 | Wallet linkage API | #41 | Low — new routes |
| 6 | Identity type in register/edit | #42 | Low — UI addition |
| 7 | Social proof state machine + challenge fix | #43, #44 | Low — logic change |
| 8 | Agent identity API | #45 | Low — new routes |
| 9 | Agent management UI | #46 | Low — new pages |
| 10 | PaymentRailAdapter + MockRail | #47 | Low — new module |
| 11 | Payment intent API + pay page | #48 | Low — new routes/page |
| 12 | Adapter polish + public profile v2 | #49, #50 | Low — cleanup |
| 13 | Docs sprint | #51, #52 | Low — docs only |

---

## Deferred Items (Explicitly Out of Sprint)

| Item | Reason |
|---|---|
| Gajumaru rail adapter | Associate Chains not live |
| BSC/Base wRDD rail | No contract deployed |
| Wallet signature verification (ECDSA) | Needs reddcoinjs-lib |
| Social proof API auto-verify | Platform API keys + brittle scraping |
| Live reserve dashboard | No RDD reserve indexing |
| Admin moderation surface | Needs auth beyond editToken |
| Handle recovery system | Needs key-based design |
| Reputation scoring | Needs signal design |
| Automated test suite (vitest) | Sprint 2 |
| Rate limiting at infra level | Needs Redis/middleware |
| Avatar upload | Needs file storage; SSRF risk |
| DID/W3C VC | Future integration |
| On-chain ReddID anchoring | Post-v1.0 |

---

## Future ReddRail / Gajumaru Integration Plan

**Design approach (current):**
- `PaymentRailAdapter` interface defined with all required methods
- `MockRail` implements the interface — used for all current payment intents
- `NativeRddRail` stub exists, throws on every method, reserved for future impl
- `GajumaruRail` does not exist yet — interface is compatible

**When Gajumaru Associate Chains are confirmed:**
1. Implement `GajumaruRail` class implementing `PaymentRailAdapter`
2. Add `'gajumaru-rail'` to `PaymentRailId` union (already present)
3. Register `GajumaruRail` in `getRail()` factory
4. Enable `allowedRails: ['gajumaru-rail']` in agent creation
5. Add Gajumaru address type to `ChainType` (already present as `'gajumaru'`)
6. Update payment page to show Gajumaru option when `GajumaruRail.isLive === true`

**No other changes required.** The adapter interface absorbs the integration.

---

## Future ReddBridge / wRDD Integration Plan

**Design approach (current):**
- `BridgeStatusAdapter` interface defined
- `MockBridgeStatus` returns zeros — used by `/api/reserve`
- Bridge page is clearly labeled "Concept Only"
- `BridgeStatus` type includes all required fields: reserves, liabilities, ratio, addresses

**When bridge is live:**
1. Implement `LiveBridgeStatus` class implementing `BridgeStatusAdapter`
2. Point it at the real reserve indexing endpoint
3. Register in `getBridgeStatus()` factory
4. Set `isLive: true` — removes "Not Live" banner from `/reserve`

**No other changes required.** The reserve dashboard pulls from the adapter automatically.

---

## Future Native RDD Integration Plan

**What "native RDD integration" means:** Connecting to a running ReddCoin Core node or Blockbook instance to verify wallet signatures, submit transactions, and read confirmed balances.

**What is already real:**
- Blockbook v2 API for address balance and tx history (live now)
- RDD address format validation (live now)
- BIP21 URI generation (live now)

**What needs RPC access:**
- Wallet signature verification (ECDSA `verifymessage` equivalent)
- Transaction submission (if wallet signing moves server-side — not recommended)

**`NativeRddRail` adapter implementation:**
1. Implement `NativeRddRail` using Blockbook v2 for confirmation tracking
2. Implement `verifySignature()` in `WalletLinkProvider` using reddcoinjs-lib
3. Set `NativeRddRail.isLive = true` when confirmed functional
4. Update `/pay/[handle]` to show "Use your RDD wallet" flow vs Mock

---

## Version History

| Version | Date | Summary |
|---|---|---|
| v0.1 | 2026-05-25 | Initial scaffold — handle registration, public tip pages |
| v0.2 | 2026-05-25 | Social proofs, wallet verification challenge, edit/live pages |
| v0.3 | 2026-05-25 | Platform expansion, Love Button v2.4, platforms page, search API |
| v0.4 | In progress | Foundation refactor — types, DataStore, wallets, agents, payment intents |
