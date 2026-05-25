# ReddWeb Product Specification

**Version:** 0.4 prototype  
**Last updated:** 2026-05-25

---

## Product Mission

ReddCoin is a 2014 UTXO cryptocurrency originally designed for social payments, tipping, creator support, and small-value human-scale value transfer. ReddID extends that mission into a modern identity and payment layer.

This product gives creators, individuals, and organizations a human-readable identity tied to a native RDD receiving address — so that sending RDD is as simple as "tip @alice" instead of copying a 34-character address.

---

## Product Goals

1. **Human-readable identity** — replace wallet addresses with @handles
2. **Wallet linkage** — prove you control an RDD address without revealing private keys
3. **Social proof** — link your social media accounts to your ReddID
4. **Creator tip pages** — shareable pages that receive RDD tips via BIP21/QR
5. **Agent delegation** — authorize bots and AI agents with explicit spend limits
6. **Payment intents** — structured payment requests, not raw address dumps
7. **Adapter-ready architecture** — future ReddRail/Gajumaru/wRDD integrations without rewrites

---

## User Flows

### New creator registers

1. User visits `/register`
2. Selects identity type: Person / Creator / Organization
3. Enters `@handle` (3–30 chars, availability checked live)
4. Enters RDD wallet address (format validated client-side)
5. Optionally enters display name, bio, website
6. Submits → `POST /api/identities`
7. Server returns identity + `editToken` (shown once, user copies to safe location)
8. Redirected to `/{handle}?new=1` (tip page with welcome banner)
9. Optionally: navigates to `/verify` to link social accounts

### Creator shares tip link

1. From `/{handle}` page: copies URL, uses Share button, or downloads tip card
2. Tip card (`/card/{handle}`) is print/screenshot-optimized with QR code
3. Follower clicks link → lands on `/pay/{handle}` (payment request page)
4. Follower selects tip amount → BIP21 QR updates
5. Follower opens their RDD wallet, scans QR or copies address, sends RDD
6. No login required on sender side

### Creator adds social proof

1. Creator visits `/verify` with their `editToken` in localStorage
2. Selects platform from supported list (all live platforms from platforms.ts)
3. Server generates 8-char hex challenge code (expires in 8h)
4. Creator posts challenge code in their bio, a post, or pinned content on that platform
5. Creator submits the proof URL where the code appears
6. Server records social proof as `verificationStatus: 'verified'` (v0.3: trust-based)
7. Social badge appears on public profile with "Self-Reported" label

### Creator edits profile

1. Creator visits `/edit/{handle}` (editToken must be in localStorage)
2. Can update: display name, bio, website, identity type
3. Can add or revoke wallet addresses
4. Submits → `PUT /api/identities/{handle}` with editToken in body
5. Profile updates immediately

### Creator creates an agent

1. Creator visits `/agents` with editToken in localStorage
2. Clicks "Create agent"
3. Fills in: agent slug, type, purpose, allowed actions, rails, spend limits, expiry
4. Submits → `POST /api/agents/{handle}`
5. Agent appears in `/[handle]/agents` publicly (purpose and actions shown)
6. Agent spend limits are private (not shown publicly)

---

## Public Creator/Tip Page (`/{handle}`)

**Server-rendered** (Next.js Server Component). No login required.

**Displays:**
- Identity type badge (non-human types only — human = no badge)
- Display name, bio, avatar (if set), website
- Primary RDD wallet address (QR code + copy button)
- Address type badge (Legacy / SegWit)
- Social proof badges (platforms with verification status label)
- Recent incoming tips (live from Blockbook v2 — real data)
- "Request payment" link → `/pay/{handle}`
- "Tip card" link → `/card/{handle}`
- "N authorized agents" link → `/[handle]/agents` (if agents exist)
- If revoked: full-page revocation banner, no wallet/payment info shown

**Does not display:**
- Private wallets
- Unlisted wallets
- Failed/expired/revoked social proofs
- editToken (ever)
- Agent spend limits or controller keys

---

## Payment Request Page (`/pay/{handle}`)

**Client-rendered** (dynamic BIP21 QR). No login required.

**Displays:**
- Creator info (name, bio, type badge)
- Tip amount chips (100 / 500 / 1K / 5K / custom RDD)
- Dynamic BIP21 QR code (updates on amount change)
- "Open in RDD wallet" BIP21 deep link
- "Copy address" fallback
- Payment intent ID (shareable link)
- Clear label: "This is a payment request. Send RDD from your wallet directly."

**Creates:** `PaymentIntent` with `status: 'requested'` via `POST /api/payments`

**Does not:** process payments, hold funds, or interact with the blockchain directly

---

## Agent Disclosure Page (`/[handle]/agents`)

**Server-rendered.** No login required.

Lists all active (non-revoked) agents for the handle.

**Shows per agent:**
- Display handle: `@parent.agentslug`
- Agent type badge (Bot / AI Agent / Service / etc.)
- Display purpose (public description)
- Allowed actions (human-readable list)
- Expiry date (if set)
- "Automated agent" label for bot/ai-agent types

