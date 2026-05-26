# Changelog — ReddID Next (reddid-web)

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Planned
- Platform API verification for social proofs (v0.5 — check bio/posts for challenge code via platform APIs)
- ReddRail state channel sessions (real Gajumaru Associate Chain integration; expected Q3/Q4 2026)
- AI-agent payment policies (v0.4)
- PWA icons (`/icon-192.png`, `/icon-512.png`) — placeholder manifest already in place
- Wallet signature verification (ECDSA, reddcoinjs-lib) — v0.5
- `DELETE /api/identities/[handle]` self-service account deletion — v0.5
- Automated test suite (vitest + Testing Library) — v0.5

---

## [0.4.4] — 2026-05-25

### Fixed
- **CI build warnings eliminated** — `themeColor` moved from `metadata` export to `viewport` export in `layout.tsx` (Next.js 15+ deprecation; was generating 12 `⚠ Unsupported metadata themeColor` warnings during static page generation)
- **ESLint lint errors eliminated (0 warnings, 0 errors)** — 15 accumulated lint warnings now gone:
  - `eslint.config.mjs`: added `varsIgnorePattern: '^_'` and `caughtErrorsIgnorePattern: '^_'` alongside existing `argsIgnorePattern: '^_'`, so `_`-prefixed destructured vars (e.g. `_et`, `_vc`, `_ptx`) are properly ignored
  - `ShareButton.tsx`: removed unused `Copy` import from lucide-react
  - `api/identities/[handle]/route.ts`: removed unused `isValidHandle` import
  - `lib/db.ts`: removed unused `AgentIdentity` type import
  - `lib/providers/mock/mock-credential-provider.ts`: renamed `revokedBy` arg to `_revokedBy`
  - `components/LiveSession.tsx`: removed unused `InitData` interface
  - `app/edit/[handle]/page.tsx`: renamed `identity` state to `_identity` (state is written via setIdentity but identity value is never read in JSX; state retained for future use)

### Added
- **`public/brand/` — official ReddCoin brand assets (SVG Pack v2.1)** — all 17 SVG files from `brand.reddcoin.com`: full color logo, dark/light/mono/black/white variants, tag versions, and pinwheel mark in all colour variants; sourced from the official brand kit
- **NavBar logo updated to official brand** — `<Image>` component now renders `ReddCoin-Pinwheel-CLR-256.svg` (28×28, `unoptimized`, `priority`) instead of the hand-made "REDD" text badge; wordmark changed to "ReddID Next" with correct weight hierarchy
- **`layout.tsx` — favicon metadata updated** — `icons` metadata now points to the SVG pinwheel as primary icon with `.ico` fallback; Apple touch icon also set to pinwheel SVG
- **`manifest.webmanifest` — SVG icon entry added** — `ReddCoin-Pinwheel-CLR-256.svg` added with `"sizes": "any"` as primary icon so PWA install succeeds without PNG icons; PNG entries retained for future `icon-192.png` / `icon-512.png` generation

---

## [0.4.3] — 2026-05-25

### Added
- **`public/robots.txt`** (U3) — `Allow: /`, `Disallow: /api/`, `Sitemap:` pointer to `https://redd.love/sitemap.xml`
- **`src/app/sitemap.ts`** (U4) — dynamic Next.js sitemap; 11 static routes (home, explore, register, platforms, verify, staking, roadmap, bridge, reserve, privacy, terms) + one entry per public `/@handle` using `getAllIdentities()`; `lastModified` uses `identity.updatedAt`; silently omits handle routes if data layer unavailable at build time

### Changed
- **`[handle]/page.tsx`** (U5) — social proof platform badges are now clickable `<a>` links opening the creator's profile (`platformProfileUrl()` from `@/lib/platforms`); `target="_blank" rel="noopener noreferrer"` with `title` tooltip; badges with no known URL fallback to plain span as before
- **`[handle]/page.tsx`** (U6) — `?new=1` success banner now includes a "Verify social accounts →" CTA linking to `/verify?handle={handle}`; gives newly registered creators an immediate next step
- **`explore/page.tsx`** (U7) — empty search state replaced with branded block: magnifying glass icon, human-readable reason ("No creators match those filters" vs "No creators yet"), contextual description, "Clear search" button when filters are active
- **`explore/page.tsx`** (U8) — result count bar between controls and grid: "Showing N of M creators" when filters are active, "N creators registered" otherwise; "Clear filters ×" inline button resets both query and platform filter simultaneously

