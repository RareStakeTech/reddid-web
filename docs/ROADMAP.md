# ReddWeb Roadmap

**Last updated:** 2026-05-26 (v0.4.17 — post strategy review)

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
- [x] **User guide page (`/guide`)** — step-by-step getting-started; install Love Button, register handle, link social accounts, share tip page (U10, v0.4.5)
- [x] **Privacy policy page (`/privacy`)** — 10 sections, store-submission ready (0.4.1)
- [x] **Terms of use page (`/terms`)** — 10 sections, store-submission ready (0.4.1)
- [x] **Register page social accounts** — 13-platform selector, self-reported social links at registration time, API route accepts `socialLinks[]` (0.4.1)
- [x] **Proper README** (replace create-next-app stub — done pre-v0.4)
- [x] **`SECURITY.md`** — responsible disclosure, scope table, key constraints (v0.4.10)
- [x] **`CONTRIBUTING.md`** — dev setup, code style, changelog requirement, platform-addition guide (v0.4.10)
- [x] **`ARCHITECTURE.md`** — system design doc: directory layout, data model, adapter interfaces, deployment (v0.4.13)

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
| U11 | ✅ **`/verify` → `/edit` social links management** — add a "Social Accounts" section to the edit page that shows current social proofs (platform + username + status) with a "Verify →" link per platform and an "Add account" button linking to `/verify?handle={handle}` | `src/app/edit/[handle]/page.tsx` | Currently the edit page has no social proof management; you can only add them at registration or via the raw /verify flow |
| U12 | ✅ **`/pay/[handle]` QR image download** — "Save QR" button that uses canvas `toDataURL()` to export the QR as a PNG | `src/app/pay/[handle]/PayClient.tsx` | Useful for putting QR code in videos, stream overlays, invoices |
| U13 | ✅ **`/explore` loading skeleton** — replace the "Loading…" spinner with 6 placeholder card skeletons during initial fetch | `src/app/explore/page.tsx` | Reduces layout shift; looks more polished |
| U14 | ✅ **Tip page: "Copy tip page URL" button** — quick copy of `https://redd.love/@{handle}` alongside Share button | `src/app/[handle]/page.tsx` | Shareable URL is not directly copyable without using the browser address bar or ShareButton |
| U15 | ✅ **`/verify` → deep-link from tip page** — add "Is this your tip page? Verify your social accounts →" link visible when NO social proofs are recorded, or when proofs exist but are all `self-reported` | `src/app/[handle]/page.tsx` | Discoverability gap: creators who just registered don't know to go to /verify |

### Tier 3 — Half day each

| # | Item | Affected file(s) | Why it matters |
|---|------|-----------------|---------------|
| U16 | ✅ **Handle search results page** — `/search?q=` client page using `/api/search`; ranked results with handle, name, bio snippet (120 chars), platform badges with verified colour coding | `src/app/search/page.tsx` + `SearchClient.tsx` | Done v0.4.7 |
| U17 | ✅ **Profile completion indicator** — progress bar + 7 step-chips on edit page; Handle, RDD address, Display name, Bio, Website, Social link, Verified link; updates live as user types; green when all done | `src/app/edit/[handle]/page.tsx` | Done v0.4.8 |
| U18 | ✅ **`/explore` load-more / pagination** — "Load more · N remaining" button after 20 results; resets to page 1 on filter/sort change | `src/app/explore/page.tsx` | Done v0.4.9 |
| U19 | ✅ **Homepage — recent registrations widget** — horizontal scroll row showing last 5 registered handles; handle, display name, platform icons; server-side from `getAllIdentities()`; "View all →" link to /explore | `src/app/page.tsx` | Done v0.4.7 |
| U20 | ✅ **`/card/[handle]` — QR download** — "Save QR as PNG" button via XMLSerializer → Canvas 512×512, same approach as U12; `CardClientButtons.tsx` client component also fixes the `onClick`-in-server-component bug | `src/app/card/[handle]/CardClientButtons.tsx` | Done v0.4.7 |

### Extension-side UX (Love Button v2.6 targets)

These live in the `love-button` repo but are user-facing improvements to the extension experience.