**Does not show:**
- Spend limits (private)
- Controller keys (private)
- Allowed recipients (private)
- Revoked agents

---

## Mock/Demo Surfaces — Labeling Requirements

The following surfaces contain simulated or placeholder data. All must be **visibly labeled** before any public demo.

| Page | Mock content | Required label |
|---|---|---|
| `/live/{handle}` | Simulated tip events from fake names | **"Demo Mode — Simulated Activity"** banner at top |
| `/reserve` | All zeros, `isLive: false` | **"Not Live — Placeholder Data"** banner |
| `/bridge` | Static concept page | **"Concept Only — Bridge Not Active"** banner |
| `/staking` | Pure arithmetic, no real data | **"Estimate Only — Not Connected to Live Staking"** |
| Social proof badges | Self-reported, not API-verified | **"Self-Reported"** label on each badge until verified |
| Payment intents | MockRail, no real tx | **"Mock Payment"** label on intent status |

Any page that shows live data must be clearly distinguished from mock data. Never mix the two without labeling.

---

## Live vs Mocked Feature Table

| Feature | Status | Data source |
|---|---|---|
| Identity registration | ✅ Live | JsonFileDataStore |
| Public profile pages | ✅ Live | JsonFileDataStore |
| Social proof recording | ✅ Live (trust-based) | JsonFileDataStore |
| RDD market price | ✅ Live | CoinGecko API |
| On-chain tip history | ✅ Live | Blockbook v2 |
| Handle availability check | ✅ Live | JsonFileDataStore |
| OG image generation | ✅ Live | Server-rendered |
| Browser extension | ✅ Live | 12 platforms |
| Live tips SSE | 🎭 Mock | Simulated events |
| Reserve dashboard | 🎭 Mock | Hardcoded zeros |
| Bridge page | 🎭 Mock | Static content |
| Staking calculator | 🎭 Mock | Client-side math |
| Payment rail execution | 🎭 Mock | MockRail |
| Wallet signature verify | 🎭 Mock | Stored, not verified |
| Social proof auto-verify | 🎭 Mock | Trust-based |

---

## Deferred Features (Not in This Sprint)

| Feature | Reason |
|---|---|
| Gajumaru/ReddRail live | Associate Chains not live; adapter interface designed only |
| BSC/Base wRDD | No contract deployed; adapter interface designed only |
| Real wallet signature verification | Needs reddcoinjs-lib ECDSA; deferred to v0.4 |
| Social proof API auto-verify | Needs platform API keys; brittle; deferred to v0.4 |
| Live reserve dashboard | Needs real RDD reserve indexing; deferred |
| Admin/moderation surface | Needs auth beyond editToken; deferred |
| Handle recovery | Needs key-based design; deferred |
| Reputation scoring | Needs social signal design; deferred |
| Automated test suite | Add in sprint 2 with vitest |
| Rate limiting at infra level | Needs Redis/middleware; in-memory placeholder only |
| Avatar upload | Needs file storage (S3/R2); SSRF risk; deferred |
| DID/W3C VC | Future integration target; interfaces compatible |
| On-chain ReddID anchoring | Post-v1.0; architecture question unresolved |

---

## Resolved Architecture Decisions

| Decision | Resolution |
|---|---|
| Wallet model | `wallets[]` canonical; `primaryRddAddress` derived; `rddAddress` field migrated and retired |
| Agent namespace | Agents are child records under parent; dots not allowed in root handles; displayHandle is display-only |
| editToken scope | editToken for human identity edits only; agent operations need separate credentials (future) |
| Agent spend limits visibility | Private — not exposed in public API (prevents adversarial exploitation) |
| Avatar field | Accept URL string, no server-side fetch, disclaimer in docs; upgrade to upload service later |
| editToken expiry | `editTokenCreatedAt` field added; expiry not enforced yet; documented as prototype behavior |
| Challenge verification | Trust-based in v0.3; platform API auto-verify in v0.4 |
| Mock labeling | Mandatory before any public demo; specific labels defined per surface |
| DataStore abstraction | `DataStore` interface; `JsonFileDataStore` impl; all routes use `getStore()` |

---

## Open Questions (Unresolved)

| # | Question | Impact |
|---|---|---|
| 1 | What is the target deployment platform? (Vercel, VPS, Fly.io?) | Affects DataStore swap timing and env var model |
| 2 | When is a public URL confirmed? (redd.love? reddmobile.io?) | Affects metadata, OG base URL, PWA manifest |
| 3 | What RPC/indexer endpoint for native RDD? | Needed for real balance, tx confirmation, BIP21 validation |
| 4 | Will there be an admin interface? If so, how is it authenticated? | editToken is not suitable for admin auth |
| 5 | Gajumaru Associate Chains ETA — Q3/Q4 2026 confirmed? | Affects ReddRail adapter timeline |
| 6 | Is there a ReddCoin forum or community verification oracle planned? | Would enable community attestation (non-platform proofs) |
