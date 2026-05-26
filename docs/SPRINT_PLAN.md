# ReddID Sprint Plan
**Version:** v0.4 | **Date:** 2026-05-26
**Principle:** No castles on fog. Each sprint leaves the product more real, more honest, and more testable than it started.
**Team:** Jay TechAdept (product + eng), Claude Code (implementation partner)

---

## Sprint 0 — Truth, Testing & Documentation
**Goal:** Close all known gaps between what we claim and what we ship. No new features.
**User value:** "I can trust the docs and test the product myself"
**Duration:** ~1 week

### Tasks

| ID | Task | File(s) | Acceptance Criteria |
|----|------|---------|---------------------|
| S0-01 | Bump reddid-web/package.json to 0.4.17 | package.json | `"version": "0.4.17"` |
| S0-02 | Fix bio char limit in all docs (160, not 280) | docs/STRATEGY.md, any other mention | No doc says 280 |
| S0-03 | Add "DEMO DATA" banner to /reserve page | src/app/reserve/page.tsx | Visible yellow banner; isLive: false explicit |
| S0-04 | Add "NOT LIVE" banner to /bridge page | src/app/bridge/page.tsx | Visible banner with ReddRail status explanation |
| S0-05 | Add "Draft only — no transaction sent" to payment intent UI (if any) | Any UI surface that calls /api/payments | User never thinks payments are real |
| S0-06 | Run Jay's First UX Walkthrough (UX_TEST_PLAN.md) | manual | All 15 checklist items completed, issues filed |
| S0-07 | Run VALIDATION_LOG commands, update log | docs/VALIDATION_LOG.md | New dated section added; all pass |
| S0-08 | Review love-button innerHTML warnings (7 × UNSAFE_VAR_ASSIGNMENT) | love-button/popup.js | Assessed as false positive or mitigated |
| S0-09 | Verify MISSING_DATA_COLLECTION_PERMISSIONS notice filed in roadmap | docs/ROADMAP.md | Sprint D item added |
| S0-10 | Add data_collection_permissions note to love-button README | love-button/README.md | Mentioned in known issues |

**Risks:** None — this is pure truth-telling work.
**Must-not-break:** All 15 build checks in VALIDATION_LOG.md must still pass.

---

## Sprint 1 — Security & Integrity ✅ COMPLETE (2026-05-26)
**Goal:** Close the P0/P1 security gaps identified in Sprint 0. No user-facing feature regressions.
**User value:** "My handle is protected — tokens expire, I can recover access, and I can delete my account"
**Duration:** 1 session (2026-05-26)

### Tasks

| ID | Task | File(s) | Status | Notes |
|----|------|---------|--------|-------|
| S1-01 | editToken expiry (30-day) | json-file-store.ts, interface.ts, db.ts, [handle]/token/route.ts | ✅ DONE | `checkEditToken()` added to all mutations; `reissueToken()` + POST endpoint; v1 grace rule |
| S1-02 | Account deletion (DELETE /api/identities/[handle]) | json-file-store.ts, interface.ts, db.ts, [handle]/route.ts | ✅ DONE | Hard delete + RevocationEvent audit trail; requires `confirm: "delete @handle"` |
| S1-03 | Data export (POST /api/identities/[handle]/export) | json-file-store.ts, interface.ts, db.ts, [handle]/export/route.ts | ✅ DONE | Full identity dump minus revocationKey hash; editToken required; POST avoids log exposure |
| S1-04 | Persistent rate limiting | — | ⏳ DEFERRED Sprint 3 | In-memory is acceptable for MVP; deferred to Redis/Upstash integration |
| S1-05 | Input sanitization | json-file-store.ts | ✅ DONE | `sanitizeText()` strips HTML tags; applied to displayName, bio, socialProof username |
| S1-06 | Handle recovery via revocationKey | json-file-store.ts, interface.ts, db.ts, [handle]/recover/route.ts, register/page.tsx | ✅ DONE | 64-char hex key; SHA-256 hash stored; plaintext shown once in amber interstitial |
| S1-06a | Atomic writes | json-file-store.ts | ✅ DONE | `writeDb()` now tmp → rename pattern; resolves VALIDATION_LOG db-001 |
| S1-07 | /pay/[handle] page — full polish | src/app/pay/[handle]/ | ⏳ Sprint 2 | Moved to Sprint 2 polish sprint |
| S1-08 | Better 404 page | src/app/not-found.tsx | ✅ DONE (Sprint 0) | Already confirmed passing in Sprint 0 walkthrough |
| S1-09 | TrustBadge tooltip | TrustBadge.tsx | ✅ DONE (Sprint 0) | Fixed inline during walkthrough |
| S1-10 | Tip card social share | src/app/card/[handle]/ | ⏳ Sprint 2 | Moved to Sprint 2 polish sprint |