---

## [0.4.2] — 2026-05-25

### Added
- **`src/app/not-found.tsx`** (U1) — branded Next.js 404 page; large Ɍ symbol, "Handle not found" heading, explanation that the handle is not yet registered, "Register this handle" CTA (→ /register), "Browse creators" CTA (→ /explore), and "Search the ReddID directory →" footer link; replaces the off-brand Next.js default 404 that was shown on every unregistered `/@handle` visit
- **`src/app/error.tsx`** (U2) — branded global error boundary (`'use client'`); logs error to console via `useEffect`; shows ⚠ symbol, "Something went wrong" heading, non-custodial reassurance ("No funds or data have been affected"), optional `error.digest` reference for support escalation, "Try again" button (calls `reset()`) and "Go home" link; replaces the plain white Next.js crash screen

---

## [0.4.1] — 2026-05-25

### Added
- **`/privacy` page** — 10-section privacy policy required for Chrome Web Store and Firefox AMO store submission; covers: what is collected at registration (handle, RDD address, optional social links), what is never collected (private keys, passwords, email, analytics, telemetry), server log retention (30 days, IP hashed for abuse reports), extension local-storage contents (5-min cache, 20-entry history, settings), social proof honesty (challenge records what was declared, not independently verified), data deletion contact, children's privacy, governing law; linked from footer and register form
- **`/terms` page** — 10-section terms of use; establishes ReddID as non-custodial directory (not a money transmitter); acceptable use rules (no impersonation, no bulk squatting, no scraping for commercial use); beta disclaimer (v0.3, no uptime guarantee, no crypto loss liability); limitation of liability clause; linked from footer and register form
- **Register page — Social Accounts section** — collapsible "Social Accounts" section below the Website field; platform dropdown populated from all 13 `LIVE_PLATFORMS` with icon and name; username input with platform-specific placeholder; add/remove rows (max 10); blank rows stripped before submission; legal footnote on register form links to `/terms` and `/privacy`
- **`/api/identities` POST — `socialLinks` field** — register endpoint now accepts optional `socialLinks: { platform, username }[]` in the POST body; validates each entry against `ALL_PLATFORM_IDS` from `platforms.ts`; sanitises usernames (trim, max 100 chars); max 10 links; calls `addSocialProof()` for each valid link after identity creation with `proofMethod: 'self-reported'`, `verificationStatus: 'pending'`, `visibility: 'public'`; failures are non-fatal (loop continues)
- **`/pay/[handle]` — BIP21 payment request page** — focused payment UX distinct from the full tip page; server component resolves identity via `getIdentityByHandle()`, derives address via `primaryRddAddress()`, 404 if no address; `PayClient` (client component) manages: preset amount chips (Ɍ 10/25/50/100/250/500, toggle to deselect), custom amount number input (step 0.000001), live QR code regeneration via `buildBip21Uri(addr, amount)`, "Open in wallet" anchor tag opening the `reddcoin:` URI, copy address / copy Ɍ URI buttons with 1.6 s "Copied!" feedback, full address display in monospace, link back to the full tip page; address type badge (P2PKH Legacy / bech32 SegWit) in page header; non-custodial footer note

### Changed
- **`[handle]/page.tsx`** — added "Ɍ Pay" link in card footer alongside Share, Live session, and Tip card links; points to `/pay/{handle}`
- **`layout.tsx`** — footer now includes Privacy and Terms links (after Staking)

---

## [0.4.0] — 2026-05-25

### Added
- **`src/lib/platforms.ts`** — canonical platform registry, single source of truth for all supported platforms; exports `PLATFORMS` (17 entries), `PLATFORM_MAP`, `LIVE_PLATFORMS`, `ALL_PLATFORM_IDS`, `platformIcon()`, `platformProfileUrl()`; each entry carries id, name, icon, color, status (live/planned/beta), category, profileUrl function, description, federated flag, placeholder
- **`/platforms` page** — public-facing support matrix; groups all 17 platforms by category (mainstream, creator-aligned, decentralized, creator, developer); status chips (Live/Planned/Beta) with counts; per-card: icon, name, left-colored border, description, id badge, federated tag, placeholder example; plugin architecture section with 3-step contract explainer; CTAs to PLUGINS.md, GitHub issue tracker, and open PR
- **`GET /api/search`** — fuzzy search endpoint; `?q=query[&limit=20]`; scores identities across handle (exact +100, prefix +60, contains +30), displayName (+80/50/25), socialProof usernames (+70/40/20), bio (+10); returns ranked `results` array with `publicIdentity()` stripping applied; max 50 results per call
- **NavBar** — added Platforms link (`Layers` icon) between Explore and Bridge
- **Footer** — added Platforms link between Reserve Model and ReddBridge

