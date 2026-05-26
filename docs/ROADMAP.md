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
- [x] **Payment request page (`/pay/[handle]`)** — BIP21 QR, preset + custom amount picker, Open in wallet, copy URI; non-custodial (0.4.1)
- [ ] User guide page (`/guide`)
- [x] **Privacy policy page (`/privacy`)** — 10 sections, store-submission ready (0.4.1)
- [x] **Terms of use page (`/terms`)** — 10 sections, store-submission ready (0.4.1)
- [x] **Register page social accounts** — 13-platform selector, self-reported social links at registration time, API route accepts `socialLinks[]` (0.4.1)
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

## UX Sprint — Easy Wins Backlog

> These are scoped, low-risk improvements that can each be built in a single session.
> Ordered roughly by user-facing impact. None require new API endpoints.
> Do these interleaved with v0.4 refactor tasks — each one ships independently.

### Tier 1 — < 1 hour each (do first)

| # | Item | Affected file(s) | Why it matters |
|---|------|-----------------|---------------|
| U1 | ✅ **Custom 404 page** — branded `not-found.tsx` with handle search suggestion and links to /register and /explore | `src/app/not-found.tsx` | Done v0.4.2 |
| U2 | ✅ **Error boundary page** — branded `error.tsx` with reload button | `src/app/error.tsx` | Done v0.4.2 |
| U3 | ✅ **`robots.txt`** — allow all, disallow `/api/`, point to sitemap | `public/robots.txt` | Done v0.4.3 |
| U4 | ✅ **`sitemap.ts`** — dynamic Next.js route handler; includes static pages + all registered handle pages from `getAllIdentities()` | `src/app/sitemap.ts` | Done v0.4.3 |
| U5 | ✅ **Tip page: social proof badges → hyperlinks** — wrap each PlatformBadge in `<a href={platformProfileUrl(platform, username)}>` | `src/app/[handle]/page.tsx` | Done v0.4.3 |
| U6 | ✅ **Post-registration next-step prompt** — in the `?new=1` success banner, add "→ Verify your social accounts" CTA linking to `/verify?handle={handle}` | `src/app/[handle]/page.tsx` | Done v0.4.3 |
| U7 | ✅ **`/explore` empty search state** — when filtered results = 0, show encouraging message and "clear search" button instead of blank space | `src/app/explore/page.tsx` | Done v0.4.3 |
| U8 | ✅ **`/explore` result count** — show "Showing N of M creators" above the grid | `src/app/explore/page.tsx` | Done v0.4.3 |

### Tier 2 — 1–2 hours each (started v0.4.5)

| # | Item | Affected file(s) | Why it matters |
|---|------|-----------------|---------------|
| U9 | ✅ **NavBar quick-lookup** — add an inline search input that navigates to `/@{handle}` on Enter; falls back to `/explore?q=` if not found | `src/components/NavBar.tsx` | The most common action (find a creator) requires going to /explore first |
| U10 | ✅ **`/guide` user guide page** — step-by-step getting-started for new users: (1) install Love Button, (2) register handle, (3) link social accounts, (4) share your tip page | `src/app/guide/page.tsx` | Reduces friction for new users; store reviewers expect a help/guide page |
| U11 | **`/verify` → `/edit` social links management** — add a "Social Accounts" section to the edit page that shows current social proofs (platform + username + status) with a "Verify →" link per platform and an "Add account" button linking to `/verify?handle={handle}` | `src/app/edit/[handle]/page.tsx` | Currently the edit page has no social proof management; you can only add them at registration or via the raw /verify flow |
| U12 | **`/pay/[handle]` QR image download** — "Save QR" button that uses canvas `toDataURL()` to export the QR as a PNG | `src/app/pay/[handle]/PayClient.tsx` | Useful for putting QR code in videos, stream overlays, invoices |
| U13 | ✅ **`/explore` loading skeleton** — replace the "Loading…" spinner with 6 placeholder card skeletons during initial fetch | `src/app/explore/page.tsx` | Reduces layout shift; looks more polished |
| U14 | ✅ **Tip page: "Copy tip page URL" button** — quick copy of `https://redd.love/@{handle}` alongside Share button | `src/app/[handle]/page.tsx` | Shareable URL is not directly copyable without using the browser address bar or ShareButton |
| U15 | ✅ **`/verify` → deep-link from tip page** — add "Is this your tip page? Verify your social accounts →" link visible when NO social proofs are recorded, or when proofs exist but are all `self-reported` | `src/app/[handle]/page.tsx` | Discoverability gap: creators who just registered don't know to go to /verify |

### Tier 3 — Half day each

| # | Item | Affected file(s) | Why it matters |
|---|------|-----------------|---------------|
| U16 | **Handle search results page** — `/search?q=` client page using `/api/search`; shows ranked results with handle, name, bio snippet, platform badges | `src/app/search/page.tsx` | Currently /explore does local client-side filter only; /api/search scores across more fields |
| U17 | **Profile completion indicator** — small progress strip on the edit page showing: handle ✓, RDD address ✓, display name, bio, website, ≥1 social proof, ≥1 verified social proof | `src/app/edit/[handle]/page.tsx` | Guides creators toward a more complete profile without being nagging |
| U18 | **`/explore` load-more / pagination** — "Load more" button after 20 results instead of rendering all at once | `src/app/explore/page.tsx` | Will matter as the directory grows; prevents long initial render |
| U19 | **Homepage — recent registrations widget** — a horizontal scroll row showing the last 5 registered handles (avatar placeholder, handle, platform count) fetched from `/api/explore` | `src/app/page.tsx` | Makes the homepage feel alive; social proof that people are using the service |
| U20 | **`/card/[handle]` — QR download** — "Download card as image" using `html-to-image` or canvas; downloads a PNG of the full tip card | `src/app/card/[handle]/page.tsx` | Very useful for creators putting their tip card in social media bios, stream overlays, video descriptions |

