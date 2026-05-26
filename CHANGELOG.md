# Changelog — ReddID Next (reddid-web)

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Planned
- Platform API verification for social proofs (v0.5 — check bio/posts for challenge code via platform APIs)
- ReddRail state channel sessions (real Gajumaru Associate Chain integration; expected Q3/Q4 2026)
- AI-agent payment policies (v0.4)
- Wallet signature verification (ECDSA, reddcoinjs-lib) — v0.5
- Automated test suite (vitest + Testing Library) — v0.5

---

## [0.4.28] — 2026-05-26 — Sprint 4: S4-06 SQLite-backed rate limiting

### Changed (S4-06 — persistent rate limiting)
- `src/lib/store/sqlite-store.ts` — `checkRateLimit()` return type updated: now returns `{ ok, remaining, resetAt }` matching `RateLimitResult` (previously returned `boolean`)
- `src/lib/rate-limit.ts` — Rewired to automatically select backend based on `REDDID_DB_ENGINE`:
  - `'sqlite'` → delegates to `SqliteDataStore.checkRateLimit()` — persists across server restarts; counts survive Railway redeployments
  - `'json'` → existing in-memory Map behavior (no change for local dev)
  - No call-site changes — all API routes continue to call `checkRateLimit(ip, action, RATE_LIMITS.xxx)` unchanged
  - `RATE_LIMITS` presets unchanged (register: 3/hr, verifyChallenge: 10/10min, report: 5/hr, recover: 5/hr, etc.)
  - Future multi-instance upgrade path documented (Redis/Upstash when needed)

### Build results (v0.4.28)
- `tsc --noEmit` → exit 0 ✅
- `npm run lint` → exit 0 ✅
- `npm run build` → exit 0, 26 static pages ✅

---

## [0.4.27] — 2026-05-26 — Sprint 4: S4-01+02+03 SQLite store + migration

### Added (S4-01 + S4-03 — SqliteDataStore with WAL mode)
- `src/lib/store/sqlite-store.ts` — NEW: `SqliteDataStore` implementing the full `DataStore` interface
  - WAL journal mode (`PRAGMA journal_mode = WAL`) — concurrent reads don't block writes
  - `synchronous = NORMAL` — safe with WAL; better performance than FULL
  - `foreign_keys = ON`
  - **Schema**: `identities(handle PK, data TEXT, rdd_address indexed, created_at, updated_at, revoked_at)` + `social_proof_index(handle, platform PK, username)` + `abuse_reports` + `revocation_events` + `rate_limit_counters`
  - **Hybrid storage**: full Identity JSON in `data` column; indexed columns denormalized for fast lookup
  - **`saveIdentity()`**: private helper that upserts identity + rebuilds social_proof_index atomically in one transaction
  - **All 25 DataStore interface methods** implemented: all identity CRUD, social proofs, agents, wallets, abuse reports, reserve snapshot
  - **Bonus S4-06 groundwork**: `checkRateLimit()` method for SQLite-backed rate limiting (replaces in-memory Map in rate-limit.ts)
  - **Audit trail**: `deleteIdentity()` writes to `revocation_events` table before deleting the identity row
  - Multi-instance warning documented in code and ARCHITECTURE.md
- `src/lib/store/index.ts` — `getStore()` now branches on `DB_ENGINE`:
  - `'sqlite'` → instantiates `SqliteDataStore()` (no `runMigrations()` — SQLite bootstraps its own schema)
  - `'json'` → existing `JsonFileDataStore` path (unchanged)
  - Exports `SqliteDataStore` for direct use by rate-limit module
- `package.json` — Added `migrate:sqlite` and `migrate:sqlite:dry` scripts

### Added (S4-02 — Migration script)
- `scripts/migrate-to-sqlite.ts` — One-time migration from `data/db.json` → `data/reddid.db`
  - CLI: `npm run migrate:sqlite:dry` (preview) / `npm run migrate:sqlite` (execute)
  - Applies JSON schema migrations (v0→v2) before writing to SQLite
  - Upserts: safe to re-run; existing SQLite is backed up to `.pre-migration.bak` before overwrite
  - Row-count verification at the end; exits non-zero if mismatch
  - Clear next-steps output (how to enable, how to roll back)
- **Migration smoke-test result** (2026-05-26):
  - 3 identities → 3 ✅  |  1 social proof index entry  |  0 abuse reports → 0 ✅
  - WAL mode confirmed: `journal_mode = wal`
  - Rollback path: set `REDDID_DB_ENGINE=json` to switch back instantly (db.json preserved)

### Build results (v0.4.27)
- `tsc --noEmit` → exit 0 ✅
- `npm run lint` → exit 0 ✅
- `npm run build` → exit 0, 26 static pages ✅
- `npm run migrate:sqlite:dry` → dry-run passes, 3 identities listed ✅
- `npm run migrate:sqlite` → migration passes, row counts verified ✅
- SQLite direct verify → WAL mode confirmed, handles accessible ✅

---

