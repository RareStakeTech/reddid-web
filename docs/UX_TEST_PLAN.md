# ReddID UX Test Plan
**Version:** v0.4 | **Date:** 2026-05-26
**Audience:** Jay TechAdept (founder), QA, any ReddHead beta tester
**Prerequisites:** `npm run dev` running locally on port 3000 + Love Button extension loaded in Chrome unpacked from love-button/

---

## Test Environment Setup

1. Start dev server: `cd reddid-web && npm run dev` → http://localhost:3000
2. Load extension: Chrome → Extensions → Load unpacked → select `love-button/`
3. Set extension API base in options: `http://localhost:3000` (not default redd.love)
4. Have a valid testnet RDD address handy (any R… or rdd1… format)
5. Have two browser windows open: one for the site, one for "social platforms"

---

## 15 Numbered Test Scenarios

---

### T-01 — Handle Registration (Happy Path)
**Goal:** Verify a fresh handle can be registered end-to-end.

**Steps:**
1. Go to http://localhost:3000/register
2. Type a new handle (e.g. `testjay2026`)
3. Observe: availability indicator goes "Checking…" → "✓ @testjay2026 is available"
4. Enter a valid RDD address: `RdGJK3UcYiZaT3k2mz3MDuBhRXkHo5JhPJ`
5. Enter display name: "Jay Test"
6. Enter bio: "Testing the audit flow" (verify 160 char counter works)
7. Click "Register @testjay2026"
8. Verify: redirected to `/testjay2026?new=1`
9. Verify: green success banner "registered successfully!" appears
10. Verify: "Verify social accounts →" link is visible and points to `/verify?handle=testjay2026`
11. Check browser localStorage for `reddid_edittoken_testjay2026` — token must be present

**Expected:** Registration succeeds, tip page loads, editToken stored.
**Pass criteria:** All 11 steps complete without error.

---

### T-02 — Duplicate Handle Rejection
**Goal:** Verify duplicate handles are blocked.

**Steps:**
1. Go to /register
2. Type the handle from T-01 (`testjay2026`) — it must now exist
3. Observe: "✗ @testjay2026 is taken" in red
4. Attempt to submit anyway (button should be disabled/grey)

**Expected:** Cannot register duplicate. Submit button blocked.
**Pass criteria:** Button disabled when handle is taken.

---

### T-03 — Public Tip Page
**Goal:** All tip page elements render correctly and work.

**Steps:**
1. Go to http://localhost:3000/testjay2026
2. Verify display name "Jay Test" appears in h1
3. Verify RDD address renders correctly in the address box
4. Verify address type badge shows (Legacy P2PKH, SegWit, or Testnet)
5. Click "Copy" next to address — paste into notepad and verify it matches
6. Verify QR code renders visibly
7. Click quick-tip button (Ɍ50) — verify clipboard contains a `reddcoin:…` BIP21 URI
8. Verify "Ɍ Native RDD · No wrapped tokens" label visible in footer
9. Verify "Share" button opens share dialog or copies URL
10. Click "Ɍ Pay" link — verify /pay/testjay2026 loads
11. Click "🃏 Tip card" — verify /card/testjay2026 loads

**Expected:** All elements present, copy/QR functional.
**Pass criteria:** 11/11 steps pass.

---

### T-04 — Social Proof Challenge Flow
**Goal:** Verify the challenge-post verification flow works end-to-end.

**Steps:**
1. Go to http://localhost:3000/verify?handle=testjay2026
2. Verify edit token auto-fills from localStorage (or paste it manually)
3. Select platform: GitHub
4. Click "Get challenge code →"
5. Verify a 6–8 char uppercase challenge code appears (e.g. `A3F9KZ`)
6. Click "Copy" on the code — paste to verify it's the code
7. Enter username: `testuser`
8. Enter proof URL: `https://github.com/testuser` (trust-based — no actual fetch)
9. Click "Submit verification"
10. Verify "Account linked!" success screen appears
11. Click "View tip page" — verify @testjay2026 now shows a GitHub badge
12. Verify GitHub badge links to https://github.com/testuser

**Expected:** Challenge flow works; badge appears on tip page.
**Pass criteria:** Green ✓ state after step 10; badge visible in step 11.

---

### T-05 — Edit Handle
**Goal:** Verify handle editing works with editToken auth.

**Steps:**
1. Go to http://localhost:3000/testjay2026
2. Click "Edit" link (should appear in page footer)
3. On edit page, change display name to "Jay Test Updated"
4. Verify editToken is pulled from localStorage or prompted
5. Save changes
6. Return to tip page — verify new display name appears