| # | Item | Why it matters |
|---|------|---------------|
| E1 | ✅ **Popup: handle suggestions on "not found"** — `fetchSuggestions()` calls `/api/search`; "Did you mean?" chips with clickable handles | Done love-button v2.6 |
| E2 | ✅ **Popup: "Share this creator" button** — copies `{apiBase}/{handle}` to clipboard with green flash feedback | Done love-button v2.6 |
| E3 | ✅ **Popup: keyboard navigation** — ArrowDown/Up cycle history; Escape returns focus to search; Enter/Space activates | Done love-button v2.6 |
| E4 | ✅ **Extension: embed badge HTML snippet** — "📋 Embed" ghost button copies a self-contained `<a>` button badge (pure inline CSS, no external assets) | Done love-button v2.7 |
| E5 | **Content scripts: RDD address detection** — scan page text for `R[A-Za-z0-9]{33}` / `rdd1[a-z0-9]{39}` patterns; offer a "Look up this address on ReddID" context menu option | Many creators share raw addresses; this bridges the gap until they register |
| E6 | ✅ **Extension: configurable tip URL target** — Settings dropdown: Tip page vs Payment page; applies to popup + all 13 content scripts | Done love-button v2.8/v2.9 |
| E7 | ✅ **Extension popup: richer social proof badges** — clickable platform links; platform name display; green ● for proof-linked, grey ○ for self-reported; `socialProfileUrl()` for all 13 platforms | Done love-button v2.10 |
| E8 | **Popup: Trust Score display** — show creator trust score + achievement badges in the popup result | After Sprint B (trust score API needed) |
| E9 | **Popup: Markdown embed badge** — second embed option alongside HTML badge, for GitHub READMEs | Sprint C |
| E10 | **E5: RDD address detection in page content** — scan for `R[A-Za-z0-9]{33}` / `rdd1[a-z0-9]{39}`; context menu "Look up on ReddID" | Love Button v2.11 |

### Deployment & Production Readiness

These are not features but are required before any public launch announcement.

| # | Item | Priority |
|---|------|---------|
| D1 | **Railway deployment with persistent volume** — mount `/app/data` as a persistent volume; set `PORT` env; confirm `data/db.json` survives redeploys | **Blocker** — current Vercel/serverless deploy will wipe db.json on every deploy |
| D2 | **SqliteDataStore implementing DataStore interface** — swap `JsonFileDataStore` for SQLite via `better-sqlite3`; no route changes (all routes go through `getStore()`); migration script from db.json | **Blocker for scale** — flat JSON has no atomic writes; risk of corruption under concurrent requests |
| D3 | ✅ **Environment variable config** — `src/lib/config.ts`; `REDDID_DB_PATH`, `REDDID_BLOCKBOOK_URL`, `NEXT_PUBLIC_REDDID_BASE_URL`; `.env.example` documented; all three hardcoded path/URL sites updated | Done v0.4.11 |
| D4 | ✅ **Proper README** — project overview, feature table, architecture, API route reference, docs index | Done (pre-existing, updated) |
| D5 | ✅ **`SECURITY.md`** — responsible disclosure, scope table, out-of-scope, key constraints, contact | Done v0.4.10 |
| D6 | ✅ **`CONTRIBUTING.md`** — dev setup, env vars, code style, changelog requirement, platform-addition guide, PR workflow | Done v0.4.10 |
| D7 | ✅ **CI: `npm run build` check** — already present in `.github/workflows/ci.yml` `build` job | Done v0.4.5 |
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

---

## Sprint Plan — Active (Post Strategy Review 2026-05-26)

> Full cross-functional review findings documented in `docs/STRATEGY.md`.
> Sprints are ordered by dependency. Sprint A must complete before Sprint B begins.

### Sprint A — Production Foundation
**Blocker sprint. Do not announce publicly until this is complete.**

| # | Task | Status |
|---|---|---|
| A1 | `SqliteDataStore` — `better-sqlite3` implementation of DataStore interface; migration from db.json | [ ] |
| A2 | `getStore()` factory: switches via `REDDID_DB_ENGINE=sqlite\|json` env var | [ ] |
| A3 | SQLite-backed rate limiting: `rate_limit_counters` table replaces in-memory Map | [ ] |
| A4 | `sanitize(s, maxLen)` utility; applied to all identity write paths (bio, displayName, website, usernames) | [ ] |
| A5 | `editTokenExpiresAt` on Identity; edit API checks expiry; 1-year default on new registrations | [ ] |
| A6 | Railway deployment config: `railway.json` + volume mount for `/app/data` | [ ] |
| A7 | ISR on tip pages: `revalidate = 60` (remove `force-dynamic`); keep edit/verify/pay dynamic | [ ] |
| A8 | OG image cache headers; Blockbook calls deduplicated per page render | [ ] |

### Sprint B — Trust Score & Gamification
**Goal: Every tip page communicates creator credibility at a glance.**

| # | Task | Status |
|---|---|---|
| B1 | `computeTrustScore(identity)` → `{ score, max, breakdown }` in `src/lib/trustScore.ts` | [ ] |
| B2 | Trust score bar + number on tip page with "How this works" tooltip | [ ] |
| B3 | `computeBadges(identity)` → achievement badge list (Early Adopter, Multi-Social, Verified, etc.) | [ ] |
| B4 | Achievement badges on tip page header | [ ] |
| B5 | Trust score badge on /explore creator cards | [ ] |
| B6 | Sort /explore by trust score (new default); add "Top Creators" leaderboard section | [ ] |
| B7 | Staking tier (Micro/Staker/Senior/Whale) on staking calculator + tip page from live Blockbook balance | [ ] |
| B8 | RecentTips: "Be the first to tip @handle!" empty state | [ ] |

### Sprint C — Viral Growth Hooks
**Goal: Every user action has a natural sharing moment.**

