# ReddID / ReddRails Product Strategy
## Cross-functional Team Review — 2026-05-26

**Product version at review:** reddid-web v0.4.16 · Love Button v2.10.0

> This document is the output of a full cross-functional review of the ReddID platform.
> It supersedes informal notes and provides a living sprint plan that is updated with each cycle.
> Reviewers (virtual): Senior Architect · UX · Virality · Gamification · Performance · Security · Community.

---

## 1. Where We Are (Honest Assessment)

### What is working well

| Strength | Evidence |
|---|---|
| Core product loop is complete | Register → link social → share tip page → receive RDD — all functional |
| Extension is genuinely useful | 13 platforms, MV3, Firefox/Chrome, popup fully featured |
| Architecture is clean and extensible | DataStore/adapter pattern, platforms.ts registry, config.ts |
| Docs are thorough | ARCHITECTURE.md, PLUGINS.md, SECURITY.md, CONTRIBUTING.md, ROADMAP |
| Visual identity is strong | Brand red, Rubik/Roboto, Ɍ symbol, dark theme — consistent across web + extension |
| /pay page is best-in-class | BIP21 QR + amount picker + deep link — better than most crypto tip products |
| OG images + sitemap + robots | Shareable cards, SEO-discoverable, PWA manifest |
| Profile completion indicator | 7-step progress nudge on edit page |
| Social proof badges (E7) | Clickable platform links, status dots, green tint for proof-linked |

### What is incomplete or risky

| Gap | Impact | Severity |
|---|---|---|
| **JsonFileDataStore** — no atomic writes, O(n) all queries, corruption risk under concurrent writes | Data integrity | 🔴 Critical |
| **No persistent deployment** — db.json is wiped on every Vercel/Railway deploy without volume | All data lost on redeploy | 🔴 Critical |
| **In-memory rate limiting** — resets on server restart, trivially bypassed | Spam/abuse | 🟠 High |
| **editToken has no expiry** — tokens live forever, no rotation | Security | 🟠 High |
| **No input sanitization** — bio/displayName/website fields hit DB raw | XSS/injection | 🟠 High |
| **Social proofs are all self-reported or challenge-based** — no platform API verification | Trust credibility | 🟡 Medium |
| **No analytics at all** — can't see what works or who registers | Growth blindness | 🟡 Medium |
| **Extension not in any store** — users must sideload; no discoverability | Distribution | 🟡 Medium |
| **Homepage hero doesn't explain ReddCoin to newcomers** — assumes crypto knowledge | Conversion | 🟡 Medium |
| **/explore feels like a directory, not a community** — no personality, no curation | Retention | 🟡 Medium |
| **No viral sharing hooks post-registration** — user registers and there's no prompt to tell anyone | Growth | 🟡 Medium |
| **No gamification beyond profile completion** — no achievements, no trust score, no leaderboard | Engagement | 🟡 Medium |

---

## 2. Team Findings

### 🏗️ Senior Architect (infrastructure & maintainability)

**Priority 1: SQLite migration is not optional.** JsonFileDataStore will eventually corrupt under concurrent requests — even at small scale. The DataStore interface is already abstracted; the migration is surgical. SQLite via `better-sqlite3` gives us atomic writes, proper transactions, and indexed queries (handle, socialProofs by platform, wallets by chain).

**Priority 2: Railway + persistent volume** before any public launch announcement. The deployment story must be: push to GitHub → Railway pulls → /app/data persists across deploys.

**Priority 3: Rate limiting must survive restarts.** Move to SQLite-backed counters (use the same DB as identities). Track: registration attempts per IP/day, challenge attempts per handle/hour, editToken attempts per handle/day.

**Architecture concern: editToken is a bearer token stored in the user's browser.** It doesn't expire, it can't be rotated without knowing the current token, and there's no recovery path if lost. For v0.4, this is acceptable — document it clearly. For v0.5, move to signed JWT with 90-day expiry and refresh flow.