**Expected:** Edit succeeds; tip page reflects changes.
**Pass criteria:** Updated name visible on tip page.

---

### T-06 — Explore Page
**Goal:** Verify explore page loads, filters, and paginates.

**Steps:**
1. Go to http://localhost:3000/explore
2. Verify at least one creator card shows (testjay2026)
3. Search for "jay" — verify testjay2026 card appears
4. Search for "xyz404nonexistent" — verify "No creators match those filters" state
5. Click "Clear filters" — verify all creators return
6. Filter by platform "GitHub" — verify only handles with GitHub proof show
7. Sort by "A → Z" — verify alphabetical order
8. Click a creator card — verify it navigates to their tip page

**Expected:** All filters/sort/states work correctly.
**Pass criteria:** 8/8 steps pass.

---

### T-07 — Love Button: Extension Loads
**Goal:** Verify the extension is installed and popup renders.

**Steps:**
1. Open Chrome — verify extension icon (Ɍ) is visible in toolbar
2. Press Alt+Shift+R (or click icon) — popup opens
3. Verify popup shows "No creator detected" on a blank tab
4. Verify "v2.10" badge visible in popup header
5. Open options (gear icon or right-click → Options)
6. Verify API Base URL field shows current value
7. Verify tipUrlTarget dropdown has "Tip page" and "Pay page" options

**Expected:** Extension loads, popup renders, options accessible.
**Pass criteria:** 7/7 steps pass.

---

### T-08 — Love Button: Twitter/X Injection
**Goal:** Verify Love Button injects tip button on Twitter/X profile pages.

**Steps:**
1. Visit https://x.com/reddcoin (or any handle registered on redd.love)
2. Observe page — verify "Tip with Ɍ RDD" button appears near Follow button
3. Click the Tip button — verify it opens redd.love/[handle] in new tab
4. Change tipUrlTarget in options to "Pay page"
5. Revisit Twitter profile — verify button now opens redd.love/pay/[handle]

**Expected:** Button injected; tipUrlTarget respected.
**Pass criteria:** Button visible; both URL modes work.

---

### T-09 — Love Button: Popup Social Proof Badges
**Goal:** Verify social proof badges render correctly in popup.

**Steps:**
1. Navigate to a profile page of a creator registered on redd.love with social proofs
2. Open Love Button popup (Alt+Shift+R)
3. Verify popup auto-detects the platform and shows creator info
4. Verify social proof badges show platform icons and names
5. Verify self-reported proofs show grey ○ dot
6. Verify challenge-verified proofs show green ● dot
7. Click a badge link — verify it opens the creator's platform profile in new tab

**Expected:** Badges render correctly; links work.
**Pass criteria:** 7/7 steps pass.

---

### T-10 — Reserve / Bridge Page Disclaimers
**Goal:** Verify mock pages carry visible disclaimers.

**Steps:**
1. Go to http://localhost:3000/reserve
2. Verify reserve data shows zeros or minimal data (isLive: false)
3. Verify there is a clear disclaimer: this is a demo / data not live
4. Go to http://localhost:3000/bridge
5. Verify bridge page clearly states "coming soon" / not live
6. Verify no "live balance" or amount is displayed without a disclaimer

**Expected:** Both pages honest about their status.
**Pass criteria:** No misleading live data shown without disclaimer.

---

### T-11 — Address Validation
**Goal:** Verify invalid RDD addresses are rejected at registration.

**Steps:**
1. Go to /register
2. Enter handle: `validationtest`
3. Enter an Ethereum address (0x…) — attempt to submit
4. Verify error or address type badge shows "unknown" / no badge
5. Enter a Bitcoin address (1A…) — verify rejected or flagged
6. Enter a valid RDD address (R…) — verify accepted, badge shows "Legacy P2PKH"
7. Enter a valid SegWit RDD address (rdd1…) — verify badge shows "SegWit"

**Expected:** Clearly distinguishes valid/invalid/unknown address types.
**Pass criteria:** Valid RDD addresses pass; others flagged.

---

### T-12 — Mobile Responsive Layout
**Goal:** Verify key pages work on mobile viewport.

**Steps:**
1. Open Chrome DevTools → toggle device toolbar → iPhone 12 (390px)
2. Visit http://localhost:3000 — verify hero, stats, features readable
3. Visit /register — verify form is usable (inputs not clipped)
4. Visit /testjay2026 — verify QR code and address visible, not overflowing
5. Verify "How to tip" steps don't overflow
6. Visit /explore — verify grid reflows to 1 column