### Changed
- `explore/page.tsx` — `PLATFORM_ICON` and `ALL_PLATFORMS` now derived from `LIVE_PLATFORMS` in `platforms.ts` instead of being hardcoded; platform filter drop-down uses `PLATFORM_MAP[id].name` for display labels (e.g. "Bluesky (AT Protocol)" instead of "bluesky")

---

## [0.3.0] — 2026-05-25

### Added
- **`GET /api/explore`** — returns all public identities sorted newest-first; strips `editToken` via `publicIdentity()`; used by the `/explore` creator directory
- **`/explore` creator directory** — `'use client'` grid page with live search (handle / display name / bio), platform filter drop-down, and A→Z sort; card hover animations; CTA linking to `/register`
- **`RecentTips` component** — fetches `Blockbook v2 /api/v2/address/{addr}?details=txs&pageSize=5`; renders last 5 incoming tips with amounts, relative timestamps, confirmations badge, and Blockbook explorer links; auto-refreshes every 60 s; wired into tip page below address section
- **`/bridge` ReddBridge page** — full placeholder page for the RDD ↔ Gajumaru wRDD reserve bridge; faux exchange UI (behind overlay explaining Q3/Q4 2026 ETA); how-it-works 4-step flow; feature callouts (100% reserve-backed, ReddRail integration, permissionless exit); stats grid; notify-me CTA
- **`MarketTicker` component** — fetches CoinGecko `simple/price` for `reddcoin`; shows USD price, 24 h change with trend icon (TrendingUp/Down/Minus), market cap, 24 h volume; compact mode (pill) and full mode; refreshes every 5 min; added to homepage above stats row
- **`/card/[handle]` shareable tip card** — full-screen print/screenshot-optimised branded card; large QR code on white background, handle, name, bio, social proofs, truncated address with type badge; print CSS hides nav; Share + Copy address action buttons; linked from tip page footer
- **`/staking` PoSV staking calculator** — interactive `StakingCalculator` client component; balance input with 1K/10K/100K/1M presets; APR range slider (1–20%); coin age slider with 7-day minimum / 60-day max-weight model; simple vs monthly-compounding toggle; daily/weekly/monthly/annual reward grid; balance-after-1-year summary; PoSV explainer cards; v0.4 AI-agent teaser; full FAQ
- **PWA manifest** — `public/manifest.webmanifest` with `theme_color: #E30613`, shortcuts to Register/Explore/Bridge; wired into `layout.tsx` via `metadata.manifest` + `metadata.themeColor`
- **NavBar** — added Explore, Bridge, and Staking links; version badge bumped to v0.3 beta

### Changed
- `[handle]/page.tsx` — imports `RecentTips`; adds recent tips section below address; adds `🃏 Tip card` link in card footer pointing to `/card/{handle}`
- `page.tsx` (homepage) — imports `MarketTicker`; renders ticker above stats row; version badge bumped to v0.3
- `layout.tsx` — footer version bumped to v0.3 beta; added bridge and staking footer links

---

## [0.2.0] — 2026-05-25

### Added
- **`GET /api/identities/by-social`** — social-proof lookup endpoint used by Love Button content scripts; finds an identity by `platform` + `username` query params; checks `socialProofs` array first, falls back to `handle === username`
- **Live on-chain balance** — `LiveBalance` client component fetches Blockbook v2 API (`blockbook.reddcoin.com/api/v2/address/{address}`), shows balance / total received / txn count on tip pages; auto-refreshes every 60 seconds
- **Social proof verification** — two-step wizard at `/verify`: generate 8-char hex challenge code (`POST /api/verify/challenge`), post it publicly on platform, submit proof URL (`POST /api/verify/confirm`); v0.1 is trust-based; platform API verification deferred to v0.3
- **Profile editing** — `PUT /api/identities/[handle]` endpoint gated by `editToken`; `/edit/[handle]` client-side form with localStorage pre-fill of editToken; bio counter, website field, error feedback
- **EditLink component** — shows "✎ Edit profile" link on tip page when `localStorage` holds the `reddid_edittoken_{handle}` key
- **ReddRail live session** — `/live/[handle]` prototype page with SSE event stream (`/api/live/[handle]/events`), animated Ɍ counter, live tip feed, BIP21 send panel; architecture strip explains Gajumaru state channels, Associate Chains timeline, and the v0.3→v0.4 roadmap
- **GitHub Actions CI** — `.github/workflows/ci.yml`: type-check (`tsc --noEmit`), `next build`, ESLint

