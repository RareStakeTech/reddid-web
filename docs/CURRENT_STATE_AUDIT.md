# ReddID Current State Audit
**Date:** 2026-05-26 | **Auditor:** Combined virtual team (architect, QA, PM, security, UX)
**Guiding rule:** No castles on fog. Features are only marked Real if code exists, can be built, and behaves honestly.

---

## Legend

| Label | Meaning |
|-------|---------|
| ✅ REAL | Code exists, builds, behaves as documented |
| 🟡 PARTIAL | Code exists but incomplete, limited, or has known gaps |
| 🟠 MOCK/DEMO | Code exists but returns fake/hardcoded data |
| 🔵 API-ONLY | Backend route works; no UI surface yet |
| 🔲 PLANNED | Mentioned in roadmap, zero code exists |
| 🔴 STALE | Referenced in docs but superseded or incorrect |
| ⚠ NEEDS LABEL | Real but must carry a visible disclaimer in UI |

---

## 1. Core Identity System

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Handle registration (POST /api/identities) | ✅ REAL | `src/app/api/identities/route.ts` | Validates format, checks uniqueness, stores to data/db.json |
| Handle lookup (GET /api/identities/[handle]) | ✅ REAL | Same file | Returns publicIdentity(); strips editToken |
| editToken bearer auth | 🟡 PARTIAL | `json-file-store.ts` | 16-char hex token; **no expiry field**; stored only in user's localStorage |
| Handle availability check (debounced) | ✅ REAL | `src/app/register/page.tsx` | 350ms debounce, live API call |
| Display name (60 char max) | ✅ REAL | `json-file-store.ts` line ~120 | Truncated server-side |
| Bio (160 char max) | ✅ REAL | `json-file-store.ts` + register form | Form maxLength=160; store truncates to 160; consistent |
| Website field | ✅ REAL | Register form + store | No URL validation beyond HTML type="url" |
| Handle delete / account wipe | 🔲 PLANNED | No route exists | Not built; editToken revocation not implemented |
| Data export (GDPR-style) | 🔲 PLANNED | No route exists | Not built |

---

## 2. Wallet & Address

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| RDD address field (v1 — inline at registration) | ✅ REAL | Register form | Stored as `rddAddress` on Identity root |
| Address type detection (legacy/segwit/testnet) | ✅ REAL | `src/lib/validation.ts`, AddressTypeBadge | Regex-based; not cryptographic |
| BIP21 URI construction | ✅ REAL | `buildBip21Uri()` in validation.ts | Used for QR and quick-tip amounts |
| QR code display | ✅ REAL | `QRCodeDisplay` component via react-qr-code | Renders BIP21 URI |
| Multiple wallet links (v2 — /api/identities/[handle]/wallets) | 🔵 API-ONLY | `wallets/route.ts` exists | Full CRUD API; **no UI to manage wallet list** |
| Wallet signature verification | 🔲 PLANNED | Mentioned in homepage beta notice | Deferred to v0.5 |
| primaryRddAddress() helper | ✅ REAL | `src/lib/types.ts` | Prefers wallets[] first, falls back to deprecated rddAddress |

---

## 3. Tip Page & Pay Flow

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Public tip page (/@handle) | ✅ REAL | `src/app/[handle]/page.tsx` | Full page with address, QR, copy, BIP21 quick-amounts |
| Pay page (/pay/[handle]) | ✅ REAL | `src/app/pay/` directory | Focused payment view |
| Quick-tip amount buttons (10/50/100/500 RDD) | ✅ REAL | TIP_AMOUNTS in tip page | Copies BIP21 URI with amount |
| Copy address button | ✅ REAL | CopyButton component | clipboard.writeText |
| Share button | ✅ REAL | ShareButton component | navigator.share with fallback |
| OG image (/api/og/[handle]) | ✅ REAL | `src/app/api/og/[handle]/` | Dynamic image generation |
| Shareable tip card (/card/[handle]) | ✅ REAL | `src/app/card/[handle]/` | Printable/shareable format |
| Payment intents (POST /api/payments) | 🟠 MOCK/DEMO | `MockPaymentRail` in payments route | Creates 'draft' status intents; **no real transaction submission** |
| ReddRail micro-payment channels | 🔲 PLANNED | Homepage "coming soon" banner | Awaits Gajumaru Associate Chain tooling |