## [0.4.26] — 2026-05-26 — Sprint 4: S4-05 env vars + S4-07+08 security headers

### Added (S4-07 + S4-08 — HTTPS enforcement + security headers)
- `next.config.ts` — Fully populated from empty skeleton:
  - **HTTPS redirect** (`redirects()`): fires when `x-forwarded-proto: http` header is present; redirects permanently to `https://<hostname>` derived from `NEXT_PUBLIC_REDDID_BASE_URL` env var (not hardcoded domain)
  - **Strict-Transport-Security**: `max-age=63072000; includeSubDomains; preload` (2-year HSTS with preload list eligibility)
  - **X-Frame-Options**: `DENY` — clickjacking protection
  - **X-Content-Type-Options**: `nosniff` — MIME-type sniffing prevention
  - **Referrer-Policy**: `strict-origin-when-cross-origin`
  - **Permissions-Policy**: `camera=(), microphone=(), geolocation=(), payment=()`
  - **Content-Security-Policy**: `default-src 'self'`; allowlisted `fonts.googleapis.com`, `fonts.gstatic.com`, `blockbook.reddcoin.com`, `api.coingecko.com`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; includes `unsafe-inline`/`unsafe-eval` for Next.js App Router hydration (nonce-based hardening deferred to v0.5)
  - Applied via `headers()` to all routes via `source: '/(.*)'`

### Added (S4-05 — environment variable management)
- `src/lib/config.ts` — New exports:
  - `DB_ENGINE: 'json' | 'sqlite'` — controlled by `REDDID_DB_ENGINE` env var; defaults to `'json'`; `'sqlite'` available after Sprint 4 S4-01
  - `ADMIN_SECRET: string | undefined` — controlled by `ADMIN_SECRET` env var; used by admin abuse-report API
  - Updated JSDoc to list all required Railway env vars and generation commands
- `src/lib/store/index.ts` — `getStore()` now imports `DB_ENGINE` from config; throws a descriptive error if `REDDID_DB_ENGINE=sqlite` is set before `SqliteDataStore` is implemented; includes `runMigrations()` guard within the `'json'` branch only
- `.env.example` — Added `REDDID_DB_ENGINE` and `ADMIN_SECRET` entries; clarified which vars are REQUIRED on Railway vs optional

### Build results (v0.4.26)
- `tsc --noEmit` → exit 0 ✅
- `npm run lint` → exit 0 ✅
- `npm run build` → exit 0, 26 static pages compiled ✅
- Security headers: X-Frame-Options, HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

---

## [0.4.25] — 2026-05-26 — Sprint 4 prep: migrate.ts atomic write fix + sprint plan update

### Fixed
- `src/lib/migrate.ts` — `runMigrations()` previously called `fs.writeFileSync()` directly when persisting migrated records, bypassing the tmp→rename atomic write protection used by `writeDb()` in `json-file-store.ts`. If the process was killed mid-write (e.g., Railway restart during startup), `db.json` could be left partially written and corrupt. Fixed: now writes to `DB_PATH + '.migrate.tmp'` and then `fs.renameSync(tmp, DB_PATH)` — matching the pattern in `json-file-store.ts`.

### Changed (docs)
- `docs/SPRINT_PLAN.md` — Sprint 4 updated: architect review incorporated (2026-05-26). S4-09 marked as already live. S4-12 removed (duplicate of S1-01). S4-10 (test suite) moved to Sprint 5 as gate item (S5-10). S4-06 clarified as SQLite-backed rate limiting (not Upstash). Execution order and trap notes added.
- `docs/SPRINT_PLAN.md` — Sprint 5 updated: S5-10 (automated test suite) and S5-11 (wallet sig verification via reddcoinjs-lib) added.
- `docs/ROADMAP.md` — Added deprecation notice at top: lettered sprint plan (A–E) superseded by `SPRINT_PLAN.md`. Leaderboard item (Sprint B6) flagged as explicitly rejected. Historical sections retained.

---

## [0.4.24] — 2026-05-26 — Sprint 3: Server-side proof verification + admin reports

### Added

**S3-01/S3-02 — Server-side URL fetch for social proof verification**
- `src/lib/proof-fetcher.ts` — NEW: `fetchProofUrl(proofUrl, challengeCode)` function; fetches the user-supplied URL (5s timeout, 512KB body cap, HTTPS only) and searches the response body for the 8-char hex challenge code (case-insensitive); returns `{ found, reachable, httpStatus?, error? }`
- `src/app/api/verify/confirm/route.ts` — integrated proof fetcher; when `proofUrl` is present, the route now reads the pending challenge code from the identity, fetches the URL, and either: (a) upgrades to `proofMethod: 'url-fetch-verified'` if the code is found; (b) returns 422 `CODE_NOT_FOUND` with user guidance if the URL loaded but the code was absent; (c) returns 503 `FETCH_FAILED` with retry suggestion if the URL was unreachable; TOKEN_EXPIRED detection added; response now includes `proofMethod` field so the client can show the trust level achieved
- `src/lib/store/interface.ts` — `confirmSocialProof()` signature extended with optional `proofMethod?: ProofMethod` parameter (default `'challenge-post'`)
- `src/lib/store/json-file-store.ts` — `confirmSocialProof()` now accepts and stores the `proofMethod` parameter; updated comment explains the 'challenge-post' vs 'url-fetch-verified' distinction
- `src/lib/db.ts` — `confirmSocialProof` shim forwards the optional `proofMethod` parameter