**Missing: Server-side input validation layer.** All API routes should run bio/displayName/website through a sanitize function before writing to the database. Implement `sanitizeText(s, maxLen)` in `lib/validation.ts`. bio max 280 chars, displayName max 60 chars, website must be https:// URL.

**Positive:** The platforms.ts + DataStore + adapter pattern is a genuinely good foundation. The adapter interfaces (PaymentRailAdapter, BridgeStatusAdapter, SocialProofAdapter) mean adding new capabilities doesn't require touching existing code. Keep this pattern.

---

### 🎨 UX / Usability (Marcus Webb)

**Homepage:** The hero is well-designed for crypto-native users but loses non-crypto visitors immediately. The phrase "Ɍ RDD tips" means nothing to someone discovering ReddID from a creator's tip page for the first time. Add one sentence: "ReddCoin (RDD) is a digital currency for tipping. Fast, free, and built for the creator economy."

**Register flow:**
- The live handle-check is great — keep it
- The social link step at registration is too long — make it optional ("Add later") with a clear next step
- Post-registration UX gap: after claiming a handle, the user lands on their tip page with a "Congratulations" banner, but there's no clear "what next?" sequence beyond the profile completion chips. Add: (1) Copy your tip page link button in the banner, (2) "Tell your audience" expandable with platform-specific CTA copy

**Verify flow:** The `/verify?handle=X` page is cognitively heavy. The challenge-post-verify sequence requires users to context-switch to another app, do something there, and come back. Break it into three explicit numbered steps with a progress indicator. "Step 1 of 3: Copy your challenge code."

**Explore page:** The creator grid is functional but feels like a table. Platform filter chips are good. Missing: Creator avatars (even placeholder initials avatars) would make it feel human. Missing: Sort by "most recently active" vs "most platforms linked."

**Tip page:** 
- The QR code on mobile (< 420px) is too small — needs `min-width: 200px` media query
- The "Copy tip page URL" button (U14) is present — but it's below the fold on mobile. Move it into the sticky CTA area.
- The Recent Tips widget is excellent — shows life. If there are no tips yet, change the empty state from blank space to "Be the first to tip @handle!"

**Pay page:** This is the strongest page in the product. No major changes — just ensure the "Open in wallet" fallback message is shown when BIP21 deep-link doesn't work (common on desktop).

---

### 🚀 Virality / Growth (Priya Sharma)

**The single biggest viral gap: no post-action sharing prompt.**
- After registration: "Share your new tip page" → one-click copy of redd.love/@handle
- After verification: "Share your verified profile" → Twitter/X card pre-drafted, Bluesky ready
- After first tip received (Blockbook event): "You just received your first RDD tip!" → share prompt

**Embed badge (E4) is the highest-leverage viral feature.** Every creator who embeds a Ɍ Tip button on their own site becomes an organic billboard. Enhance it:
- Option: "Copy HTML badge" (current, ✅)
- Option: "Copy Markdown badge" (for GitHub READMEs) — `[![Tip with Ɍ RDD](badge)](url)`
- Option: "Copy image URL" for platforms that only accept image URLs

**The /card/[handle] page exists but no one knows it does.** Add a "Share Card" option to the tip page that deep-links to /card/. The shareable card is perfect for X, Nostr, and Farcaster posts.

**"Powered by ReddID" attribution on tip pages.** A subtle "Tip service by redd.love" footer link on every tip page creates a passive impression loop for anyone who receives a tip page link. This is a soft viral mechanic, not spam.

**Creator referral tracking.** When a creator shares their tip page and someone registers from it, log the referring handle. Surface this in the creator's profile: "Referred N new ReddHeads." Add a referral leaderboard to /explore.

**"Notify me when @handle registers"** email capture. The /not-found page already suggests claiming the handle — add a "Get notified when @handle is claimed" email form. This creates demand-side pressure and gives you a list of high-intent users to notify.