**Expected:** No horizontal overflow; all key UI elements reachable.
**Pass criteria:** No broken layouts at 390px viewport.

---

### T-13 — Not Found Handling
**Goal:** Verify unknown handles show a proper 404 page.

**Steps:**
1. Go to http://localhost:3000/handlethatsurtelydoesnotexist99999
2. Verify custom not-found page renders (not a blank page or default Next.js error)
3. Verify page offers a link back to home or /explore

**Expected:** Graceful 404 with navigation option.
**Pass criteria:** Custom 404 page renders.

---

### T-14 — OG Image Generation
**Goal:** Verify OG image route works for registered handles.

**Steps:**
1. Visit http://localhost:3000/api/og/testjay2026 directly
2. Verify a PNG image renders (not a 500 error)
3. Verify it shows the handle and/or display name

**Expected:** OG image generates for valid handles.
**Pass criteria:** Image renders without error.

---

### T-15 — Staking Calculator
**Goal:** Verify staking calculator works and is clearly non-financial-advice.

**Steps:**
1. Go to http://localhost:3000/staking
2. Enter a balance: 10,000 RDD
3. Verify APY estimate updates
4. Verify calculation is based on PoSV formula
5. Verify page carries disclaimer that this is an estimate, not financial advice
6. Change stake duration — verify output changes

**Expected:** Calculator works; disclaimer visible.
**Pass criteria:** Math updates; disclaimer present.

---

## Jay's First UX Walkthrough

A guided checklist for Jay to run as the product founder — combines first-impression test with edge-case probing.

**Time required:** ~30 minutes | **Tools:** Chrome + extension + notepad

```
[ ] 1. Open http://localhost:3000 — What's your first impression?
         Does the hero communicate the value prop in one sentence?
         
[ ] 2. Read the beta notice — Is it honest without being off-putting?
         Does it explain what's real vs. coming soon?

[ ] 3. Register a fresh @handle (not one you've used before)
         Is the form smooth? Any friction? Any confusing labels?
         Did the editToken save to localStorage automatically?

[ ] 4. View your new tip page immediately after registration
         Does the success banner feel celebratory?
         Is the "Verify social accounts →" call-to-action obvious?

[ ] 5. Run the verify flow for one platform (e.g. GitHub)
         Is the challenge-post concept explained clearly?
         Is the "trust-based in v0.4" disclaimer visible and honest?

[ ] 6. View your tip page again after adding a social proof
         Does the badge appear immediately?
         Does the badge link to your actual profile?

[ ] 7. Copy the BIP21 Ɍ50 quick-tip amount
         Paste it somewhere — does it look like a valid reddcoin: URI?

[ ] 8. Scan the QR code with your phone
         Does any wallet app recognize it?

[ ] 9. Go to /explore and search for your handle
         Does it appear? Does the card show your social badge?

[ ] 10. Open the Love Button popup on twitter.com
          Does it detect your handle (if you registered the same handle)?
          Do the social proof badges show correctly?

[ ] 11. Visit /reserve and /bridge
          Are they clearly labelled as demo/coming soon?
          Would you feel misled if you stumbled on them?

[ ] 12. Try /register on your phone (use mobile viewport if needed)
          Is the form usable without pinching to zoom?

[ ] 13. Try registering an invalid handle (e.g. --bad or a123456789012345678901234567890)
          Is the rejection message clear and helpful?

[ ] 14. Overall: Would you share this URL with a ReddHead today?
          What's the one thing that would stop you?

[ ] 15. What's the one thing that would most delight a creator discovering this?
```

**After the walkthrough:**
- File any issues in docs/GITHUB_ISSUES_NEXT.md (or GitHub Issues directly)
- Update VALIDATION_LOG.md with any failures found
- Note friction points — they become Sprint 1 polish tasks

---

## Known Issues at Test Time (2026-05-26)

| Issue | Impact | Status |
|-------|--------|--------|
| Social proof confirmation is trust-based | Tippers may see "verified" badge for unverified accounts | Disclosed on verify page; fix in v0.5 |
| Reserve and bridge pages show demo data | Could mislead about ReddRail status | Pages have banners; needs stronger label |
| editToken never expires | Security risk if token leaked | Sprint A priority |
| Rate limiting resets on restart | Abuse possible in production | Sprint A priority |
| No account deletion | User cannot remove themselves | Sprint A priority |
| Rate-limit error swallows validation message | If a user exhausts their registration quota (3/IP/hour), subsequent attempts show 'Too many registrations' even if the handle/address is invalid. UX impact: low — rare scenario, rate limit message is informative. | Intentional: security best practice to rate-limit before validation. |