### Sprint 1 Build Results (2026-05-26)
- `tsc --noEmit` → exit 0, zero type errors ✅
- `npm run lint` → exit 0, zero warnings ✅
- `npm run build` → exit 0, 39 routes compiled successfully ✅
  - New routes: `/api/identities/[handle]/export`, `/api/identities/[handle]/recover`, `/api/identities/[handle]/token`

**Risks resolved:**
- ✅ editToken expiry uses existing `editTokenCreatedAt` field — no schema migration required
- ✅ v1 identities (no `editTokenCreatedAt`) get grace period — no existing user impact
- ✅ Registration flow T-01/T-02 unaffected (new `revocationKeyPlaintext` in response is additive)

---

## Sprint 2 — Creator Onboarding & Shareability ✅ COMPLETE (2026-05-26)
**Goal:** A creator discovers ReddID, registers, and shares their link within 5 minutes. A tipper finds the creator and can copy a payment URI in one click.
**User value:** "I found a creator I follow, tipped them, and told my friends"
**Duration:** ~2 weeks

### Tasks

| ID | Task | File(s) | Status | Notes |
|----|------|---------|--------|-------|
| S2-01 | One-click share card generator (tip card) | /card/[handle]/CardClientButtons.tsx | ✅ DONE | "Share on 𝕏" intent URL + "WhatsApp" deep link with pre-filled text |
| S2-02 | Markdown embed badge (E9) | api/badge/[handle]/route.ts, tip page | ✅ DONE | SVG badge API + "Copy Markdown" snippet on tip page |
| S2-03 | Platform registration page (/platforms) — polish | src/app/platforms/ | ✅ EXISTS | Page already built; quality sufficient for beta |
| S2-04 | Registration success email (optional/deferred) | — | ⏳ DEFERRED | No backend email until Railway + Resend; recovery key interstitial serves this purpose in v0.4 |
| S2-05 | Creator onboarding post-registration flow | src/app/[handle]/page.tsx | ✅ DONE | 3-step guide: ① Live ✓ ② Verify socials → ③ Share handle |
| S2-06 | "Most verified" explore sort | src/app/explore/page.tsx | ✅ DONE | Third sort option: descending by verified social proof count |
| S2-07 | Platform deep-link from Love Button popup | popup.js | ⏳ Sprint 3 | Requires Love Button update; deferred |
| S2-08 | Love Button v2.11 — E10 RDD address detection | content scripts | ⏳ Sprint 3 | Complex content script change; deferred |
| S2-09 | ISR on tip pages (revalidate=60) | src/app/[handle]/page.tsx | ⏳ DEFERRED Sprint 4 | `searchParams` forces dynamic; even without it, `revalidate` is incompatible with the JSON-file store (no cache invalidation hook). Revisit when SQLite migration lands. |
| S2-10 | /sitemap.xml includes all registered handles | src/app/sitemap.ts | ✅ EXISTS | `src/app/sitemap.ts` already calls `getAllIdentities()` and emits one URL per non-revoked handle |
| S2-11 | TOKEN_EXPIRED inline recovery on edit & verify pages | edit/[handle]/page.tsx, verify/page.tsx | ✅ DONE | When any mutation returns 401 + "expired", an amber panel replaces the raw error; one-click "Reissue token" calls POST `/token`, writes new token to localStorage, clears the expiry state |

### Fixes in Sprint 2
- `src/lib/platforms.ts` — Nostr icon collision fixed (was `⚡` same as Kick; changed to `◆`)

### Sprint 2 Final Build Results (2026-05-26)
- `tsc --noEmit` → exit 0 ✅
- `npm run lint` → exit 0 ✅
- `npm run build` → exit 0 ✅

**Gamification rules applied (S2-06):**
- Sort by social proof count is informational, not scored or ranked publicly as "top"
- No streak counter, no fake points, no prominence purchased
- All display is explainable, reversible, and opt-out

**Risks:**
- ISR cache invalidation on edit must work or tip page shows stale data
- Address detection regex (E10) must not false-positive on similar Bitcoin addresses

**Must-not-break:**
- All Sprint 1 acceptance criteria
- Love Button extension still loads and injects correctly

---