**The /explore page as a community hub.** Add:
- "Featured Creators" row (manually curated initially, auto by trust score later)
- "New this week" section
- Platform filter that shows creators with a specific platform verified

---

### 🎮 Gamification (Alex Torres)

**Current state:** Profile completion indicator (7 steps, progress bar) is the only gamification element. It's functional but not exciting.

**The opportunity: Trust Score.** Compute a visible score per identity:
- +10 points: Display name set
- +10 points: Bio set  
- +10 points: Website set
- +20 points: RDD wallet linked
- +15 points per social proof (self-reported): up to 3 × 15 = 45
- +25 points per social proof with challenge verification: up to 3 × 25 = 75
- +20 points: 3+ platforms linked bonus
- **Max without verification: 115. Max with full verification: 190.**

Display this on:
- The tip page: "Trust Score: 142/190" with a progress bar and "How this is calculated" tooltip
- The /explore creator cards: small score badge
- The profile completion section of the edit page: replace the current chips with the score

**Achievement badges** (visible on tip pages, awarded automatically):
| Badge | Trigger | Display |
|---|---|---|
| 🏠 Early Adopter | Registered in the first 1000 handles | Gold border chip |
| 🔗 Multi-Social | 3+ platforms linked | Blue chip |
| ⭐ Fully Verified | 5+ platforms with challenge proofs | Purple chip |
| 💎 RDD Holder | Wallet balance > 10,000 Ɍ (Blockbook live check) | Red chip |
| 🌐 Cross-Platform | Linked platforms from 3 different categories | Green chip |

**Leaderboard on /explore:**
- Sort by Trust Score descending (replace current "sort by" options)
- Weekly "Top New Creators" (registered in last 7 days, highest score)
- "Most platforms linked" sort option

**Staking calculator gamification:** Show the user's "staking tier" based on balance (Micro Staker < 10K, Staker 10K–100K, Senior Staker 100K–1M, Whale > 1M). Tie this to a badge on the tip page.

---

### ⚡ Performance / Optimization (Dev Patel)

**The flat JSON database is a performance problem waiting to happen.** A 1000-identity db.json is ~200KB — still fine. At 10,000 identities it becomes 2MB loaded into memory on every request. SQLite migration solves this: indexed queries, lazy loading, no full-file reads.

**ISR (Incremental Static Regeneration) for tip pages.** Currently all pages are `export const dynamic = 'force-dynamic'`. The tip page for `/@handle` only changes when the identity is updated — it can be ISR with a 60-second revalidation. This would reduce DB reads by 99% for popular creators.

**OG image caching.** The `/api/og/[handle]` route regenerates on every request. Cache with `Next-Cache-Control: public, max-age=3600, stale-while-revalidate=86400`. The image doesn't change often.

**Blockbook API calls.** The `RecentTips` component and `LiveBalance` component each make a Blockbook API call on page load. These should be deduplicated (a single call per address per page render) and the result should be cached at the edge with a 30-second TTL.

**Bundle analysis needed.** Run `ANALYZE=true npm run build` (after installing `@next/bundle-analyzer`) to identify large dependencies. Likely candidates: QR code library, lucide-react (tree-shake check), possible duplicates.

**The /api/search route** performs a case-insensitive substring match over all identities in JS. With SQLite, this becomes a `LIKE` query. At current scale it's fine; at 10K identities it will be slow.

**Missing: `<Image>` optimization for any images used.** When avatar upload is added (v0.5+), must use `next/image` with proper `sizes` attribute.

---

### 🔒 Security (Jamie Lin)

**Immediate (before public launch):**
1. **Input sanitization**: Strip HTML from all user-provided text fields before writing to DB. At minimum: bio, displayName, website, social usernames. Use a `sanitize(s)` utility that strips `<>` characters and trims whitespace.
2. **editToken expiry**: Add `editTokenExpiresAt: string` field to Identity. Default: 1 year from creation. The edit API checks expiry before accepting the token.
3. **Rate limiting persistence**: Move from in-memory Map to SQLite table `rate_limit_counters(key, count, window_start)`. Atomic increment with SQLite transactions.
4. **CORS policy**: API routes should only accept cross-origin requests from known origins (redd.love, localhost in dev). Add CORS headers.

