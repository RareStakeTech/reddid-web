# GitHub Issues — Next Batch
**Generated:** 2026-05-26 | **Source:** Product Truth Audit + Sprint Plan
**Labels used:** `bug`, `security`, `enhancement`, `infrastructure`, `ux`, `extension`, `documentation`, `sprint-0`, `sprint-1`, `sprint-2`, `sprint-3`, `sprint-4`, `sprint-5`, `sprint-6`

---

## CRITICAL — Must fix before any public launch

---

### ISSUE-001: editToken never expires — security risk ✅ FIXED in v0.4.20
**Labels:** `security`, `sprint-1`, `infrastructure`
**Priority:** P0 — Critical
**Status:** Resolved — 30-day expiry via `checkEditToken()`; `POST /api/identities/[handle]/token` for reissue; v1 grace rule for existing accounts
**Blocked by:** Nothing

**Problem:**
The editToken (16-char hex bearer token) stored in localStorage has no expiry field. Once issued at registration, it is valid forever. If a user's localStorage is compromised (shared computer, XSS, etc.), an attacker can modify or delete their identity indefinitely.

**Solution:**
1. Add `editTokenExpiresAt: string` field to Identity type (ISO date string)
2. On registration, set expiresAt = now + 30 days
3. On any mutation, check expiry and return 401 if expired
4. Add `POST /api/identities/[handle]/token` to re-issue a new token
5. Frontend: show "Your session expires in X days" near edit actions

**Acceptance Criteria:**
- [ ] Token older than 30 days returns 401 on all mutation routes
- [ ] Re-issue endpoint works with current valid token
- [ ] tsc, lint, build all pass
- [ ] UX test T-05 still passes

**Test Steps:**
1. Register handle, note editToken
2. Manually edit db.json to set editTokenExpiresAt to past date
3. Attempt to edit handle — should return 401
4. Call /api/identities/handle/token — should return new token with new expiry
5. Confirm edit now succeeds

---

### ISSUE-002: JsonFileDataStore — no atomic writes — data corruption risk ✅ FIXED in v0.4.20
**Labels:** `security`, `infrastructure`, `sprint-1`, `bug`
**Priority:** P0 — Critical before multi-user production
**Status:** Resolved — `writeDb()` now uses tmp → `renameSync` pattern
**Blocked by:** Nothing (partial fix possible without SQLite)

**Problem:**
`writeDb()` in json-file-store.ts overwrites the entire file in a single `fs.writeFileSync()` call with no temp-file+rename pattern. Under concurrent requests (two registrations at the same moment), the second write can partially corrupt the first. Data loss is possible.

**Solution (immediate — Sprint 1):**
Implement write-coalescing with a mutex (a simple async lock) and use temp-file + rename pattern:
```ts
const tmp = DB_PATH + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
fs.renameSync(tmp, DB_PATH);
```

**Solution (long-term — Sprint 4):**
Replace JsonFileDataStore with SqliteDataStore (better-sqlite3). SQLite has proper ACID guarantees.

**Acceptance Criteria:**
- [ ] Concurrent write test does not corrupt db.json
- [ ] temp+rename pattern in place
- [ ] Sprint 4: SQLite store passes all DataStore interface tests

---

### ISSUE-003: Rate limiting resets on server restart — abuse risk
**Labels:** `security`, `sprint-1`, `infrastructure`
**Priority:** P1 — High
**Blocked by:** Nothing

**Problem:**
In-memory rate limiters (if any) reset when the Next.js server restarts. Under Railway deployment, restarts happen during deploys. Burst abuse is possible in the window after any deploy.

**Solution:**
- Sprint 1: File-backed rate limit (simple JSON counter with TTL check) — not ideal but better than nothing
- Sprint 4: Redis/Upstash for persistent distributed rate limiting