**S3-03 — Distinguish trust-based vs. URL-verified proofs in UI**
- `src/lib/types.ts` — `ProofMethod` union: added `'url-fetch-verified'`; `TrustLevel` union: added `'url-fetch-verified'`
- `src/components/TrustBadge.tsx` — new `'url-fetch-verified'` entry in `LEVEL_CONFIG`: green badge ("URL Verified"), tooltip explains server independently confirmed the proof; `'challenge-post-verified'` tooltip updated to clarify trust-based nature
- `src/app/[handle]/page.tsx` — trust level mapping updated: `proofMethod === 'url-fetch-verified'` → `TrustLevel: 'url-fetch-verified'` (green); otherwise `'challenge-post-verified'` (blue)

**S3-05 — Re-verify expired/failed social proofs**
- `src/app/edit/[handle]/page.tsx` — `StatusBadge` component updated: handles `expired` and `url-fetch-verified` statuses; shows orange "Challenge Expired" badge for expired proofs; shows green "URL Verified ✓✓" badge for URL-verified proofs; "Verify →" button now shows "Re-verify →" (orange) for expired/failed proofs; verify link now passes `?username=` param to pre-fill the verify page
- `src/app/verify/page.tsx` — reads `?username=` from search params to pre-fill the username field on re-verify flow

**S3-07 — Abuse reporting admin queue**
- `src/lib/types.ts` — `StoredAbuseReport` type extends `AbuseReport` with `reviewed`, `reviewedAt`, `reviewNote` fields; `DbSchema` now includes `abuseReports: StoredAbuseReport[]`
- `src/lib/store/interface.ts` — `saveAbuseReport()`, `getAbuseReports()`, `markReportReviewed()` added to DataStore contract
- `src/lib/store/json-file-store.ts` — implements all three abuse report methods; `EMPTY_DB` now initializes `abuseReports: []`; `saveAbuseReport()` prepends newest-first
- `src/lib/db.ts` — shim exports for `saveAbuseReport`, `getAbuseReports`, `markReportReviewed`
- `src/app/api/report/route.ts` — reports now persisted via `saveAbuseReport()` instead of console.log only
- `src/app/api/admin/reports/route.ts` — NEW: `GET` lists all reports; `POST` marks a report reviewed with optional note; protected by `Authorization: Bearer <ADMIN_SECRET>` header
- `src/app/admin/reports/page.tsx` — NEW: server component admin triage queue at `/admin/reports?secret=<ADMIN_SECRET>`; shows pending (orange) and reviewed reports; API hint for curl-based marking; `robots: noindex`
- `src/lib/providers/mock/mock-revocation-registry.ts` — fixed: two `EMPTY_DB` literals updated to include `abuseReports: []` to match new `DbSchema` type

### Changed
- `package.json` — version bumped to `0.4.24`

---

## [0.4.23] — 2026-05-26 — Sprint 3: Trust foundations

### Added

**S3-04 — Revoke social proof (self-service)**
- `src/lib/store/json-file-store.ts` — `removeSocialProof(handle, platform, editToken)`: sets `verificationStatus='revoked'` on the matching proof; the record is kept for audit but soft-deleted from the public view; throws `NOT_FOUND` if no active proof, `HANDLE_NOT_FOUND` if handle missing, `TOKEN_EXPIRED`/`UNAUTHORIZED` from `checkEditToken()`
- `src/lib/store/interface.ts` — `removeSocialProof()` added to DataStore contract
- `src/lib/db.ts` — `removeSocialProof` shim export
- `src/app/api/identities/[handle]/socials/[platform]/route.ts` — `DELETE /api/identities/{handle}/socials/{platform}` (body: `{ editToken }`); returns `{ ok, identity }` on success; `GET` variant returns the public social proof record for a given platform
- `src/lib/db.ts` `publicIdentity()` — revoked social proofs are now filtered out (alongside the existing proofUrl strip) so they do not appear on public tip pages or in the explore API
- `src/app/edit/[handle]/page.tsx` — Trash icon button added to each social account row; calls `DELETE /api/identities/{handle}/socials/{platform}` with native `window.confirm()` guard; TOKEN_EXPIRED detection consistent with other wallet handlers; `socialRemoveError` displayed inline below the accounts list

**S3-08 — Privacy: strip proofUrl from public identity**
- `src/lib/types.ts` — new `PublicSocialProof = Omit<SocialProof, 'proofUrl'>` type; `PublicIdentity` updated to use `socialProofs: PublicSocialProof[]` (previously inherited the full `SocialProof[]` including proofUrl)
- `src/lib/db.ts` `publicIdentity()` — maps each social proof through `({ proofUrl: _pu, ...proof }) => proof` before returning; proofUrl remains in the stored `Identity` and is available to server-side code (S3-01 URL fetch will use it)