## Sprint 3 — Trust & Verification ✅ COMPLETE (2026-05-26)
**Goal:** "Verified" in v0.4 is trust-based. Sprint 3 makes it real — or at minimum honest about its limits with a clear path to v0.5.
**User value:** "I know this creator's social accounts are linked to their wallet in a way I can trust"
**Duration:** ~3 weeks

### Tasks

| ID | Task | File(s) | Status | Notes |
|----|------|---------|--------|-------|
| S3-01 | Fetch and confirm challenge post (server-side URL check) | api/verify/confirm/route.ts, lib/proof-fetcher.ts | ✅ DONE | `fetchProofUrl()` fetches URL (5s timeout, 512KB cap); 422 CODE_NOT_FOUND / 503 FETCH_FAILED on failure; upgrades to 'url-fetch-verified' proofMethod on success |
| S3-02 | Platform-specific scrapers / API calls for verification | lib/proof-fetcher.ts | ✅ PARTIAL | Generic URL fetch covers GitHub, Reddit, Mastodon, Bluesky (public HTML); Twitter/X and Instagram require auth headers — deferred to Sprint 4 with platform-specific verifier modules |
| S3-03 | Distinguish trust-based vs. fetched-verified in UI | TrustBadge, edit page, tip page | ✅ DONE | 'url-fetch-verified' added to ProofMethod + TrustLevel; green "URL Verified" badge; tip page mapping updated; edit page StatusBadge updated |
| S3-04 | Revoke social proof | api/identities/[handle]/socials/[platform]/route.ts, edit page | ✅ DONE | `removeSocialProof()` sets verificationStatus='revoked'; hidden from publicIdentity(); Trash button in edit page with confirm dialog |
| S3-05 | Re-verify expired proofs | Verify page, edit page | ✅ DONE | StatusBadge shows "Challenge Expired" (orange); "Verify →" changes to "Re-verify →" for expired/failed proofs; link passes `?username=` to pre-fill verify form |
| S3-06 | Wallet signature verification (v0.5 foundation) | lib/walletSig.ts | ⏳ Sprint 4 | Deferred — reddcoinjs-lib integration |
| S3-07 | Abuse reporting pipeline | api/admin/reports, admin/reports page | ✅ DONE | Reports persisted to db.json abuseReports[]; GET/POST /api/admin/reports (Bearer token auth); /admin/reports?secret=<ADMIN_SECRET> triage queue UI |
| S3-08 | Privacy-preserving proof storage | types.ts, db.ts | ✅ DONE | `PublicSocialProof` type omits proofUrl; `publicIdentity()` strips it; revoked proofs also filtered |
| S3-09 | Trust level badge tooltips — all levels explained | TrustBadge | ✅ EXISTS | LEVEL_CONFIG already has plain-English tooltip for each level via `title` attribute |

### Sprint 3 Final Build Results (2026-05-26, v0.4.24) ✅ COMPLETE
- `tsc --noEmit` → exit 0 ✅
- `npm run lint` → exit 0 ✅
- `npm run build` → exit 0, 45 routes compiled ✅
  - New routes: `/admin/reports`, `/api/admin/reports`

**Gamification rules applied:**
- 'url-fetch-verified' badge is informational — not a score or rank
- Badge is fully explained on hover
- Badge is revocable by the user at any time
- No "verification points" or pay-to-verify

**Risks:**
- Platform scraping may break if sites change HTML (fragile by nature)
- Twitter verification may require API key; rate-limited

**Must-not-break:**
- Existing challenge-post-verified badges still display
- publicIdentity() still strips private fields

---

## Sprint 4 — Production Readiness
**Goal:** The product can handle real users without corrupting data or leaking tokens. Deploy to Railway.
**User value:** "The site is always up, fast, and safe"
**Duration:** ~3 weeks (realistic: 4 weeks if CWS prep is included)

### Recommended execution order (architect-reviewed 2026-05-26)

**Phase 1 — Foundation (must happen first, in sequence):**
1. S4-05 — Confirm env var coverage (Railway secrets, ADMIN_SECRET, DB_ENGINE key)
2. S4-01 + S4-03 — SQLite store + WAL mode (inseparable; one implementation task)
3. S4-02 — Migration script (run against copy of db.json first; verify row counts)
4. S4-04 — Railway deployment (Checkpoint 1: deploy with JSON store; Checkpoint 2: flip to SQLite)

**Phase 2 — Hardening (can parallelize after Phase 1):**
5. S4-07 + S4-08 — HTTPS + security headers (same session; ~20 lines in next.config.ts)
6. S4-06 — Rate limiting (SQLite-backed preferred over Upstash for single-instance Railway)