**Acceptance Criteria:**
- [ ] POST /api/identities rate limited to N registrations per IP per hour
- [ ] POST /api/verify/challenge rate limited per handle
- [ ] Limits survive server restart (Sprint 1: file-backed; Sprint 4: Redis)

---

### ISSUE-004: No account deletion or data export endpoint ✅ FIXED in v0.4.20
**Labels:** `security`, `ux`, `sprint-1`
**Priority:** P1 — High (required for GDPR-adjacent trust)
**Status:** Resolved — `DELETE /api/identities/[handle]` (with confirmation string) + `POST /api/identities/[handle]/export` both live
**Blocked by:** ISSUE-002 (safe writes required first)

**Problem:**
Users cannot delete their handle or export their data. This is a basic user right and a trust signal for privacy-conscious ReddHeads.

**Solution:**
- `DELETE /api/identities/[handle]` — requires editToken; removes all identity data from db.json
- `GET /api/identities/[handle]/export` — requires editToken; returns full JSON dump
- Frontend: Add "Delete account" and "Export my data" to /edit/[handle] page

**Acceptance Criteria:**
- [ ] DELETE removes handle + all socialProofs + all wallets from store
- [ ] Export returns complete identity JSON including wallets (but not other users' data)
- [ ] Both require valid editToken
- [ ] GET /[handle] returns 404 after deletion
- [ ] Love Button popup shows "no creator" after deletion

---

## HIGH PRIORITY — Sprint 1 polish

---

### ISSUE-005: Reserve page and bridge page lack "DEMO DATA" banners
**Labels:** `ux`, `documentation`, `sprint-0`, `bug`
**Priority:** P1
**Blocked by:** Nothing

**Problem:**
`/reserve` returns hardcoded zeros (`isLive: false`) and `/bridge` is a placeholder. Neither page has a clearly visible "DEMO — not live" banner. A user landing from a search engine could be misled into thinking a real reserve exists.

**Solution:**
Add a prominent yellow/amber banner at the top of both pages:
```
⚠ DEMO — Reserve model is not yet live. ReddRail and the reserve wallet are
  placeholder values only. This page explains how the future model will work.
```

**Acceptance Criteria:**
- [ ] /reserve has yellow banner visible above the fold
- [ ] /bridge has yellow banner visible above the fold
- [ ] No numeric reserve balance shown without "0 (demo)" label
- [ ] UX test T-10 passes

---

### ISSUE-006: Social proof "verified" label is trust-based, not independently checked
**Labels:** `ux`, `documentation`, `security`, `sprint-1`, `sprint-3`
**Priority:** P1 — User-facing trust claim
**Blocked by:** Nothing (documentation fix is immediate; real verification is Sprint 3)

**Problem:**
`confirmSocialProof()` sets `verificationStatus: 'verified'` when a user submits a proof URL. The server does NOT fetch that URL to confirm the challenge code exists. The verify page has an honest in-code disclaimer, but the tip page badge reads as verified without qualification.

**Solution (Sprint 1 — documentation):**
- Change TrustBadge tooltip from "Verified" to "Challenge-post linked (not independently confirmed)"
- Ensure Love Button popup shows the same nuanced tooltip

**Solution (Sprint 3 — real verification):**
- Server fetches proofUrl at confirm time; searches for challenge code
- Adds `url-fetch-verified` trust level distinct from `challenge-post-verified`

**Acceptance Criteria (Sprint 1):**
- [ ] TrustBadge tooltip explains what "verified" means in v0.4
- [ ] Love Button popup badge tooltip says "Self-posted proof URL on record" not just "Verified"

**Acceptance Criteria (Sprint 3):**
- [ ] Server confirms challenge code appears at proofUrl
- [ ] Trust level distinguishes fetch-verified from trust-based
- [ ] tsc passes with new trust level type

---

## MEDIUM PRIORITY — Sprint 1-2

---

### ISSUE-007: reddid-web package.json version stuck at 0.1.0
**Labels:** `documentation`, `sprint-0`
**Priority:** P2
**Blocked by:** Nothing

**Problem:**
package.json has `"version": "0.1.0"` despite the codebase being at v0.4.17. This causes confusion in CI output, npm audit reports, and version tracking.

**Solution:**
Bump `package.json` version to `"0.4.17"` and commit as part of Sprint 0 cleanup.

**Acceptance Criteria:**
- [ ] `"version": "0.4.17"` in reddid-web/package.json
- [ ] CHANGELOG.md entry for 0.4.18 (or next version after bump)

---

### ISSUE-008: Love Button — 7 UNSAFE_VAR_ASSIGNMENT warnings on innerHTML usage
**Labels:** `security`, `extension`, `sprint-1`
**Priority:** P2
**Blocked by:** Nothing

**Problem:**
web-ext lint reports 7 UNSAFE_VAR_ASSIGNMENT warnings on innerHTML assignments in popup.js. All assignments use `escapeHtml()` before insertion (the risk is mitigated), but the warnings flag during Chrome Web Store review and Firefox AMO review processes.

**Solution:**
Refactor innerHTML assignments to use DOM API methods:
```js
// Instead of: el.innerHTML = `<i>${icon}</i> ${name}${dot}`;
const i = document.createElement('i');
i.textContent = icon;
el.appendChild(i);
el.appendChild(document.createTextNode(` ${name}`));
el.appendChild(dot);
```

**Acceptance Criteria:**
- [ ] `npm run lint` produces 0 UNSAFE_VAR_ASSIGNMENT warnings
- [ ] Popup renders identically to current version
- [ ] Chrome and Firefox builds both pass lint clean

---

### ISSUE-009: No CI pipeline — builds not automatically verified on push
**Labels:** `infrastructure`, `sprint-4`
**Priority:** P2
**Blocked by:** Deployment (Sprint 4)

**Problem:**
There is no GitHub Actions CI pipeline. Every push could silently break the build or introduce TypeScript errors. This was only caught manually in the validation log.

**Solution:**
Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
    working-directory: reddid-web
  build-extension:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run build:chrome
    working-directory: love-button
```

**Acceptance Criteria:**
- [ ] CI runs on every push to main and every PR
- [ ] tsc, lint, build all run and must pass for merge
- [ ] Build artifact (love-button-chrome-*.zip) uploaded as workflow artifact

---

### ISSUE-010: Multiple wallet links (v2 API) has no UI ✅ FIXED in v0.4.21
**Labels:** `ux`, `enhancement`, `sprint-2`
**Priority:** P2
**Status:** Resolved — wallet management section added to `/edit/[handle]` page in Sprint 2
**Blocked by:** ~~ISSUE-001 (editToken safety), ISSUE-002 (safe writes)~~

**Problem:**
The `/api/identities/[handle]/wallets` CRUD API is fully implemented (POST/GET/DELETE/PATCH), but there was no UI to manage multiple wallets.

**Resolution:**
- "Manage wallets" section on /edit/[handle] page: lists wallets with type badges, add wallet form, set-primary button, remove button
- TOKEN_EXPIRED detection in all wallet mutation handlers
- Max 10 wallets enforced in UI (matching store limit)
- tsc clean ✅

---

### ISSUE-011: Love Button v2.11 — E10 RDD address detection in page content
**Labels:** `extension`, `enhancement`, `sprint-2`
**Priority:** P2
**Blocked by:** Nothing

**Problem:**
The Love Button currently only detects registered ReddID handles via URL-pattern matching. If a creator posts their raw RDD address in a tweet or article, there's no way to quickly look them up.

**Solution:**
- Scan page text for RDD address patterns: `R[A-Za-z0-9]{33}` (legacy) and `rdd1[a-z0-9]{39}` (SegWit)
- On match, add context menu item: "Look up Ɍ RDD address on ReddID"
- Context menu opens: `${apiBase}/api/identities/by-rdd?address=${match}`

**Acceptance Criteria:**
- [ ] Context menu appears when right-clicking on a valid RDD address on any page
- [ ] Clicking opens ReddID lookup for that address
- [ ] No false positives on Bitcoin/other coin addresses
- [ ] manifest.json updated for context menu permission

---

### ISSUE-012: Handle recovery flow — user loses editToken, no recovery ✅ FIXED in v0.4.20
**Labels:** `security`, `ux`, `sprint-1`
**Priority:** P2
**Status:** Resolved — full recovery flow implemented in Sprint 1

**Problem:**
If a user cleared localStorage or lost their editToken, they permanently lost the ability to edit their handle.

**Resolution:**
- `revocationKey` (64-char hex) generated at registration; shown once on the post-registration interstitial with amber "Save this" instruction and copy button
- Plaintext key never stored — SHA-256 hash stored in `revocationKey` field in db.json
- `POST /api/identities/[handle]/recover` accepts the plaintext key; verifies hash; issues fresh editToken with new 30-day expiry
- Rate-limited: 5 attempts per IP per hour
- Identities registered before Sprint 1 have `revocationKey: null` — endpoint returns `422 NO_RECOVERY_KEY` with helpful message
- tsc clean ✅

---

### ISSUE-013: Staking calculator has no "not financial advice" disclaimer
**Labels:** `ux`, `documentation`, `sprint-0`
**Priority:** P3
**Blocked by:** Nothing

**Problem:**
The /staking page shows projected RDD earnings. Without a clear disclaimer, users may treat this as guaranteed financial returns. ReddID gamification rules explicitly prohibit "claims that tips equal income guarantees."

**Solution:**
Add a prominent disclaimer box:
```
⚠ Educational estimate only. PoSV staking returns vary with network conditions,
  coin age, and total network stake. This is not financial advice.
  Past staking performance does not guarantee future results.
```

**Acceptance Criteria:**
- [ ] Disclaimer visible above or adjacent to any projected return number
- [ ] UX test T-15 passes: "Verify page carries disclaimer that this is an estimate, not financial advice"

---

### ISSUE-014: MISSING_DATA_COLLECTION_PERMISSIONS — Firefox AMO future requirement
**Labels:** `extension`, `documentation`, `sprint-4`
**Priority:** P3
**Blocked by:** Firefox AMO submission readiness

**Problem:**
web-ext lint reports a NOTICE: `MISSING_DATA_COLLECTION_PERMISSIONS` — Firefox will require `gecko.data_collection_permissions` in the manifest in a future version.

**Solution:**
Add to manifest.json `browser_specific_settings.gecko`:
```json
"data_collection_permissions": {
  "required": [],
  "optional": []
}
```

**Acceptance Criteria:**
- [ ] Notice no longer appears in `npm run lint:firefox`
- [ ] Manifest valid on Firefox 109+

---

### ISSUE-015: OG image API — no test or validation
**Labels:** `ux`, `infrastructure`, `sprint-1`
**Priority:** P3
**Blocked by:** Nothing

**Problem:**
`/api/og/[handle]` exists and generates images, but is not covered by any test or manual check. A broken OG image silently fails when shared on Twitter/X (just shows no image).

**Solution:**
- Add OG image to UX test plan (already in T-14)
- Add automated test: fetch /api/og/testjay2026, verify Content-Type is image/*
- Add error logging to og route

**Acceptance Criteria:**
- [ ] `/api/og/[handle]` returns 200 + image/* content type for known handles
- [ ] `/api/og/unknownhandle` returns 404 with descriptive message

---

## Sprint 3 — Trust Foundations (In Progress)

---

### ISSUE-019: Social proof revocation — no UI or API ✅ FIXED in v0.4.23
**Labels:** `ux`, `security`, `sprint-3`
**Priority:** P1
**Status:** Resolved — S3-04 complete

**Problem:**
Users had no way to remove a social proof once added. Revoked Twitter/GitHub accounts could remain on public profiles indefinitely.

**Resolution:**
- `DELETE /api/identities/[handle]/socials/[platform]` — requires editToken; soft-deletes via `verificationStatus: 'revoked'`; record retained for audit
- `removeSocialProof()` store method; added to DataStore interface and db.ts shim
- Trash icon (Trash2 from lucide-react) on each social proof row in /edit/[handle] with `window.confirm()` guard
- Revoked proofs filtered from all public API responses by `publicIdentity()`
- TOKEN_EXPIRED detection in remove handler
- tsc clean ✅

---

### ISSUE-020: proofUrl exposed in public API — privacy risk ✅ FIXED in v0.4.23
**Labels:** `security`, `privacy`, `sprint-3`
**Priority:** P2
**Status:** Resolved — S3-08 complete

**Problem:**
`proofUrl` was included in `GET /api/identities/[handle]` responses. This exposed the URL of the user's public social post, which can be used to fingerprint or track users across platforms even if they later delete the post.

**Resolution:**
- New type `PublicSocialProof = Omit<SocialProof, 'proofUrl'>` in `src/lib/types.ts`
- `PublicIdentity.socialProofs` changed to `PublicSocialProof[]`
- `publicIdentity()` in `db.ts` now maps each proof through `({ proofUrl: _pu, ...proof }) => proof` before returning
- proofUrl retained server-side for future S3-01 server-side verification
- tsc clean ✅

---

### ISSUE-021: Server-side URL fetch for social proof verification
**Labels:** `security`, `enhancement`, `sprint-3`
**Priority:** P1
**Blocked by:** Nothing

**Problem:**
`confirmSocialProof()` sets `verificationStatus: 'verified'` without fetching the `proofUrl` to confirm the challenge code appears there. This is explicitly labeled trust-based in the UI, but remains an open gap for S3-01.

**Solution:**
- At confirm time, server fetches `proofUrl` (with timeout + size cap)
- Searches response body for the 8-char challenge code
- If found: `verificationStatus: 'verified'`; if not found or fetch fails: return error with guidance
- Add new trust level: `url-fetch-verified` distinct from `challenge-post-verified`

**Acceptance Criteria:**
- [ ] Server fetches proofUrl at confirm time
- [ ] Challenge code found in fetched content before setting 'verified'
- [ ] Timeout: 5s; max response size: 500KB
- [ ] Graceful fallback if URL is unreachable (user can retry)
- [ ] New trust level type in TrustLevel enum
- [ ] tsc passes

---

### ISSUE-022: Re-verify expired social proofs
**Labels:** `ux`, `sprint-3`
**Priority:** P2
**Blocked by:** ISSUE-021

**Problem:**
Once a social proof's challenge expires (8h), there is no UI for the user to start a new verification attempt for the same platform. The only path is to revoke and re-add.

**Solution:**
- On /edit/[handle], show "Re-verify" button next to expired/failed proofs
- Clicking triggers a new challenge request for that platform
- Redirects user to /verify with platform pre-filled

**Acceptance Criteria:**
- [ ] "Re-verify" button visible for expired and failed proofs on edit page
- [ ] Button pre-fills /verify with the platform
- [ ] tsc passes

---

### ISSUE-023: Abuse reporting admin view
**Labels:** `security`, `enhancement`, `sprint-3`
**Priority:** P3
**Blocked by:** Nothing (route exists; needs admin surface)

**Problem:**
`POST /api/report` is implemented and stores abuse reports, but there is no admin surface to view, triage, or act on them.

**Solution:**
- Protected admin route at `/admin/reports` (IP allowlist or basic auth header)
- Lists pending reports with handle, reporter, reason, timestamp
- Mark as reviewed, escalate, or dismiss

**Acceptance Criteria:**
- [ ] Admin can view all pending reports
- [ ] Can mark report as reviewed
- [ ] Route is not publicly accessible
- [ ] tsc passes

---

## Deferred / Future Sprints

### ISSUE-016: Agent management UI
**Labels:** `enhancement`, `sprint-6`
**Priority:** P4 (blocked on ReddRail and PolicyEngine)

Agent delegation has real API infrastructure (`/api/agents/[handle]`) but no UI. A creator cannot manage their authorized agents without curl. Defer to Sprint 6 when agent tips will be executable.

---

### ISSUE-017: SQLite data store migration (better-sqlite3)
**Labels:** `infrastructure`, `sprint-4`
**Priority:** P1 for production, P4 until then

Full replacement of JsonFileDataStore with SqliteDataStore. All DataStore interface methods must pass with SQLite. Migration script required before production deploy.

---

### ISSUE-018: Nostr and Farcaster platform support
**Labels:** `extension`, `enhancement`, `sprint-3`
**Priority:** P3

Nostr and Farcaster are in platforms.ts with status 'planned'. Add content scripts and register page support once the platform identity patterns are stable.

---

## Issue Priority Summary

| ID | Title | Priority | Sprint | Status |
|----|-------|----------|--------|--------|
| ISSUE-001 | editToken never expires | P0 | 1 | ✅ Fixed v0.4.20 |
| ISSUE-002 | JsonFileDataStore no atomic writes | P0 | 1/4 | ✅ Fixed v0.4.20 |
| ISSUE-003 | Rate limiting resets on restart | P1 | 4 | ⏳ Partial (in-memory; resets on restart) |
| ISSUE-004 | No account deletion or data export | P1 | 1 | ✅ Fixed v0.4.20 |
| ISSUE-005 | Reserve/bridge missing DEMO banners | P1 | 0 | ✅ Fixed v0.4.x |
| ISSUE-006 | "Verified" label is trust-based only | P1 | 1/3 | 🟡 Partial (tooltip honest; server-fetch pending S3-01) |
| ISSUE-007 | package.json version stuck at 0.1.0 | P2 | 0 | ✅ Fixed (now 0.4.23) |
| ISSUE-008 | UNSAFE_VAR_ASSIGNMENT warnings | P2 | D | ⏳ Pending |
| ISSUE-009 | No CI pipeline | P2 | 4 | ⏳ Pending |
| ISSUE-010 | Wallet management UI missing | P2 | 2 | ✅ Fixed v0.4.21 |
| ISSUE-011 | E10 RDD address detection | P2 | 2 | ⏳ Pending |
| ISSUE-012 | No handle recovery flow | P2 | 1 | ✅ Fixed v0.4.20 |
| ISSUE-013 | Staking calc — no financial advice disclaimer | P3 | 0 | ✅ Fixed v0.4.x |
| ISSUE-014 | Firefox data_collection_permissions | P3 | 4 | ⏳ Pending |
| ISSUE-015 | OG image not tested | P3 | 1 | ⏳ Pending |
| ISSUE-016 | Agent management UI | P4 | 6 | ⏳ Pending |
| ISSUE-017 | SQLite migration | P1(prod) | 4 | ⏳ Pending |
| ISSUE-018 | Nostr/Farcaster platform support | P3 | 3 | ⏳ Pending |
| ISSUE-019 | Social proof revocation — no UI or API | P1 | 3 | ✅ Fixed v0.4.23 |
| ISSUE-020 | proofUrl exposed in public API | P2 | 3 | ✅ Fixed v0.4.23 |
| ISSUE-021 | Server-side URL fetch for social proof | P1 | 3 | ✅ Fixed v0.4.24 (generic; Twitter/Instagram deferred) |
| ISSUE-022 | Re-verify expired social proofs | P2 | 3 | ✅ Fixed v0.4.24 |
| ISSUE-023 | Abuse reporting admin view | P3 | 3 | ✅ Fixed v0.4.24 |
