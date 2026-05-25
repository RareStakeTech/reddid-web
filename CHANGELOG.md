# Changelog — ReddID Next (reddid-web)

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Planned
- `GET /api/identities/by-social?platform=X&username=Y` — social proof lookup endpoint (required by Love Button v2.1 content scripts for automatic creator matching without handle knowledge)
- ReddCoin node integration for live balance on tip pages (via Blockbook v2 API at `blockbook.reddcoin.com`)
- User authentication — session management so handle owners can update their profile
- Handle search / public directory page

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
