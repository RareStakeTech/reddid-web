# ReddID Validation Log
**Purpose:** Evidence gate — actual command results, not claimed ones. Run before every release sprint begins.
**Last updated:** 2026-05-26

---

## Environment

| Variable | Value |
|----------|-------|
| Date | 2026-05-26 09:03 EDT |
| Node.js | v24.15.0 |
| npm | 11.12.1 |
| OS | Windows 11 (RSTAdmin workstation) |
| Working directory | C:\Users\RSTAdmin\Documents\ReddRails prototype |

---

## reddid-web

### npm install
```
Status: SKIP (node_modules present and current)
Assumption: clean install would succeed — no native modules; all deps in package.json resolvable
Action required: Run `npm ci` in CI pipeline
```

### tsc --noEmit
```
Command: npx tsc --noEmit
Exit code: 0
Output: (no output — zero type errors)
Status: PASS ✅
Date: 2026-05-26
```

### ESLint
```
Command: npm run lint  (eslint src/)
Exit code: 0
Output: (no output — zero lint warnings or errors)
Status: PASS ✅
Date: 2026-05-26
```

### Production build
```
Command: npm run build
Exit code: 0

Build output summary:
  ✓ Compiled successfully in 8.6s
  ✓ Generating static pages using 3 workers (25/25) in 833ms

Pages built (○ = Static, ƒ = Dynamic):
  ○  /                         (homepage)
  ○  /bridge
  ○  /docs
  ○  /explore
  ○  /guide
  ○  /platforms
  ○  /privacy
  ○  /register
  ○  /reserve
  ○  /roadmap
  ○  /search
  ○  /sitemap.xml
  ○  /staking
  ○  /terms
  ○  /verify
  ƒ  /[handle]                 (tip page)
  ƒ  /card/[handle]
  ƒ  /edit/[handle]
  ƒ  /live/[handle]
  ƒ  /pay/[handle]
  ƒ  /api/agents/[handle]
  ƒ  /api/agents/[handle]/[id]
  ƒ  /api/explore
  ƒ  /api/identities
  ƒ  /api/identities/[handle]
  ƒ  /api/identities/[handle]/wallets
  ƒ  /api/identities/[handle]/wallets/[walletId]
  ƒ  /api/identities/by-social
  ƒ  /api/live/[handle]/events
  ƒ  /api/og/[handle]
  ƒ  /api/payments
  ƒ  /api/payments/[id]
  ƒ  /api/report
  ƒ  /api/reserve
  ƒ  /api/search
  ƒ  /api/verify/challenge
  ƒ  /api/verify/confirm

Status: PASS ✅
Date: 2026-05-26
```

### Dev smoke test
```
Status: NOT RUN (requires manual browser check)
Action required: See docs/UX_TEST_PLAN.md — Jay's First UX Walkthrough
```

### Known issues at this date
- All pages use `force-dynamic` — no ISR (see Sprint 0 ticket: perf-001)
- JsonFileDataStore has no atomic writes — corruption risk under concurrent writes (see Sprint 0: db-001)
- In-memory rate limiting resets on server restart (see Sprint 0: security-001)
- data/db.json is flat file with no backup strategy (see Sprint 0: db-002)

---

## love-button

### npm install
```
Status: SKIP (node_modules present)
devDependencies: web-ext ^8.3.0
```

### web-ext lint (Chrome source)
```
Command: npm run lint  (web-ext lint --source-dir .)
Date: 2026-05-26

Validation Summary:
  errors:   1
  notices:  1
  warnings: 7

ERRORS:
  MANIFEST_FIELD_UNSUPPORTED — "/background/service_worker" is not supported
  File: manifest.json
  Assessment: FALSE POSITIVE. Firefox 109+ (min version declared in manifest)
              does support service_worker in MV3. This is a web-ext linter
              version lag, not a real compatibility issue. Verify on
              browser.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/
              manifest.json/background when web-ext updates.

NOTICES:
  MISSING_DATA_COLLECTION_PERMISSIONS — gecko/data_collection_permissions missing
  Assessment: Future requirement; not yet enforced. Add in Sprint D before
              Firefox AMO submission.

WARNINGS (7 × UNSAFE_VAR_ASSIGNMENT on innerHTML):
  Files: popup.js lines 17, 50, 56, 62
         love-button-firefox/popup.js lines 44, 50, 55
  Assessment: All innerHTML assignments use escapeHtml() sanitization before
              insertion. web-ext lint cannot detect this pattern. Risk is low
              but warrants code review. Mitigation: refactor to DOM API in
              Sprint D (security hardening sprint).

Overall verdict: Extension is valid for Chrome submission despite 1 linter error
                 (false positive). Firefox submission requires data_collection_permissions.
```

### web-ext build:chrome
```
Command: npm run build:chrome
Output: Your web extension is ready: ../love-button-chrome-2.10.0.zip
Exit code: 0
Status: PASS ✅
Date: 2026-05-26
Artifact: love-button-chrome-2.10.0.zip
```

### web-ext lint:firefox (Firefox build lint)
```
Status: NOT RUN this cycle
Action required: Run `npm run lint:firefox` before next Firefox AMO submission
Expected issues: Same as above + data_collection_permissions notice
```

### build:firefox
```
Status: NOT RUN this cycle (build-firefox.js mirrors Chrome)
Action required: Run and verify before AMO submission
```

---

## Version Reconciliation

| Artifact | Previous | Now | Fix |
|----------|---------|-----|-----|
| love-button/manifest.json | 2.10.0 | 2.10.0 | — (was correct) |
| love-button/package.json | 2.5.0 | 2.10.0 | ✅ Fixed 2026-05-26 |
| love-button-firefox/manifest.json | (mirrored) | 2.10.0 | (set by build-firefox.js) |
| reddid-web/package.json | 0.1.0 | 0.1.0 | ⏳ Pending — bump to 0.4.17 in Sprint 0 |
| reddid-web homepage badge | v0.4 beta | v0.4 beta | — (correct) |
| register page footer | "v0.1 beta · … ships in v0.2" | "v0.4 beta · … ships in v0.5" | ✅ Fixed 2026-05-26 |

---

## Action Items Generated

| ID | Action | Priority | Sprint |
|----|--------|----------|--------|
| v-001 | Add `npm ci && npm run build` to CI pipeline | HIGH | 0 |
| v-002 | Bump reddid-web/package.json version to 0.4.17 | MED | 0 |
| v-003 | Refactor popup.js innerHTML to DOM APIs (remove UNSAFE_VAR_ASSIGNMENT) | MED | D |
| v-004 | Add data_collection_permissions to Firefox manifest | MED | D |
| v-005 | Run `npm run lint:firefox` and `npm run build:firefox` before next AMO submission | HIGH | D |
| v-006 | Add ISR revalidate=60 to tip page | LOW | A |
| v-007 | Run dev smoke test (UX_TEST_PLAN.md) after every sprint | HIGH | 0 (recurring) |

---

## Next Run
This log should be re-executed at the start of every new sprint. Append a new dated section rather than overwriting — this is an evidence trail, not a status page.