### Changed
- `db.ts`: `Identity` gains `editToken` (generated at registration, 16-char hex) and `verificationChallenges` map; new functions: `getIdentityBySocial()`, `updateIdentity()`, `createVerificationChallenge()`, `confirmSocialProof()`, `publicIdentity()`
- `POST /api/identities`: returns `editToken` field alongside the identity (one-time exposure)
- `GET /api/identities/[handle]`: strips `editToken` and `verificationChallenges` from response via `publicIdentity()`
- `register/page.tsx`: saves `editToken` to `localStorage` under `reddid_edittoken_{handle}` immediately after successful registration
- `[handle]/page.tsx`: adds `LiveBalance`, `EditLink`, and "▶ Live session" link

---

## [0.1.0] — 2026-05-25

### Added
- **Handle registration** — `POST /api/identities` accepts `{ handle, displayName, rddAddress, bio, socialLinks }` and persists to a JSON flat-file store (`data/db.json`); validates handle format (3–30 chars, alphanumeric + hyphens), RDD address format (legacy `R…` and bech32 SegWit `rdd1…`), and real-time availability
- **Identity API** — `GET /api/identities/[handle]` returns registered identity or 404; used by the Love Button extension for handle lookups
- **Public tip pages** — `/@[handle]` route shows creator profile with RDD address, BIP21 QR code (wallet-scannable `reddcoin:` URI), configurable tip-amount shortcuts, platform social links, and ShareButton (Web Share API + clipboard fallback)
- **Address type badge** — "Legacy" and "SegWit" badges on tip pages derived from address prefix
- **Register page** (`/register`) — debounced real-time availability check (Loader2/CheckCircle2/XCircle icons), form validation, social link fields for Twitter, YouTube, Reddit, Twitch, Instagram, GitHub
- **Homepage** (`/`) — count-up animation on registered-handles stat (RAF-based ease-out cubic), Lucide feature icons, Ɍ currency symbol, link to register and explore
- **Roadmap page** (`/roadmap`) — dated milestones: v0.1 (identity registry), v0.2 (social proof), v0.3 (streaming micropayments), v0.4 (PoSV rewards)
- **Reserve dashboard** (`/reserve`) — educational page explaining the ReddCoin reserve strategy with static charts
- **Technical design doc** (`/design`) — public architecture overview for builders
- **NavBar** — Lucide icons (Home, PenLine, Map, BarChart2, BookOpen), mobile hamburger menu
- **Brand compliance** — `--redd-red: #E30613`, `--redd-red-dark: #B80510`, Ɍ (U+024C) currency symbol, Rubik/Roboto font stack via Google Fonts `<link>` in `<head>`
- **Validation library** (`src/lib/validation.ts`) — `getAddressType()` classifying legacy/SegWit/testnet/unknown, `buildBip21Uri()`, bech32 `rdd1` prefix detection
- **Platform badge component** — Unicode symbol badges for Twitter (𝕏), YouTube (▶), Reddit, Twitch, Instagram, GitHub (no lucide-react brand icons required)
- **ShareButton component** — Web Share API with clipboard fallback, Share2/Check icons
- **CountUp component** — RAF-driven ease-out cubic count-up animation

### Technical notes
- Next.js app router (v16) — `params` and `searchParams` must be awaited; `RouteContext` for typed route handlers
- Flat-file JSON database (`data/db.json`) — no native module dependencies, Windows-compatible
- Google Fonts loaded via `<link>` tags in `layout.tsx` `<head>` (not CSS `@import`, which conflicts with PostCSS/Tailwind v4)
- Lucide brand icons (Twitter, Youtube, Github) do not exist in lucide-react — replaced with PlatformBadge using Unicode symbols
