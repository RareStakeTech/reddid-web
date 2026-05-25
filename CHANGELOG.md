# Changelog — ReddID Next (reddid-web)

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Planned
- Platform API verification for social proofs (v0.3 — check bio/posts for challenge code via platform APIs)
- ReddRail state channel sessions (real Gajumaru Associate Chain integration; expected Q3/Q4 2026)
- AI-agent payment policies (v0.4)
- PWA icons (`/icon-192.png`, `/icon-512.png`) — placeholder manifest already in place

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
