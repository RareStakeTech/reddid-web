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

## Sprint 1 — Private Beta Polish
**Goal:** The product is visually and functionally excellent for 10–50 ReddHead early testers.
**User value:** "I registered, linked my socials, and shared my tip page — and it felt great"
**Duration:** ~2 weeks

### Tasks

| ID | Task | File(s) | Acceptance Criteria |
|----|------|---------|---------------------|
| S1-01 | editToken expiry (30-day) | src/lib/store/json-file-store.ts, types.ts | Expired tokens return 401; auto-refresh flow for valid tokens |
| S1-02 | Account deletion endpoint (DELETE /api/identities/[handle]) | api/identities/[handle]/route.ts | Handle + all data removed; editToken required |
| S1-03 | Data export endpoint (GET /api/identities/[handle]/export) | New route | Returns JSON dump of all user data; editToken required |
| S1-04 | Persistent rate limiting (file-backed or memory with TTL) | src/lib/rateLimit.ts | Rate limits survive server restart; per-IP + per-handle |
| S1-05 | Input sanitization hardening | All API routes | DOMPurify or strip-tags on bio, displayName, website before storage |
| S1-06 | Handle recovery flow (email or signed challenge) | New page + API | User can prove handle ownership without editToken |
| S1-07 | /pay/[handle] page — full polish | src/app/pay/[handle]/ | Clean focused payment UX; QR prominent |
| S1-08 | Better 404 page for /[handle] not found | src/app/not-found.tsx | Suggests /register; links to /explore |
| S1-09 | Add "verified via challenge-post" tooltip on tip page badges | TrustBadge component | Tooltip explains what trust level means in plain English |
| S1-10 | Tip card (/card/[handle]) social share optimisation | src/app/card/[handle]/ | WhatsApp / Twitter share buttons; better OG meta |

**Risks:**
- editToken expiry could break existing tokens — migration required
- Rate limiting implementation needs to not cause false-positive blocks

**Must-not-break:**
- Registration flow (T-01, T-02)
- Social proof challenge flow (T-04)
- Love Button popup lookup
- tsc, lint, build all pass

---

## Sprint 2 — Creator Onboarding & Shareability
**Goal:** A creator discovers ReddID, registers, and shares their link within 5 minutes. A tipper finds the creator and can copy a payment URI in one click.
**User value:** "I found a creator I follow, tipped them, and told my friends"
**Duration:** ~2 weeks

### Tasks

| ID | Task | File(s) | Acceptance Criteria |
|----|------|---------|---------------------|
| S2-01 | One-click share card generator (tip card) | /card/[handle] | Card has "Share on X/Bluesky" pre-filled text with handle + redd.love link |
| S2-02 | Markdown embed badge (E9) | New snippet page or API | Returns `[![Tip me Ɍ RDD](badge.svg)](redd.love/@handle)` copyable |
| S2-03 | Platform registration page (/platforms) — polish | src/app/platforms/ | Shows all 13 live + 4 planned platforms; extension download link |
| S2-04 | Registration success email (optional/deferred) | (no backend email yet) | At minimum: show recovery instructions on success page |
| S2-05 | Animated creator onboarding — post-registration flow | After /?new=1 | Step-by-step: "Your tip page ✓ → Link socials → Share link" guide |
| S2-06 | Leaderboard / "popular creators" explore view | /explore | Sort by social proof count; no fake metric |
| S2-07 | Platform deep-link from Love Button popup | popup.js | "View on Twitter" link next to detected handle in popup |
| S2-08 | Love Button v2.11 — E10 RDD address detection | content scripts | Scan page for R[A-Za-z0-9]{33} / rdd1[a-z0-9]{39}; context menu "Look up on ReddID" |
| S2-09 | ISR on tip pages (revalidate=60) | src/app/[handle]/page.tsx | Remove force-dynamic; add revalidate=60; verify cache invalidation on edit |
| S2-10 | /sitemap.xml includes all registered handles | src/app/sitemap.ts | All registered handles in sitemap; verify in browser |

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