**Phase 3 — Quality and submission (last; S4-10 moved to Sprint 5):**
7. S4-11 — Chrome Web Store submission (screenshots + tile are Jay-work; start in parallel)
8. S4-09 — CI cleanup (already live; add test step when Sprint 5 tests land)

### Tasks

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S4-01 | SQLite data store (better-sqlite3) | src/lib/store/sqlite-store.ts | Passes all DataStore interface methods; WAL mode; atomic writes | [ ] |
| S4-02 | Migration script (data/db.json → SQLite) | scripts/migrate-to-sqlite.ts | All existing identities preserved; checksums verified; reversible via REDDID_DB_ENGINE=json | [ ] |
| S4-03 | Atomic writes + WAL mode | sqlite-store.ts | Part of S4-01 — no corruption under concurrent requests | (see S4-01) |
| S4-04 | Railway deployment | railway.toml | Live at redd.love; persistent volume at /app/data; zero-downtime deploys | [ ] |
| S4-05 | Environment variable management | src/lib/config.ts, .env.example | All required vars documented; REDDID_DB_ENGINE, ADMIN_SECRET, DB_PATH confirmed | ✅ DONE v0.4.26 |
| S4-06 | Rate limiting (SQLite-backed) | src/lib/rate-limit.ts | rate_limit_counters table; persists across restarts; per-IP and per-handle | [ ] |
| S4-07 | HTTPS enforcement | next.config.ts | Redirect all HTTP → HTTPS via x-forwarded-proto check | ✅ DONE v0.4.26 |
| S4-08 | Security headers (CSP, HSTS, X-Frame-Options) | next.config.ts | HSTS + CSP + X-Frame-Options + Referrer-Policy + Permissions-Policy applied | ✅ DONE v0.4.26 |
| S4-09 | CI pipeline (GitHub Actions) | .github/workflows/ci.yml | ✅ Already live — tsc, lint, build on every push. Add test step in Sprint 5. | ✅ EXISTS |
| S4-10 | Automated test suite (basic) | tests/ | **MOVED TO SPRINT 5** — see S5-10. Write after SQLite migration stabilises. | → Sprint 5 |
| S4-11 | Chrome Web Store submission | love-button/store/ | Screenshots (S8), 1280×800 tile (S9), CWS account (S13), submission complete | [ ] |
| ~~S4-12~~ | ~~editToken rotation endpoint~~ | ~~—~~ | **REMOVED — duplicate of Sprint 1 S1-01.** POST /api/identities/[handle]/token is live. | ✅ DONE (S1-01) |

### migrate.ts atomic write fix (2026-05-26)
`runMigrations()` previously called `fs.writeFileSync()` directly, bypassing the tmp→rename protection.
Fixed: now writes to `DB_PATH + '.migrate.tmp'` then `renameSync` to `DB_PATH` — consistent with `writeDb()`.

### Known traps (architect review)
- **better-sqlite3 native build**: needs build tools on Railway; pin Node version to match CI (Node 24)
- **migrate.ts / SQLite conflict**: when `REDDID_DB_ENGINE=sqlite`, skip `runMigrations()` (JSON-only); SQLite store bootstraps its own schema in the constructor
- **Railway multi-instance**: SQLite on a shared volume breaks under auto-scaling. Single-instance only in v0.4. Document in ARCHITECTURE.md.
- **CWS review lag**: Chrome Web Store takes 7–14 days post-submission. Start screenshots/tile NOW, in parallel with server work.

**Risks:**
- SQLite migration is the highest-risk operation — checkpoint deploy with JSON store first; keep db.json on volume as fallback
- Railway deployment: persistent volume must be configured before first deploy or db.json is lost on redeploy

**Must-not-break:**
- ALL existing UX test scenarios (T-01 through T-15)
- Love Button extension loads + injects correctly in Chrome and Firefox

---

## Sprint 5 — ReddHead Growth Loops
**Goal:** Existing ReddHeads bring in new ReddHeads. The product is worth telling people about.
**User value:** "I shared my tip page and three friends registered"
**Duration:** ~2 weeks

### Tasks