**Near-term (v0.5):**
5. **CSRF protection on mutation routes**: Add `X-Requested-With: XMLHttpRequest` header requirement on POST/PUT/DELETE routes, or use a CSRF token pattern.
6. **Content Security Policy**: Add CSP headers via next.config. Start with `default-src 'self'`, allowlist blockbook and coingecko.
7. **Handle squatting protection**: Expand reserved handle list. Add validation that registered handles don't shadow known brand names.
8. **Wallet address validation**: Server-side RDD address format validation (not just client-side). Reject malformed addresses at the API boundary.
9. **editToken recovery**: Design a recovery flow for lost editToken. Options: (a) email verification (requires email capture), (b) wallet signature challenge, (c) social proof re-verification. Document the non-recovery policy clearly.

---

### 🌐 Community / Marketing (Jordan Wu)

**The product needs to speak to the ReddHead community specifically.** The current homepage is generic crypto-UX. ReddCoin has a passionate, long-standing community. Make the homepage feel like *their* product:
- "Built for ReddHeads, by the ReddCoin community"
- Link to reddcointalk.org, the subreddit, the Discord
- Show the live RDD price ticker more prominently (already built — make it bigger)

**Content that drives registration:**
- Blog/news section: "Creator of the Month" post linking to their tip page drives traffic to redd.love and shows social proof of adoption
- Tutorial: "How to receive RDD tips as a YouTuber" — SEO bait that also converts
- "ReddID in 60 seconds" GIF or video on the homepage — this is the single highest-ROI content investment

**Discord integration:** When a creator registers, post to a #new-creators channel on the ReddCoin Discord (webhook). This provides: (a) free marketing for the creator, (b) community signal that the platform is active, (c) a place for tippers to discover new creators.

**Chrome Web Store submission is a growth multiplier.** Every time someone opens the extension store and sees "ReddID — Tip with RDD", that's an impression. The S7-S15 checklist needs to be the next non-code priority sprint.

**"What is ReddCoin?" modal/page for newcomers.** Creator tip pages will receive traffic from non-crypto users who don't know what RDD is. A "?" or "Learn more" link from the tip page to a clear, non-technical explainer page (e.g., /about-reddcoin) would dramatically improve conversion to first-time tippers.

---

## 3. Priority Matrix

```
         IMPACT
         High │ D2 SQLite · D1 Deploy · D8 Rate Limit    │ V2 Trust Score · G1 Achievements
              │ Sec: Sanitization · editToken expiry      │ V3 Post-reg sharing · Leaderboard
              │                                           │
         Med  │ Verify flow UX · Homepage non-crypto copy │ Embed Markdown badge · /card CTA
              │ Mobile QR fix · Store submission (S7-S15) │ Discord webhook · Creator of month
              │                                           │
         Low  │ Bundle analysis · ISR for tip pages       │ Referral tracking · Email capture
              │ CSP headers · CORS policy                 │ Avatar upload · Staking tier badge
              └───────────────────────────────────────────┴────────────────────────────────
                         Quick/Low effort                    High effort / Long-term
```

---

## 4. Sprint Plan

> Each sprint is ~5 working days. Ordered by dependency and impact.
> Do not begin Sprint N until Sprint N-1 acceptance gate passes.

---

### Sprint A — Production Foundation (Week 1)
**Goal: The platform can survive a real public launch.**