---

## 4. Social Proof & Verification

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Social proof storage (13 platforms) | ✅ REAL | SocialProof[] in types.ts + store | Stored per-identity |
| Challenge-post flow (/verify page) | ✅ REAL | `src/app/verify/page.tsx` | 3-step: form → challenge code → confirm |
| Challenge code generation (POST /api/verify/challenge) | ✅ REAL | `verify/challenge/route.ts` | Generates unique code, stores in verificationChallenges[] |
| Proof confirmation (POST /api/verify/confirm) | ⚠ NEEDS LABEL | `verify/confirm/route.ts` + `confirmSocialProof()` | Sets verificationStatus='verified' but **does NOT fetch the URL to confirm it exists**. Trust-based only. |
| Platform API auto-verification | 🔲 PLANNED | Comment in store: "v0.5: auto-verify via platform API" | Not built |
| verificationStatus field | ⚠ NEEDS LABEL | types.ts | 'verified' in v0.4 means "user declared a proof URL" — not independently checked |
| Trust level display on tip page | ✅ REAL | TrustBadge component, PlatformBadge | Shows 'challenge-post-verified' vs 'self-reported' |
| Social proofs in Love Button popup | ✅ REAL | popup.js E7 — renderSocialProofs() | Green ● for verified, grey ○ for self-reported |
| Profile URL links from badges | ✅ REAL | socialProfileUrl() in popup.js, platformProfileUrl() in platforms.ts | Links to actual platform profiles |

---

## 5. Explore & Discovery

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Explore page (/explore) | ✅ REAL | `src/app/explore/page.tsx` | Client-side search + filters, pagination |
| /api/explore endpoint | ✅ REAL | `src/app/api/explore/route.ts` | Returns publicIdentity[] sorted by newest |
| Handle search (client-side) | ✅ REAL | explore/page.tsx useMemo filter | Fuzzy match on handle, displayName, bio |
| /api/search endpoint | ✅ REAL | `src/app/api/search/route.ts` | Server-side search route exists |
| Platform filter on explore | ✅ REAL | explore/page.tsx | Filters by socialProofs[].platform |
| Load-more pagination | ✅ REAL | PAGE_SIZE=20, displayLimit state | Client-side; not cursor-based |
| /api/identities/by-social | ✅ REAL | Route exists | Lookup by platform+username; used by Love Button |
| Recent registrations on homepage | ✅ REAL | page.tsx getAllIdentities() | Shows last 5 by createdAt |
| Count-up animation stat | ✅ REAL | CountUp component | Animates identity count from 0 |

---