## Sprint 3 — Trust & Verification
**Goal:** "Verified" in v0.4 is trust-based. Sprint 3 makes it real — or at minimum honest about its limits with a clear path to v0.5.
**User value:** "I know this creator's social accounts are linked to their wallet in a way I can trust"
**Duration:** ~3 weeks

### Tasks

| ID | Task | File(s) | Acceptance Criteria |
|----|------|---------|---------------------|
| S3-01 | Fetch and confirm challenge post (server-side URL check) | api/verify/confirm/route.ts | Server actually fetches proofUrl and searches for challenge code in the response |
| S3-02 | Platform-specific scrapers / API calls for verification | New lib/verifiers/*.ts | At minimum: GitHub (public profile), Reddit (JSON API), Twitter (rate-limited) |
| S3-03 | Distinguish trust-based vs. fetched-verified in UI | TrustBadge, popup.js | 'challenge-post-verified' stays; add 'url-fetch-verified' trust level |
| S3-04 | Revoke social proof | api/verify/[handle]/revoke | User can remove a linked account; badge disappears immediately |
| S3-05 | Re-verify expired proofs | Verify page | Show "re-verify" option if proofUrl returns 404 |
| S3-06 | Wallet signature verification (v0.5 foundation) | lib/walletSig.ts | reddcoinjs-lib sign/verify flow; store signature with wallet link |
| S3-07 | Abuse reporting pipeline | api/report + admin view | Reports stored; admin review queue accessible to Jay |
| S3-08 | Privacy-preserving proof storage | json-file-store.ts | proofUrl stored but not exposed in publicIdentity() |
| S3-09 | Trust level badge tooltips — all levels explained | TrustBadge | Each level has a plain-English tooltip users can understand |

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
**Duration:** ~3 weeks

### Tasks

| ID | Task | File(s) | Acceptance Criteria |
|----|------|---------|---------------------|
| S4-01 | SQLite data store (better-sqlite3) | src/lib/store/sqlite-store.ts | Passes all DataStore interface methods; atomic writes; indexed queries |
| S4-02 | Migration script (data/db.json → SQLite) | scripts/migrate-to-sqlite.ts | All existing identities preserved; checksums verified |
| S4-03 | Atomic writes + WAL mode | sqlite-store.ts | No corruption under concurrent requests |
| S4-04 | Railway deployment | railway.toml or Dockerfile | Live at redd.love; zero-downtime deploys |
| S4-05 | Environment variable management | .env.local + Railway | No secrets in code; all via env |
| S4-06 | Rate limiting via Redis or Upstash | src/lib/rateLimit.ts | Persists across restarts; per-IP and per-handle |
| S4-07 | HTTPS enforcement | Next.js config | Redirect all HTTP → HTTPS |
| S4-08 | Security headers (CSP, HSTS, X-Frame-Options) | next.config.ts | Passes securityheaders.com check |
| S4-09 | CI pipeline (GitHub Actions) | .github/workflows/ci.yml | On every push: tsc, lint, build — must all pass |
| S4-10 | Automated test suite (basic) | tests/ | At minimum: API integration tests for register, lookup, verify |
| S4-11 | Chrome Web Store submission | love-button/store/ | Screenshots, description, privacy policy URL, submission complete |
| S4-12 | editToken rotation endpoint | api/identities/[handle]/token | Allows re-issuing a new token if old one is compromised |

**Risks:**
- SQLite migration is the highest-risk operation — must have backup of data/db.json before running
- Railway deployment requires environment variable setup and review

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
| S5-08 | Firefox AMO submission | love-button-firefox/ | Extension live on addons.mozilla.org |
| S5-09 | Community page (/community) | New page | Links to ReddCoin Discord, Reddit, GitHub; "How to become a ReddHead" |

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