| # | Task | File(s) | Risk |
|---|---|---|---|
| A1 | `SqliteDataStore` implementing `DataStore` interface via `better-sqlite3`; migration script from db.json | `src/lib/db-sqlite.ts`, `scripts/migrate-to-sqlite.ts` | Medium |
| A2 | `getStore()` factory in `db.ts` switches between JSON and SQLite via env var `REDDID_DB_ENGINE` | `src/lib/db.ts` | Low |
| A3 | SQLite-backed rate limiting table (`rate_limit_counters`) — replaces in-memory Map in all API routes | `src/lib/rateLimit.ts` | Low |
| A4 | `sanitize(s, maxLen)` utility in `validation.ts`; applied to all identity write paths | `src/lib/validation.ts` | Low |
| A5 | `editTokenExpiresAt` field on Identity; edit API checks expiry; new registrations get 1-year token | `src/lib/db-sqlite.ts`, `src/app/api/identities/[handle]/route.ts` | Low |
| A6 | Railway deployment config: `railway.json`, `Dockerfile` or nixpacks, volume mount `/app/data` | `railway.json`, `Dockerfile` | Medium |
| A7 | ISR on public tip page: remove `force-dynamic`, add `revalidate = 60`; keep edit/verify/pay dynamic | `src/app/[handle]/page.tsx` | Low |
| A8 | OG image cache headers; Blockbook calls deduplicated per page render | `src/app/api/og/[handle]/route.tsx`, `RecentTips.tsx`, `LiveBalance.tsx` | Low |

**Acceptance gate:** SQLite migration completes on existing db.json. All routes pass `npx tsc --noEmit`. `npm run build` green. Deploy to Railway with volume — db survives redeploy.

---

### Sprint B — Trust & Gamification (Week 2)
**Goal: Every tip page tells a story about the creator's credibility.**

| # | Task | File(s) | Risk |
|---|---|---|---|
| B1 | `computeTrustScore(identity)` function → returns `{ score, max, breakdown }` | `src/lib/trustScore.ts` | Low |
| B2 | Trust score display on tip page: progress bar, score number, "How this works" tooltip | `src/app/[handle]/page.tsx` | Low |
| B3 | Achievement badges system: `computeBadges(identity, blockbookData?)` returns badge list | `src/lib/badges.ts` | Low |
| B4 | Achievement badges rendered on tip page header (Early Adopter, Multi-Social, etc.) | `src/app/[handle]/page.tsx` | Low |
| B5 | Trust score on /explore creator cards (small badge) | `src/app/explore/page.tsx` | Low |
| B6 | Sort /explore by trust score (new default sort option) | `src/app/explore/page.tsx`, `/api/explore/route.ts` | Low |
| B7 | Staking tier computed from live Blockbook balance; shown on staking calculator + tip page | `src/app/staking/StakingCalculator.tsx`, `src/app/[handle]/page.tsx` | Low |
| B8 | "Be the first to tip @handle!" empty state in RecentTips when no tips on-chain yet | `src/components/RecentTips.tsx` | Low |

**Acceptance gate:** Trust scores render correctly for test identities with varying proof states. Badges appear on tip pages. /explore sorts by trust score. No TS errors.

---

### Sprint C — Viral Growth Hooks (Week 2–3)
**Goal: Every user action has a natural sharing moment.**

| # | Task | File(s) | Risk |
|---|---|---|---|
| C1 | Post-registration sharing panel in the `?new=1` banner: "Copy link" + "Share on X" + "Share on Bluesky" (pre-drafted text) | `src/app/[handle]/page.tsx` | Low |
| C2 | Post-verification sharing: after successful social proof submission, show "Share your verified profile" card | `src/app/verify/page.tsx` | Low |
| C3 | "Share Card" button on tip page → links to /card/[handle] with copy-to-clipboard of the card URL | `src/app/[handle]/page.tsx` | Low |
| C4 | Embed badge options: add "Copy Markdown badge" alongside existing HTML badge | `src/app/[handle]/page.tsx`, Love Button popup E4 | Low |
| C5 | "Powered by ReddID" footer attribution on tip pages (subtle, links to redd.love) | `src/app/[handle]/page.tsx` | Low |
| C6 | "Notify me when @handle registers" form on /not-found — stores email in SQLite `waitlist` table | `src/app/not-found.tsx`, `/api/waitlist/route.ts` | Medium |
| C7 | Featured Creators section on homepage (top 3 by trust score, or manually curated via config) | `src/app/page.tsx`, `src/lib/config.ts` | Low |
| C8 | `/explore` "New This Week" section — identities created in the last 7 days | `src/app/explore/page.tsx` | Low |
| C9 | "What is ReddCoin?" page at `/about-redd` — non-technical intro for newcomers landing from tip pages | `src/app/about-redd/page.tsx` | Low |
| C10 | Homepage copy update: add non-crypto-user sentence + "Built for ReddHeads" community framing | `src/app/page.tsx` | Low |