**S3-09 — Trust badge tooltips ✅ already complete**
- `src/components/TrustBadge.tsx` — LEVEL_CONFIG already contains plain-English tooltip for each trust level; surfaced via `title` attribute; no code change required

### Changed
- `package.json` — version bumped to `0.4.23`

---

## [0.4.22] — 2026-05-26 — Sprint 2: TOKEN_EXPIRED UX polish

### Added

**S2-11 — Inline token-expiry recovery on edit and verify pages**
- `src/app/edit/[handle]/page.tsx` — when any mutation (profile save, add/remove/set-primary wallet) returns HTTP 401 with "expired" in the error message, an amber recovery panel slides in between the profile completion bar and the form instead of showing the raw API error string; panel contains a "Reissue token" button that calls `POST /api/identities/{handle}/token`, writes the new token to `localStorage`, and clears the expiry state; `RefreshCw` icon (lucide) used on the button
- `src/app/verify/page.tsx` — same TOKEN_EXPIRED detection in both `requestChallenge` and `confirmProof`; an amber panel appears in the error area for each step with a "Reissue token" button; the challenge step message reassures the user that "the challenge code above is still valid"

### Changed
- `package.json` — version bumped to `0.4.22`

---

## [0.4.21] — 2026-05-26 — Sprint 2: Creator Onboarding & Shareability

### Added

**S2-01 — Tip card social share buttons**
- `src/app/card/[handle]/CardClientButtons.tsx` — "Share on 𝕏" button (Twitter intent with pre-filled `@handle + redd.love URL` text) and "WhatsApp" button (wa.me deep link with pre-filled message); both open in new tab; appear prominently at the top of the action bar

**S2-02 — Markdown embed badge**
- `src/app/api/badge/[handle]/route.ts` — `GET /api/badge/[handle]`; returns a shields.io-style SVG badge in ReddCoin red; brand "Tip" label on left, `@handle · Ɍ RDD` on right; green dot overlay if any social proof is verified; 5-minute public cache
- `src/app/[handle]/page.tsx` — "Embed badge" section added between the verify CTA and the card footer; shows a "Copy Markdown" button with the canonical `[![...](badge)](tippage)` snippet

**S2-05 — Post-registration onboarding guide**
- `src/app/[handle]/page.tsx` — `?new=1` success banner replaced with a 3-step onboarding guide: ① Tip page live (green ✓, immediate); ② Link social accounts (red → CTA button to /verify); ③ Share your handle (greyed, last step). Visually progressive with connectors between steps.

**S2-06 — Explore "Most verified" sort**
- `src/app/explore/page.tsx` — third sort option added: "Most verified" sorts creator cards by number of `verificationStatus === 'verified'` social proofs, descending; local `PublicIdentity` type updated to include `verificationStatus?: string` on socialProofs

### Fixed
- `src/lib/platforms.ts` — Nostr icon changed from `'⚡'` (clash with Kick) to `'◆'`

### Changed
- `reddid-web/package.json` — version bumped to `0.4.21`

---

## [0.4.20] — 2026-05-26 — Sprint 1: Security & Integrity

### Added