## 6. Love Button Extension (v2.10.0)

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Manifest V3 compliance | ✅ REAL | manifest.json | Service worker background, host_permissions |
| 13 content scripts declared | ✅ REAL | manifest.json content_scripts | twitter, reddit, youtube, twitch, instagram, tiktok, bluesky, mastodon, rumble, truthsocial, odysee, kick, github |
| Tip button injection (6 standalone: twitter/reddit/youtube/twitch/instagram/tiktok) | ✅ REAL | content/*.js + E6 | Uses GET_API_BASE + tipUrlTarget |
| Tip button injection (7 utility-lib: bluesky/mastodon/rumble/truthsocial/odysee/kick/github) | ✅ REAL | content/*.js + reddid-platform-util.js | Same pattern |
| tipUrlTarget setting ('tip'/'pay') | ✅ REAL | options.html + chrome.storage.sync | Persists across tabs; all 13 scripts respect it |
| Popup: handle lookup by current tab URL | ✅ REAL | popup.js detectPlatform() | Maps tab URL to platform+username |
| Popup: balance via blockbook | ✅ REAL | background.js GET_BALANCE | External call to blockbook.reddcoin.com |
| Popup: BIP21 tip button | ✅ REAL | popup.html | Links to ${apiBase}/${handle} |
| Popup: social proof badges (E7) | ✅ REAL | popup.js renderSocialProofs() + PLAT_NAMES | Links to platform profiles, green/grey status dots |
| Popup: transaction history | ✅ REAL | background.js GET_TXNS | External blockbook call |
| Options page: API base URL | ✅ REAL | options.html/js | chrome.storage.sync |
| Options page: tipUrlTarget | ✅ REAL | options.html/js | chrome.storage.sync |
| Context menu: "Look up on ReddID" | ✅ REAL | background.js contextMenus | Opens ${apiBase}/${handle} |
| Firefox build (love-button-firefox/) | ✅ REAL | build-firefox.js | Mirrors Chrome with MV3 adaptations |
| web-ext lint: UNSAFE_VAR_ASSIGNMENT | 🟡 PARTIAL | 7 warnings on popup.js innerHTML | Uses escapeHtml() sanitization; warnings are false positives but need review |
| web-ext lint: MANIFEST_FIELD_UNSUPPORTED (Firefox) | 🟡 PARTIAL | service_worker flag | Firefox 109+ supports it; older web-ext linter flags it |
| Chrome Web Store submission | 🔲 PLANNED | build produces .zip | Not submitted; store metadata, screenshots, policy review pending |
| Firefox AMO submission | 🔲 PLANNED | Firefox build exists | Not submitted |

---

## 7. Agent Delegation

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Agent schema (AgentIdentity type) | ✅ REAL | types.ts | Full type with agentType, actions, rails, limits |
| POST /api/agents/[handle] | ✅ REAL | agents/route.ts | Creates agent with full validation |
| GET /api/agents/[handle] | ✅ REAL | agents/route.ts | Returns publicAgent() — strips spend limits |
| GET/DELETE /api/agents/[handle]/[id] | ✅ REAL | agents/[id]/route.ts | Per-agent operations |
| Agent management UI | 🔲 PLANNED | Homepage: "v0.4 types, UI coming" | No UI — API only |
| Agent spend limit enforcement | 🔲 PLANNED | PolicyEngine commented in payments route | "deferred to v0.5" |
| Agent tip execution | 🔲 PLANNED | MockPaymentRail only | No real tx submission |

---

## 8. Data Store & Infrastructure

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| JsonFileDataStore | ✅ REAL | `src/lib/store/json-file-store.ts` | Flat JSON (data/db.json); fully functional |
| DataStore interface (getStore() abstraction) | ✅ REAL | `src/lib/store/interface.ts` | Clean swap boundary for SQLite |
| Atomic writes | 🔴 STALE/MISSING | json-file-store.ts | writeDb() overwrites file — no fsync, no temp+rename; corruption risk under concurrent writes |
| SQLite/Turso data store | 🔲 PLANNED | No better-sqlite3 in package.json | Not started |
| Rate limiting (in-memory) | 🟡 PARTIAL | API routes | Exists but resets on every server restart; not suitable for production |
| Input sanitization | 🟡 PARTIAL | Zod validation in API routes | Present; no DOMPurify or server-side HTML strip layer |
| editToken expiry | 🔲 PLANNED | No expiry field in schema | Tokens never expire |
| Reserve snapshot | 🟠 MOCK/DEMO | getReserveSnapshot() | Returns hardcoded zeros + isLive: false |
| Live balance (blockbook.reddcoin.com) | ✅ REAL | LiveBalance component, background.js | External call; depends on Reddcoin blockbook availability |
| ISR / static generation | 🟡 PARTIAL | All pages use `force-dynamic` | Could use revalidate=60 on tip pages; currently all SSR |
| deployment (Railway/Vercel) | 🔲 PLANNED | Not deployed | Running locally only |

---

## 9. Supporting Pages

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Homepage | ✅ REAL | src/app/page.tsx | Honest beta notice; stat cards |
| Roadmap page (/roadmap) | ✅ REAL | src/app/roadmap/ | Renders ROADMAP.md from docs/ |
| Architecture/docs page (/docs) | ✅ REAL | src/app/docs/ | Technical design page |
| Staking calculator (/staking) | ✅ REAL | src/app/staking/ | PoSV math; no backend dependency |
| Bridge page (/bridge) | 🟠 MOCK/DEMO | src/app/bridge/ | Placeholder; ReddRail not live |
| Reserve dashboard (/reserve) | 🟠 MOCK/DEMO | getReserveSnapshot() returns zeros | Educational only; isLive: false |
| Edit handle page (/edit/[handle]) | ✅ REAL | src/app/edit/[handle]/ | Updates identity via PATCH /api/identities/[handle] |
| Live session page (/live/[handle]) | 🟡 PARTIAL | src/app/live/[handle]/ | SSE events stream; limited functionality |
| Guide page (/guide) | ✅ REAL | src/app/guide/ | How-to static page |
| Platforms page (/platforms) | ✅ REAL | src/app/platforms/ | Platform registry display |
| Privacy page (/privacy) | ✅ REAL | src/app/privacy/ | Static |
| Terms page (/terms) | ✅ REAL | src/app/terms/ | Static |
| RDD market ticker | ✅ REAL | MarketTicker component | External price API; graceful fallback |
| Sitemap (/sitemap.xml) | ✅ REAL | src/app/sitemap.ts | Dynamic generation |
| PWA manifest | ✅ REAL | public/manifest.json | |
| Not-found page | ✅ REAL | src/app/not-found.tsx | Custom 404 |

---

## 10. Documentation Reconciliation Issues Found

| Issue | Location | Severity | Fix Applied? |
|-------|----------|----------|-------------|
| love-button package.json "2.5.0" vs manifest.json "2.10.0" | love-button/package.json | HIGH | ✅ Fixed: bumped to 2.10.0 |
| reddid-web package.json version "0.1.0" | reddid-web/package.json | MED | ⏳ Fix in Sprint 0 |
| Register page footer: "v0.1 beta · … ships in v0.2" | src/app/register/page.tsx | HIGH | ✅ Fixed: now "v0.4 beta · … ships in v0.5" |
| STRATEGY.md bio limit "280 chars" | docs/STRATEGY.md | LOW | ⏳ Fix in Sprint 0 (real limit is 160) |
| "independently verified" wording risk | Any doc that says proof is verified | HIGH | ⚠ Verify page has honest disclaimer in-code; needs review in love-button README |
| Reserve dashboard shows zeros with no label | /reserve page | MED | ⚠ Needs visible "Demo data" label in UI |
| Bridge page shows no "not live" label | /bridge page | MED | ⚠ Needs visible disclaimer |
| payment intents create "draft" with no UI warning | /api/payments | MED | ⚠ No real tx; needs UI clarification |

---

## Summary Scorecard

| Category | Real | Partial | Mock | Planned |
|----------|------|---------|------|---------|
| Core identity | 7 | 1 | 0 | 2 |
| Wallet/address | 4 | 0 | 0 | 2 |
| Tip/pay flow | 7 | 0 | 1 | 1 |
| Social proof | 5 | 0 | 0 | 1 |
| Explore/discovery | 7 | 0 | 0 | 0 |
| Love Button | 15 | 2 | 0 | 2 |
| Agent delegation | 4 | 0 | 0 | 3 |
| Infrastructure | 2 | 3 | 1 | 4 |
| Supporting pages | 13 | 1 | 2 | 0 |
| **TOTAL** | **64** | **7** | **4** | **15** |

**Bottom line:** The product is substantially real. The honest summary is:
- Tip pages, registration, social proof flow, explore, Love Button — all real and functional
- Reserve, bridge, and payment intents are clearly mock/demo and need visible labels
- Agent delegation has real API infrastructure but zero UI
- SQLite, deployment, editToken expiry, account deletion are not started