### Extension-side UX (Love Button v2.6 targets)

These live in the `love-button` repo but are user-facing improvements to the extension experience.

| # | Item | Why it matters |
|---|------|---------------|
| E1 | **Popup: handle suggestions on "not found"** — when a lookup returns 404, show "Try @{variant}" suggestions (strip leading `@`, lowercase, strip spaces) | Reduces dead ends for users who searched with wrong casing or symbol |
| E2 | **Popup: "Share this creator" button** — copies `https://redd.love/@{handle}` to clipboard from within the popup result | Creators want their audience to spread the tip page; currently requires opening a browser tab |
| E3 | **Popup: keyboard navigation** — arrow keys cycle history entries; Escape clears; Enter from history re-triggers lookup | Accessibility gap; power users expect keyboard flow throughout |
| E4 | **Extension: "Tip me" embed badge generator** — popup result page shows a copyable HTML `<a href="redd.love/@handle"><img ...></a>` badge snippet for creator websites | Drives organic discovery; creator puts badge in blog/docs/footer |
| E5 | **Content scripts: RDD address detection** — scan page text for `R[A-Za-z0-9]{33}` / `rdd1[a-z0-9]{39}` patterns; offer a "Look up this address on ReddID" context menu option | Many creators share raw addresses; this bridges the gap until they register |
| E6 | **Extension: configurable tip URL target** — settings option to open `redd.love/@handle` vs `redd.love/pay/@handle` when clicking the in-page tip button | /pay is more focused for payers; let extension users choose |
| E7 | **Extension popup: show social proof badges** — display each linked platform with 🔗/○ badge inline with the identity result | Currently only shows address and balance tabs; social proof shown but could be richer |

### Deployment & Production Readiness

These are not features but are required before any public launch announcement.

| # | Item | Priority |
|---|------|---------|
| D1 | **Railway deployment with persistent volume** — mount `/app/data` as a persistent volume; set `PORT` env; confirm `data/db.json` survives redeploys | **Blocker** — current Vercel/serverless deploy will wipe db.json on every deploy |
| D2 | **SqliteDataStore implementing DataStore interface** — swap `JsonFileDataStore` for SQLite via `better-sqlite3`; no route changes (all routes go through `getStore()`); migration script from db.json | **Blocker for scale** — flat JSON has no atomic writes; risk of corruption under concurrent requests |
| D3 | **Environment variable config** — `REDDID_API_BASE`, `REDDID_BLOCKBOOK_URL`, `REDDID_DB_PATH`, `NODE_ENV`; validate at startup | Required for Railway; avoids hardcoded paths |
| D4 | **Proper README** — replace create-next-app stub with project overview, install steps, env vars, API reference, dev/prod run instructions | Required for contributors and store reviewers who inspect source |
| D5 | **`SECURITY.md`** — responsible disclosure address, scope, out-of-scope (no bug bounty yet), contact | Good-faith security disclosure path |
| D6 | **`CONTRIBUTING.md`** — how to add a platform, how to open a PR, code style, changelog requirement | Required before accepting community PRs |
| D7 | **CI: add `npm run build` check** — GitHub Actions currently runs `tsc --noEmit` and lint; add a full Next.js build step to catch RSC/bundler errors that tsc misses | Prevents shipping broken builds |
| D8 | **Rate limiting hardening** — current in-memory rate limiter resets on server restart; replace with file-backed or SQLite-backed counters | Required before public launch to prevent registration spam |

### Chrome Web Store / Firefox AMO Submission Checklist

| # | Item | Status |
|---|------|--------|
| S1 | /privacy page live at redd.love/privacy | ✅ Done (v0.4.1) |
| S2 | /terms page live at redd.love/terms | ✅ Done (v0.4.1) |
| S3 | store/listing.md written for v2.5 | ✅ Done (v2.5.1) |
| S4 | Permission justifications in listing.md | ✅ Done (v2.5.1) |
| S5 | `npm run build:chrome` produces clean zip | ✅ Done (v2.5.0) |
| S6 | `npm run build:firefox` produces valid folder | ✅ Done (v2.5.0) |
| S7 | `web-ext lint` 0 errors | Needs verification |
| S8 | Screenshots captured (store/screenshots.md spec) | ❌ Not done |
| S9 | 1280×800 promotional tile created | ❌ Not done |
| S10 | All 14 TESTING.md sections passed on Chrome latest | ❌ Not done |
| S11 | All 14 TESTING.md sections passed on Firefox latest | ❌ Not done |
| S12 | All 14 TESTING.md sections passed on Firefox ESR | ❌ Not done |
| S13 | Chrome Web Store developer account confirmed | ❌ Needs check |
| S14 | Firefox AMO developer account confirmed | ❌ Needs check |
| S15 | Source code zip uploaded to AMO (required for MV3) | ❌ Not done |

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
| v0.4.0 | 2026-05-25 | Foundation refactor — types, DataStore, wallets, agents, payment intents; platforms.ts; /platforms page; /api/search |
| v0.4.1 | 2026-05-25 | /privacy + /terms pages; /pay/[handle] BIP21 payment page; register social accounts (13 platforms); API socialLinks[] |