**S1-01 — editToken expiry (30 days)**
- `src/lib/store/json-file-store.ts` — `TOKEN_EXPIRY_MS` constant (30 × 24 × 60 × 60 × 1000 ms); `checkEditToken()` private helper validates token match AND age; throws `TOKEN_EXPIRED` if older than 30 days
- All mutation methods (`updateIdentity`, `createVerificationChallenge`, `confirmSocialProof`, `createAgent`, `addWallet`, `removeWallet`, `setPrimaryWallet`) now call `checkEditToken()` — consistent expiry enforcement across the store
- V1 grace rule: identities without `editTokenCreatedAt` are treated as never-expired until they next reissue
- `reissueToken(handle, editToken)` — accepts expired tokens (that's the whole point), still rejects wrong tokens; issues fresh 16-char hex token; returns `{ editToken, expiresAt }`
- `src/lib/store/interface.ts` — `reissueToken()` added to DataStore contract
- `src/lib/db.ts` — `reissueToken` shim export
- `src/app/api/identities/[handle]/token/route.ts` — `POST /api/identities/[handle]/token` endpoint; accepts JSON `{ editToken }`, returns `{ editToken, expiresAt, message }`
- All API routes that call store mutation methods now map `TOKEN_EXPIRED` → HTTP 401 with descriptive message pointing to reissue endpoint

**S1-02 — Account deletion (`DELETE /api/identities/[handle]`)**
- `src/lib/store/json-file-store.ts` — `deleteIdentity(handle, editToken)` hard-deletes the identity after `checkEditToken()`; writes a `RevocationEvent` to `db.revocationEvents` (private visibility) before splicing the record — audit trail preserved
- `src/lib/store/interface.ts` — `deleteIdentity()` added to DataStore contract
- `src/lib/db.ts` — `deleteIdentity` shim export
- `src/app/api/identities/[handle]/route.ts` — `DELETE` handler added; requires `{ editToken, confirm: "delete @handle" }` in JSON body to prevent accidental deletion; returns 422 with exact confirmation string required if check fails

**S1-03 — Data export (`POST /api/identities/[handle]/export`)**
- `src/lib/store/json-file-store.ts` — `exportIdentity(handle, editToken)` returns a full copy of the identity record; `revocationKey` hash omitted (internal security data, not personal data); all other fields including `editToken` and `verificationChallenges` included
- `src/lib/store/interface.ts` — `exportIdentity()` added to DataStore contract
- `src/lib/db.ts` — `exportIdentity` shim export
- `src/app/api/identities/[handle]/export/route.ts` — `POST /api/identities/[handle]/export`; uses POST so editToken stays in the request body (query params appear in server logs); returns `{ exportedAt, format: "reddid-identity-v2", identity }`

**S1-05 — Input sanitization**
- `src/lib/store/json-file-store.ts` — `sanitizeText(input)` private helper strips HTML tags (`<[^>]*>`) and collapses whitespace; applied to `displayName`, `bio`, `username` (social proof) in `createIdentity()`, `updateIdentity()`, `confirmSocialProof()` — prevents stored XSS

**S1-06 — Handle recovery via revocationKey**
- `src/lib/store/json-file-store.ts`:
  - `REVOCATION_KEY_BYTES = 32` constant (64-char hex plaintext; 256 bits of entropy)
  - `hashRevocationKey(plaintext)` — SHA-256 hash; hash stored in `identity.revocationKey`; plaintext never persisted
  - `createIdentity()` now generates a real revocationKey at registration time; stores hash in `identity.revocationKey`; returns `{ identity, revocationKeyPlaintext }` (signature change from `Identity` → `{ identity: Identity; revocationKeyPlaintext: string }`)
  - `recoverByRevocationKey(handle, revocationKey)` — hashes the provided plaintext, compares to stored hash; on match, issues fresh editToken; revocationKey is NOT rotated (single recovery credential, reusable)
- `src/lib/store/interface.ts` — `createIdentity()` return type updated; `recoverByRevocationKey()` added
- `src/lib/db.ts` — `createIdentity` and `recoverByRevocationKey` shim exports updated
- `src/app/api/identities/route.ts` — registration POST returns `{ ..., revocationKey: revocationKeyPlaintext }` alongside `editToken`; both shown once
- `src/app/api/identities/[handle]/recover/route.ts` — `POST /api/identities/[handle]/recover`; rate-limited (5/IP/hour); accepts `{ revocationKey }`; returns `{ editToken, expiresAt, message }`; maps `NO_RECOVERY_KEY` → 422 with explanation for pre-Sprint-1 accounts
- `src/lib/rate-limit.ts` — `recover` rate limit added: 5 attempts/IP/hour
- `src/app/register/page.tsx` — **Recovery key interstitial screen** added: after successful registration, user sees an amber-bordered screen showing the 64-char recovery key with a copy button, a checkbox confirmation ("I have saved my recovery key"), and a "Got it — take me to my tip page →" button (disabled until checkbox checked); redirect to `/${handle}?new=1` only fires after confirmation; recovery key is never placed in a URL parameter

**S1-02 (infra) — Atomic writes**
- `src/lib/store/json-file-store.ts` — `writeDb()` changed from `writeFileSync(DB_PATH, ...)` to `writeFileSync(DB_PATH + '.tmp', ...)` followed by `renameSync(tmp, DB_PATH)`; on POSIX, `rename()` is atomic at the OS level; on Windows, replaces destination; prevents `db.json` corruption if the process is killed mid-write (resolves VALIDATION_LOG db-001)

### Changed
- `src/lib/store/interface.ts` — `createIdentity()` return type changed from `Identity` to `{ identity: Identity; revocationKeyPlaintext: string }`; all implementors and callers updated
- `src/app/api/identities/[handle]/route.ts` — PUT and DELETE both map `TOKEN_EXPIRED` to HTTP 401 with endpoint hint; DELETE requires explicit confirmation string
- `reddid-web/package.json` — version bumped to `0.4.20`

### Removed
- `[Unreleased]` item "`DELETE /api/identities/[handle]` self-service account deletion — v0.5" — shipped in Sprint 1 (v0.4.20)

---

## [0.4.19] — 2026-05-26

### Changed
- **`src/app/reserve/page.tsx`** — grey "Not Live" banner upgraded to prominent amber "⚠ DEMO DATA — Reserve Not Live" panel with explicit "No funds are held. No bridge exists yet." wording; above-fold visibility confirmed (Sprint 0 / ISSUE-005)
- **`src/app/staking/page.tsx`** — "Estimate Only" blue banner replaced with amber "⚠ Educational estimate only — not financial advice" panel including PoSV variance warning and "consult a qualified financial adviser" language (Sprint 0 / ISSUE-013)
- **`src/components/TrustBadge.tsx`** — `challenge-post-verified` tooltip reworded from "Verified via a public challenge post on the linked platform" to full trust-based disclaimer: proof URL is stored on record but not independently fetched in v0.4; platform API verification in v0.5 (Sprint 0 / ISSUE-006 partial)
- **`docs/VALIDATION_LOG.md`** — Sprint 0 UX Walkthrough section added; 19/19 checkpoints passed; all findings documented with pass/fail; 3 fixes applied

### Sprint 0 Walkthrough Results (2026-05-26)
All 19 server-side API and SSR checkpoints passed:
- Handle registration, duplicate rejection, tip page, challenge/confirm flow, social proof display all functional
- publicIdentity() correctly strips editToken and verificationChallenges from all public endpoints
- Reserve/bridge/staking pages carry honest disclaimers visible above fold
- Not-found page has proper navigation (Register this handle / Browse creators / Search directory)
- OG image API returns HTTP 200 image/png
- Rate limiting working (3 registrations/IP/hour, 429 with Retry-After header)

---

## [0.4.18] — 2026-05-26

### Added
- **`docs/CURRENT_STATE_AUDIT.md`** — comprehensive feature classification: Real / Partial / Mock / Planned / Stale for every system feature; 9 categories; reconciliation issues table; scorecard (64 real, 7 partial, 4 mock, 15 planned)
- **`docs/VALIDATION_LOG.md`** — evidence gate with actual build command results: tsc PASS, ESLint PASS, Next.js build PASS (✓ 8.6s, 25 static pages); love-button build:chrome PASS (2.10.0.zip); lint warnings documented with assessment
- **`docs/UX_TEST_PLAN.md`** — 15 numbered test scenarios (T-01 through T-15) + Jay's First UX Walkthrough (15-item checklist for founder-level QA pass)
- **`docs/SPRINT_PLAN.md`** — full Sprint 0–6 plan: goals, user value, tasks table, acceptance criteria, risks, must-not-break, gamification rules applied, dependency map; "Not Building" section with explicit rejections
- **`docs/GITHUB_ISSUES_NEXT.md`** — 18 structured issue drafts: problem, solution, acceptance criteria, test steps, labels, priority, sprint; covers P0 security issues through P4 future items

### Changed
- **`love-button/package.json`** — version bumped from "2.5.0" to "2.10.0" (was critically mismatched with manifest.json; now in sync)
- **`reddid-web/package.json`** — version bumped from "0.1.0" to "0.4.18" (was never updated despite v0.4 work)
- **`src/app/register/page.tsx`** — footer version string corrected: "v0.1 beta · … ships in v0.2" → "v0.4 beta · … ships in v0.5" (stale version reference removed)

### Fixed
- **Documentation reconciliation**: love-button version mismatch (2.5.0 vs 2.10.0) — fixed; reddid-web version (0.1.0) — fixed; register page version string — fixed
- **Bio char limit confirmed as 160** across form (maxLength=160), store (truncate to 160), and UX test plan; STRATEGY.md reference to 280 corrected

---

## [0.4.17] — 2026-05-26

### Added
- **`docs/STRATEGY.md`** — full cross-functional team review: Senior Architect, UX, Virality, Gamification, Performance, Security, Community findings; priority matrix; 5-sprint plan (A: Production Foundation → B: Trust/Gamification → C: Viral Growth → D: Security/Store → E: Analytics/Verification); risk register; key metrics targets
- **`docs/ROADMAP.md`** — new "Sprint Plan — Active" section with Sprint A–E task lists; E7 marked ✅ (love-button v2.10); E8/E9/E10 extension items added; last-updated bumped to v0.4.17

---

## [0.4.16] — 2026-05-25

### Changed
- **`docs/ROADMAP.md`** — E6 entry updated: "all 13 content scripts" replacing "7 util-based"; v0.4.16 version history entry added; last-updated bumped
- **love-button v2.9** — `tipUrlTarget` setting now applies to the remaining 6 standalone content scripts: Twitter/X, Reddit, YouTube, Twitch, Instagram, TikTok; `injectTipButton()` in each accepts `tipTarget` as third param; `checkPage()` fetches storage and GET_API_BASE in parallel with `Promise.all()`; options hint text updated to reflect full coverage; Firefox copies mirrored

---

## [0.4.15] — 2026-05-25

### Changed
- **`docs/ROADMAP.md`** — E4 (embed badge) and E6 (configurable tip URL) marked ✅ done; love-button v2.7 and v2.8 added to version history; last-updated bumped to v0.4.15

---

## [0.4.14] — 2026-05-25

### Changed
- **`edit/[handle]/page.tsx`** — Wallet management section added between profile form and social accounts: shows all linked wallets with chain label, address, primary badge, and label; "Set primary" button on non-primary wallets (PATCH `/api/identities/[handle]/wallets/[id]`); remove button per wallet (DELETE); add-wallet form with address input, optional label, and auto-primary assignment for the first RDD wallet; inline success/error feedback with live identity refresh after each operation; profile completion chip hint updated from "Add a wallet via the API or next register" to "Add a wallet in the Wallets section below"

### Added
- `CreditCard`, `Trash2` Lucide icons imported in edit page for wallet management UI
- `WalletPublic.id`, `WalletPublic.label`, `WalletPublic.revokedAt` fields added to the edit-page local interface (aligns with the `WalletLink` shape returned by `publicIdentity()`)
- `handleAddWallet`, `handleSetPrimary`, `handleRemoveWallet`, `refreshIdentity` async handlers in the edit page

---

## [0.4.13] — 2026-05-25

### Added
- **`ARCHITECTURE.md`** — comprehensive system design document: design principles, annotated directory layout, data model overview (Identity v1/v2, WalletLink, SocialProof, AgentIdentity, PaymentIntent, PublicIdentity), DataStore layer (interface, JsonFileDataStore, SQLite upgrade path), full Provider/Adapter table (12 providers, mock vs future real), API route reference table, page route table, Client vs Server component patterns (Suspense wrapper, client-button extraction), environment variable reference, deployment guide (dev + Railway), and future integration points (Gajumaru rail, platform API verification, wallet signature verification, SQLite)

### Changed
- **`docs/ROADMAP.md`** — stale items corrected: user guide page, README, SECURITY.md, CONTRIBUTING.md all marked ✅; E1/E2/E3 marked ✅ (love-button v2.6); ARCHITECTURE.md marked ✅; version history extended through v0.4.13; last-updated bumped to v0.4.12

---

## [0.4.12] — 2026-05-25

### Added
- **`public/icon-192.png`** and **`public/icon-512.png`** — PWA icons generated from `public/brand/ReddCoin-Pinwheel-CLR-256.svg` using `sharp`; fulfils the PNG icon entries already declared in `manifest.webmanifest`
- **`scripts/generate-icons.js`** — Node.js build script (`sharp`) that converts the brand SVG pinwheel to 192×192 and 512×512 PNG; run with `node scripts/generate-icons.js` to regenerate if the source SVG changes
- **`sharp` devDependency** — added to `package.json` for icon generation

---

## [0.4.11] — 2026-05-25

### Added
- **`src/lib/config.ts`** (D3) — centralised environment-variable config: `DB_PATH` (`REDDID_DB_PATH`), `BLOCKBOOK_URL` (`REDDID_BLOCKBOOK_URL`), `BASE_URL` (`NEXT_PUBLIC_REDDID_BASE_URL`); all have production-safe defaults so no env vars are required for local dev
- **`.env.example`** (D3) — documents all supported env vars with defaults and deployment notes for Railway persistent-volume setup

### Changed
- **`store/json-file-store.ts`**, **`migrate.ts`**, **`providers/mock/mock-revocation-registry.ts`** — removed hardcoded `path.join(process.cwd(), 'data', 'db.json')`; now import `DB_PATH` from `@/lib/config`
- **`components/LiveBalance.tsx`** — Blockbook URL now reads `process.env.NEXT_PUBLIC_REDDID_BLOCKBOOK_URL` with `blockbook.reddcoin.com` fallback (client-safe `NEXT_PUBLIC_` prefix required for browser access)
- **`app/sitemap.ts`** — `BASE_URL` constant replaced by import from `@/lib/config`; sitemap will reflect `NEXT_PUBLIC_REDDID_BASE_URL` if set

---

## [0.4.10] — 2026-05-25

### Added
- **`SECURITY.md`** (D5) — responsible disclosure policy: email contact, in-scope vulnerability table (auth bypass, injection, info disclosure, SSRF, address manipulation, rate-limit bypass, challenge replay), out-of-scope list, key system constraints (no private keys, editToken auth model, flat-JSON concurrency caveat), no-bounty notice, maintainer contact
- **`CONTRIBUTING.md`** (D6) — contributor guide: dev setup, environment variables, code style rules (TypeScript, `'use client'` hygiene, Lucide icons, font convention, ESLint zero-warnings), **changelog requirement** (every PR touching `src/`/`public/` must add a CHANGELOG entry), step-by-step platform-addition guide referencing `platforms.ts` + content-script + PLUGINS.md, PR workflow, commit prefix convention

---

## [0.4.9] — 2026-05-25

### Changed
- **`explore/page.tsx`** (U18) — Load-more pagination added; default page size 20; "Load more · N remaining" button appears below the grid when there are more results; clicking appends the next 20; `displayLimit` resets to 20 whenever filters or sort change; prevents long initial renders as the directory grows; no API changes required (data is already client-side)

---

## [0.4.8] — 2026-05-25

### Changed
- **`edit/[handle]/page.tsx`** (U17) — Profile completion indicator added between the header and the profile form; shows a labelled progress bar (N/7) and 7 step-chips: Handle ✓, RDD address, Display name, Bio, Website, Social link, Verified link; chips turn green and show ✓ when complete, grey ○ when not; bar fills from red to green; all-complete state tints the strip green; chip tooltip (`title`) explains what's needed for each incomplete step; `WalletPublic` interface added to the edit page so address presence can be checked from the API response; indicator updates live as the user types display name / bio / website in the form

---

## [0.4.7] — 2026-05-25

### Added
- **`/search` page — ranked handle search** (U16) — new `src/app/search/page.tsx` (server wrapper) + `src/app/search/SearchClient.tsx` (client); reads initial query from `?q=` URL parameter; 350 ms debounced live search against `/api/search`; results show handle, display name, bio snippet (120 chars), and platform badges colour-coded by verification status (green = verified ✓); "no results" state offers a register link pre-filled with the typed handle; URL updated via `router.replace` on each keystroke (no history pollution); wrapped in `<Suspense>` boundary per Next.js App Router requirement for `useSearchParams`
- **`/card/[handle]/CardClientButtons.tsx`** (U20) — extracted all client-side card actions into a dedicated `'use client'` component; receives `handle`, `addr`, `pageUrl`, `bip21` as props from the server page; renders print button (`window.print()`), new "Save QR as PNG" download button (same XMLSerializer → Canvas 512×512 approach as U12, filename `reddid-{handle}-card-qr.png`), ShareButton, and CopyButton; hidden `<QRCode>` rendered off-screen for canvas capture

### Changed
- **`page.tsx` (homepage)** (U19) — "Recently registered" horizontal scroll row added above the quick-links section; server-side: fetches all identities, sorts newest-first, takes top 5; each card shows handle (truncated), display name (truncated), and platform icons (up to 5); "View all →" link to `/explore`; hover border highlight via injected CSS class `.recent-handle-card:hover`
- **`card/[handle]/page.tsx`** (U20) — replaced inline `onClick={() => window.print()}` button and `ShareButton`/`CopyButton` with `<CardClientButtons>` client component; fixes invalid event-handler-in-server-component bug; removed unused `ShareButton` and `CopyButton` direct imports from the server page
- **`not-found.tsx`** — "Search the ReddID directory" link now points to `/search` instead of `/explore`
- **`components/QuickLookup.tsx`** — submit handler falls back to `/search?q=` for multi-word queries; single-word queries continue to navigate directly to `/{handle}`

---

## [0.4.6] — 2026-05-26

### Changed
- **`edit/[handle]/page.tsx`** (U11) — Social Accounts section added below the profile form: lists all current social proofs with platform icon/name, username, and verification status badge (Verified ✓ / Self-reported / Failed); each unverified proof has a "Verify →" link to `/verify?handle={handle}&platform={platform}`; external link to the actual platform profile; "Add another account" link at the bottom; empty-state message links to `/verify`; status badge colours match trust level (green verified, dim pending, red failed)
- **`pay/[handle]/PayClient.tsx`** (U12) — "Save QR as PNG" button added below the QR code; uses `XMLSerializer` to serialise the SVG, renders to an offscreen 512×512 canvas with white background, and triggers a `<a download="reddid-{handle}-qr.png">` click; no external dependencies; `Download` icon from lucide-react

---

## [0.4.5] — 2026-05-26

### Added
- **CI: upgraded to Node.js 24** (`.github/workflows/ci.yml`) — Node.js 20 actions are deprecated; GitHub will force Node 24 on runners from June 2nd 2026; updated both `build` and `lint` jobs
- **`/guide` page** (U10) — 5-step getting-started guide: (1) register handle, (2) verify social accounts, (3) share your tip page, (4) install Love Button extension, (5) maintain profile; includes 5-item FAQ; three CTAs at bottom (Register, Browse, reddcoin.com); linked from NavBar (Guide, HelpCircle icon) and layout footer
- **`src/components/QuickLookup.tsx`** (U9) — NavBar quick-lookup input; `@handle` search field (140→180px animated width on focus); Enter/submit navigates to `/@handle` (strips leading `@`, lowercases); displayed on desktop only via `hidden-mobile` class; uses `useRouter` for client-side nav

### Changed
- **NavBar** (U9) — `QuickLookup` added to the right of the desktop nav links; `Guide` link added to `NAV_LINKS` with `HelpCircle` icon
- **`layout.tsx` footer** — Guide link added before Architecture
- **`[handle]/page.tsx`** (U14) — "Copy URL" (`CopyButton text={pageUrl}`) added to card footer alongside ShareButton — one-click copy of the tip page URL
- **`[handle]/page.tsx`** (U15) — Verify CTA strip added above card footer; shown when no social proofs are independently verified (`verificationStatus !== 'verified'`); contextual message ("link your social accounts" if none / "verify them for ✓ badge" if self-reported); links to `/verify?handle={handle}`
- **`explore/page.tsx`** (U13) — loading spinner replaced with 6-card animated skeleton grid matching real card layout (handle, name, 2 bio lines, platform badges, date); staggered pulse animation (0.1s delay per card)
- **`globals.css`** — added `@keyframes pulse` for skeleton cards

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
