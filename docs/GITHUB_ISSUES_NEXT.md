# GitHub Issues — Next Batch
**Generated:** 2026-05-26 | **Source:** Product Truth Audit + Sprint Plan
**Labels used:** `bug`, `security`, `enhancement`, `infrastructure`, `ux`, `extension`, `documentation`, `sprint-0`, `sprint-1`, `sprint-2`, `sprint-3`, `sprint-4`, `sprint-5`, `sprint-6`

---

## CRITICAL — Must fix before any public launch

---

### ISSUE-001: editToken never expires — security risk
**Labels:** `security`, `sprint-1`, `infrastructure`
**Priority:** P0 — Critical
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

### ISSUE-002: JsonFileDataStore — no atomic writes — data corruption risk
**Labels:** `security`, `infrastructure`, `sprint-1`, `bug`
**Priority:** P0 — Critical before multi-user production
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

### ISSUE-004: No account deletion or data export endpoint
**Labels:** `security`, `ux`, `sprint-1`
**Priority:** P1 — High (required for GDPR-adjacent trust)
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

### ISSUE-010: Multiple wallet links (v2 API) has no UI
**Labels:** `ux`, `enhancement`, `sprint-2`
**Priority:** P2
**Blocked by:** ISSUE-001 (editToken safety), ISSUE-002 (safe writes)

**Problem:**
The `/api/identities/[handle]/wallets` CRUD API is fully implemented (POST/GET/DELETE/PATCH), but there is no UI to manage multiple wallets. Users can only use the single `rddAddress` field from registration.

**Solution:**
Add "Manage wallets" section to /edit/[handle] page:
- List current wallets with type badges (Legacy/SegWit)
- Add wallet button (address + optional label)
- Set primary wallet button
- Remove wallet button (requires at least 1 remaining)

**Acceptance Criteria:**
- [ ] Edit page shows wallet management section
- [ ] Primary wallet updates immediately on tip page
- [ ] Max 20 wallets enforced in UI (store limit)
- [ ] tsc passes

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

### ISSUE-012: Handle recovery flow — user loses editToken, no recovery
**Labels:** `security`, `ux`, `sprint-1`
**Priority:** P2
**Blocked by:** Nothing

**Problem:**
If a user clears localStorage, switches browsers, or loses their editToken, they permanently lose the ability to edit their handle. There is no recovery mechanism.

**Solution (v0.4 — minimal):**
Add a revocationKey (different from editToken) at registration:
- Display once on the registration success page (after current editToken display)
- Store as a hash (not plaintext) in db.json
- Use to revoke + re-register handle if editToken is lost

**Solution (v0.5 — proper):**
Use wallet signature as the root of trust — sign a challenge with the registered RDD private key to prove ownership.

**Acceptance Criteria (Sprint 1 minimal):**
- [ ] revocationKey shown once on registration success page with clear "save this" instruction
- [ ] POST /api/identities/[handle]/revoke accepts revocationKey + issues new editToken
- [ ] tsc passes

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

| ID | Title | Priority | Sprint |
|----|-------|----------|--------|
| ISSUE-001 | editToken never expires | P0 | 1 |
| ISSUE-002 | JsonFileDataStore no atomic writes | P0 | 1/4 |
| ISSUE-003 | Rate limiting resets on restart | P1 | 1/4 |
| ISSUE-004 | No account deletion or data export | P1 | 1 |
| ISSUE-005 | Reserve/bridge missing DEMO banners | P1 | 0 |
| ISSUE-006 | "Verified" label is trust-based only | P1 | 1/3 |
| ISSUE-007 | package.json version stuck at 0.1.0 | P2 | 0 |
| ISSUE-008 | UNSAFE_VAR_ASSIGNMENT warnings | P2 | 1 |
| ISSUE-009 | No CI pipeline | P2 | 4 |
| ISSUE-010 | Wallet management UI missing | P2 | 2 |
| ISSUE-011 | E10 RDD address detection | P2 | 2 |
| ISSUE-012 | No handle recovery flow | P2 | 1 |
| ISSUE-013 | Staking calc — no financial advice disclaimer | P3 | 0 |
| ISSUE-014 | Firefox data_collection_permissions | P3 | 4 |
| ISSUE-015 | OG image not tested | P3 | 1 |
| ISSUE-016 | Agent management UI | P4 | 6 |
| ISSUE-017 | SQLite migration | P1(prod) | 4 |
| ISSUE-018 | Nostr/Farcaster platform support | P3 | 3 |