**Acceptance gate:** Post-reg sharing panel renders on `?new=1`. Markdown badge copy works. /not-found waitlist form saves to DB. Featured section on homepage pulls live data.

---

### Sprint D — Security Hardening & Store Submission (Week 3–4)
**Goal: The extension is live in both stores. The platform is hardened for real users.**

| # | Task | File(s) | Risk |
|---|---|---|---|
| D1 | CORS headers on all API mutation routes (POST/PUT/PATCH/DELETE) | `src/middleware.ts` or per-route | Low |
| D2 | CSP header via `next.config.ts`: `default-src 'self'`; allowlist for blockbook, coingecko, fonts | `next.config.ts` | Low |
| D3 | Server-side RDD address format validation in wallet linkage API | `src/app/api/identities/[handle]/wallets/route.ts` | Low |
| D4 | Reserved handle expansion: brand names, generic system words, offensive words | `src/lib/validation.ts` | Low |
| D5 | Verify flow UX: numbered step indicator (Step 1/3), progress bar, "copy challenge code" button | `src/app/verify/page.tsx` | Medium |
| D6 | Mobile QR fix: `min-width: 200px` on QR code element; sticky "Send RDD" CTA on mobile | `src/app/[handle]/page.tsx` | Low |
| D7 | `web-ext lint` 0 errors (S7) | `love-button/` | Low |
| D8 | Extension screenshots: 1280×800 store screenshots per `store/screenshots.md` spec (S8) | `love-button/store/` | Medium |
| D9 | 1280×800 promotional tile created (S9) | `love-button/store/` | Medium |
| D10 | TESTING.md sections 1–14: pass on Chrome latest (S10) | `love-button/TESTING.md` | Medium |
| D11 | TESTING.md sections 1–14: pass on Firefox latest + ESR (S11, S12) | `love-button/TESTING.md` | Medium |
| D12 | Chrome Web Store developer account + submission (S13, S5) | External | Medium |
| D13 | Firefox AMO account + submission (S14, S6, S15 — source zip) | External | Medium |

**Acceptance gate:** `web-ext lint` 0 errors. Extension submitted to at least one store. CORS/CSP headers present in production deploy response headers. Verify flow has numbered steps.

---

### Sprint E — Analytics & Advanced Verification (Week 4–5)
**Goal: We can see what's working. Social proofs carry real weight.**