| # | Task | Status |
|---|---|---|
| C1 | Post-registration sharing panel in `?new=1` banner: copy link + X/Bluesky pre-drafted share | [ ] |
| C2 | Post-verification sharing: "Share your verified profile" card after successful proof submission | [ ] |
| C3 | "Share Card" button on tip page → /card/[handle] link + copy | [ ] |
| C4 | Embed: "Copy Markdown badge" option alongside HTML (for GitHub READMEs) | [ ] |
| C5 | "Powered by ReddID" subtle footer on tip pages | [ ] |
| C6 | "Notify me when @handle registers" on /not-found — email stored in `waitlist` SQLite table | [ ] |
| C7 | Featured Creators section on homepage (top 3 by trust score or manually configured) | [ ] |
| C8 | /explore "New This Week" section | [ ] |
| C9 | `/about-redd` — non-technical ReddCoin explainer for newcomers from tip pages | [ ] |
| C10 | Homepage copy: add non-crypto-user sentence + "Built for ReddHeads" community framing | [ ] |

### Sprint D — Security Hardening & Store Submission
**Goal: Extension in Chrome Web Store + Firefox AMO. Platform hardened.**

| # | Task | Status |
|---|---|---|
| D1 | CORS headers on all API mutation routes via `src/middleware.ts` | [ ] |
| D2 | CSP headers in `next.config.ts`: `default-src 'self'`; allowlist blockbook + coingecko + fonts | [ ] |
| D3 | Server-side RDD address format validation in wallet linkage API | [ ] |
| D4 | Reserved handle expansion: brand names, system paths, offensive words | [ ] |
| D5 | Verify flow UX: numbered step indicator (Step 1/3), progress bar, "Copy challenge code" button | [ ] |
| D6 | Mobile QR fix: `min-width: 200px` on tip page QR; sticky "Send RDD" CTA on mobile | [ ] |
| D7 | `web-ext lint` 0 errors (S7) | [ ] |
| D8 | Extension screenshots per store/screenshots.md spec (S8) | [ ] |
| D9 | 1280×800 promotional tile (S9) | [ ] |
| D10 | TESTING.md full pass on Chrome latest (S10) | [ ] |
| D11 | TESTING.md full pass on Firefox latest + ESR (S11, S12) | [ ] |
| D12 | Chrome Web Store submission (S13) | [ ] |
| D13 | Firefox AMO submission + source zip (S14, S15) | [ ] |

### Sprint E — Analytics & Advanced Verification
**Goal: Understand what's working. Social proofs carry real trust weight.**

| # | Task | Status |
|---|---|---|
| E1 | Profile analytics on edit page: tip count + biggest tip from Blockbook | [ ] |
| E2 | Tip count + last-tip date public display on tip page | [ ] |
| E3 | Privacy-preserving analytics (Plausible or Umami) integration | [ ] |
| E4 | Discord webhook on new registration → #new-creators | [ ] |
| E5 | Social proof bio-matching: auto-upgrade proof status if ReddID handle found in platform bio | [ ] |
| E6 | Wallet signature verification via reddcoinjs-lib (`verifymessage`) | [ ] |
| E7 | `GET /api/identities/[handle]/export` — data export with editToken | [ ] |
| E8 | `DELETE /api/identities/[handle]` — soft-delete account with editToken | [ ] |
| E9 | Referral tracking: `referredBy` field; set from `?ref=handle` at registration | [ ] |
| E10 | Referral leaderboard on /explore | [ ] |

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
| v0.4.5 | 2026-05-25 | NavBar quick-lookup; /guide user guide; CI npm build check; exploration+edit UX polish |
| v0.4.7 | 2026-05-25 | /search client page; CardClientButtons (QR download + server-component fix); homepage recent registrations; /not-found fix |
| v0.4.8 | 2026-05-25 | Profile completion indicator (7-step progress bar + chips) on edit page |
| v0.4.9 | 2026-05-25 | Explore page load-more pagination (20/page, "Load more · N remaining" button) |
| v0.4.10 | 2026-05-25 | SECURITY.md + CONTRIBUTING.md added to repo root |
| v0.4.11 | 2026-05-25 | config.ts env-var centralisation; .env.example; NEXT_PUBLIC_ prefix fix; .gitignore .env.example negation |
| v0.4.12 | 2026-05-25 | PWA icons (192/512 PNG) generated from brand SVG; scripts/generate-icons.js; sharp devDependency |
| v0.4.13 | 2026-05-25 | ARCHITECTURE.md; ROADMAP stale items fixed; love-button v2.6 E1/E2/E3 marked done |
| v0.4.14 | 2026-05-25 | Edit page wallet management section — add, set-primary, remove RDD wallets inline |
| v0.4.15 | 2026-05-25 | ROADMAP updated: E4/E6 marked done; love-button v2.7 embed badge, v2.8 tip target |
| v0.4.16 | 2026-05-25 | love-button v2.9: E6 extended to all 13 content scripts (Twitter/X, Reddit, YouTube, Twitch, Instagram, TikTok) |