| ID | Task | File(s) | Acceptance Criteria |
|----|------|---------|---------------------|
| S5-01 | Trust Score popup (E8) | love-button popup | Shows overall identity trust score as count of verified proofs |
| S5-02 | "Register referred by" flow | /register?ref=handle | Referral handle stored; used for future analytics only (no rewards yet) |
| S5-03 | Creator streak display (ethical) | tip page | Shows "Active since [month year]" — not a streak counter; no shame on inactivity |
| S5-04 | Tip confirmation page after BIP21 copy | After copy action | "Open your wallet to complete the tip" — guides the user |
| S5-05 | ReddID badge for creator websites | /badge/[handle] | Returns SVG `Ɍ Accept RDD tips` badge; embeddable |
| S5-06 | Explore trending — by verification completeness | /explore | Sort by "most verified links" — factual, not gamified |
| S5-07 | "Did you tip?" follow-up nudge | (browser-side only) | Love Button popup: "Did you send that tip? Here's the address again" — opt-in |
| S5-08 | Firefox AMO submission | love-button-firefox/ | Extension live on addons.mozilla.org; source zip uploaded (AMO MV3 requirement) |
| S5-09 | Community page (/community) | New page | Links to ReddCoin Discord, Reddit, GitHub; "How to become a ReddHead" |
| S5-10 | Automated test suite (moved from S4-10) | tests/ | vitest + supertest; API integration tests for register, lookup, verify, token; must pass in CI | **Gate item — required before any S5 growth features ship** |
| S5-11 | Wallet signature verification (reddcoinjs-lib) | src/lib/walletSig.ts | ECDSA `verifymessage` via reddcoinjs-lib; `/api/identities/[handle]/wallets/[id]/verify`; feeds trust score | Moved from S3-06; enables real wallet-signature-verified badge |

**Gamification rules applied (S5-01, S5-03, S5-06):**
- Trust score = count of independently verified proofs — a fact, not a gamified score
- "Active since" is purely informational — no penalty for inactivity, no public shame
- "Most verified links" explore sort is factual — not purchased prominence
- All badges are optional, explainable, and privacy-conscious (user can remove proofs)
- No claims that tips equal income — "Ɍ tips" is clearly currency not earnings guarantee
- No fake scarcity, no limited-time offers, no pay-to-rank

---

## Sprint 6 — ReddRail & ReddMobile Prep
**Goal:** Infrastructure in place for ReddRail integration when Gajumaru tooling is ready.
**User value:** "When ReddRail launches, I'll get instant micro-tips without doing anything"
**Duration:** ~3 weeks (gated on Gajumaru timeline)

### Tasks

| ID | Task | File(s) | Acceptance Criteria |
|----|------|---------|---------------------|
| S6-01 | ReddRail integration interface | src/lib/rails/interface.ts | Abstract PaymentRail interface; MockPaymentRail stays for testing |
| S6-02 | ReddRail status endpoint | api/reserve/route.ts | isLive: true when channel is live; shows real reserve |
| S6-03 | Channel open flow (UI) | New /channels page | Creator opens a ReddRail channel; deposits collateral |
| S6-04 | Micro-tip UX on tip page | src/app/[handle]/page.tsx | When ReddRail live: instant tip with amount input |
| S6-05 | ReddMobile deep-link protocol | reddid:// scheme | Tip page generates deep link for ReddMobile wallet app |
| S6-06 | Agent tip execution | api/agents/[handle]/[id]/tip | When PolicyEngine live: agents can tip with enforced limits |
| S6-07 | Agent management UI | New /agents page | Creator sees, creates, and revokes authorized agents |
| S6-08 | Bridge page — real exchange | src/app/bridge/ | When Gajumaru cross-chain bridge live; replace placeholder |

**Hard gate:** Sprint 6 is blocked on Gajumaru Associate Chain tooling being available and documented. Do not start S6-02 through S6-08 until Kaspa contact (from project_gajumaru_state.md) confirms readiness.

---

## Sprint Dependency Map

```
Sprint 0 (Truth)
  └── Sprint 1 (Polish)
        └── Sprint 2 (Shareability) ─┬─ Sprint 5 (Growth Loops)
              └── Sprint 3 (Trust)   │
                    └── Sprint 4 ────┘
                         (Production)
                              └── Sprint 6 (ReddRail)
                                   [GATED on Gajumaru]
```

---

## Not Building (Explicitly Rejected)

| Idea | Why rejected |
|------|-------------|
| Tip leaderboard ("top tippers") | Creates pay-to-win dynamic; privacy violation |
| "Verified Creator" tier (pay to unlock) | Pay-to-win reputation — rejected by gamification rules |
| Tip streaks with penalties | Manipulative; punishes inactivity |
| Fake scarcity ("only 3 handles left in your niche!") | Dishonest |
| RDD price speculation features | Investment language risk; not ReddID's purpose |
| Forced account linking (required for registration) | Privacy violation; social proofs must remain optional |
| Anonymous tips publicly displayed | Privacy risk for tippers |