| # | Task | File(s) | Risk |
|---|---|---|---|
| E1 | Profile analytics on edit page: tip count (from Blockbook) + "Biggest tip" (from tx history) | `src/app/edit/[handle]/page.tsx` | Low |
| E2 | Profile analytics public display: tip count and last-tip date visible on tip page | `src/app/[handle]/page.tsx` | Low |
| E3 | Plausible Analytics (or self-hosted Umami) integration — privacy-preserving, GDPR-compliant | `src/app/layout.tsx` | Low |
| E4 | Discord webhook on new registration: posts to #new-creators with handle + tip page link | `src/app/api/identities/route.ts` | Low |
| E5 | Social proof verification quality: scrape Twitter/X bio for handle, auto-upgrade to "bio-matched" status | `src/app/api/identities/[handle]/verify/route.ts` | High |
| E6 | Wallet signature verification (`verifymessage` equivalent via reddcoinjs-lib) — prove ownership of RDD address | `src/lib/walletVerification.ts` | High |
| E7 | `GET /api/identities/[handle]/export` — data export with editToken; includes all wallets, proofs, stats | `src/app/api/identities/[handle]/export/route.ts` | Low |
| E8 | `DELETE /api/identities/[handle]` — account deactivation with editToken (soft delete, handle reserved) | `src/app/api/identities/[handle]/route.ts` | Medium |
| E9 | Referral tracking: `referredBy` field on Identity; set from `?ref=handle` query param at registration | `src/app/register/page.tsx`, `src/lib/db-sqlite.ts` | Low |
| E10 | Referral leaderboard on /explore — "Top Referrers" section | `src/app/explore/page.tsx` | Low |

**Acceptance gate:** Analytics script loaded. Discord webhook posts on new registration. Export and delete endpoints work. Referral query param captured at registration.

---

## 5. Extension-Side Roadmap (Love Button v2.11+)

| Version | Feature | Notes |
|---|---|---|
| v2.11 | **E5: RDD address detection** — scan page text for `R[A-Za-z0-9]{33}` / `rdd1[a-z0-9]{39}`; offer "Look up on ReddID" in context menu | Requires new manifest `contextMenus` usage on text selection |
| v2.12 | **Popup: Trust Score display** — show creator trust score and badges alongside identity result | Requires trust score from API response |
| v2.13 | **Popup: "Send tip" intent** — BIP21 URI directly opens installed RDD wallet on mobile via intent handler | Mobile/Android focus |
| v2.14 | **Multi-handle popup history sync** — sync history across browser instances via `chrome.storage.sync` | UX polish |
| v2.15 | **Firefox-Chrome feature parity audit** — ensure Firefox popup.js is fully synced with Chrome (currently at v2.1 base vs v2.9 Chrome) | Technical debt |

---

## 6. Key Metrics to Track

Once analytics is in place (Sprint E), track these weekly:

| Metric | Target (Month 1) | Target (Month 3) |
|---|---|---|
| New registrations / week | 20 | 100 |
| Profile completion score avg | 80/190 | 120/190 |
| Social proofs per identity avg | 1.2 | 2.5 |
| Tip page unique visitors / day | 50 | 500 |
| Extension installs (post-store) | — | 500 |
| Handles with ≥ 1 wallet linked | 70% | 80% |
| Handles with ≥ 3 social proofs | 15% | 35% |

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| db.json corruption before SQLite migration | Medium | Critical | Deploy SQLite ASAP (Sprint A) |
| Gajumaru Associate Chains delayed past Q4 2026 | High | Medium | All v0.x work is independent; adapters absorb the delay |
| Chrome Web Store rejection | Medium | Medium | Pre-submit `web-ext lint`; permission justifications in listing.md are thorough |
| ReddCoin market price falls, discouraging adoption | Medium | Low | Product value is creator identity, not price speculation |
| editToken brute-force attack | Low | High | Rate limiting on edit API (Sprint A); add exponential backoff |
| Social proof self-reporting creates fake "verified" profiles | High | Medium | Trust Score distinguishes levels; platform API verification in Sprint E |
| Blockbook API downtime | Medium | Low | Graceful degradation already implemented (balance shows "unavailable") |

---

## 8. Immediate Next Actions (This Session)

1. ✅ love-button v2.10 (E7 richer social proofs) — DONE
2. **Now:** Update reddid-web ROADMAP with Sprint A–E plan and new items
3. **Next session:** Begin Sprint A (SqliteDataStore is the unblocking priority)
4. **Parallel (can be done anytime):** Love Button v2.11 E5 (RDD address detection)

---

*This document is owned by the ReddRails team. Update after each sprint with completion status and lessons learned.*

*Last updated: 2026-05-26 (v0.4.16 review)*
