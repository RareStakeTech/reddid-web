# Security and Privacy — ReddWeb

**Last updated:** 2026-05-25  
**Status:** Prototype — some controls are designed but not yet fully implemented.

---

## Core Security Commitments

1. **No private keys stored.** This system never requests, stores, transmits, or processes private keys. Full stop.
2. **No fund custody.** ReddWeb does not hold, move, or control user funds. All payments happen in user-controlled wallets.
3. **No mandatory KYC.** Legal identity is never required. Pseudonymity is actively supported.
4. **Proofs, not assertions.** Wallet linkage and social proof use challenge-based verification, not admin grant.
5. **Revocation is a first-class operation.** Any identity, wallet, social proof, or agent can be revoked.
6. **Public disclosure of mock status.** All simulated or placeholder data is labeled explicitly.
7. **No surveillance identity.** The system is designed to store references and hashes, not raw PII, where possible.

---

## Threat Model

### Impersonation

**Risk:** Attacker registers `@elonmusk`, `@bitcoin`, or a handle that impersonates a known entity.

**Current mitigation:**
- Reserved handle list blocks obvious brand/celebrity names
- Identity type disclosure (human/creator/org) on public profiles
- Social proof verification links to third-party accounts

**Known gap:** The reserved list is not exhaustive. Famous individuals not in the reserved list can be impersonated. Future: community reporting + moderation.

---

### Handle squatting

**Risk:** Attacker registers handles to sell them or block legitimate users.

**Current mitigation:**
- Handle registration is free and permanent — no commercial incentive designed into the system
- Reserved handles block route paths and brand names
- No handle marketplace

**Known gap:** No anti-squatting enforcement beyond reserved list. Future: time-based activity requirements, community moderation.

---

### Fake social proof

**Risk:** User claims to own @realuser on Twitter without actually controlling that account.

**Current state:** v0.3 is trust-based. Users submit a URL where they claim to have posted the challenge code. The server does not verify the URL contains the code.

**Mitigation in place:** Proofs are labeled "Self-Reported" until auto-verified. Challenge codes are 8-char hex — not guessable by third parties. Proofs only affect the claiming user's profile, not the platform account itself.

**v0.4 target:** Platform API verification — scrape or query bio/recent posts for the challenge code.

---

### Replay attack on verification challenges

**Risk:** An old challenge code is reused to verify a different account or the same account again.

**Current mitigation:**
- Challenge codes expire after 8 hours (`expiresAt` field)
- Challenge is cleared from the record after successful confirmation
- Confirmation route checks `expiresAt` before accepting a proof

**Known gap:** No nonce or timestamp in the current challenge flow. A code posted publicly and not yet confirmed could theoretically be used by someone else if they know the target's handle and platform. Low practical risk for v0.3.

---

### Compromised editToken

**Risk:** Attacker obtains user's `editToken` from localStorage and modifies their profile.

**What they can do:** Change display name, bio, website; add/remove wallet addresses; add/remove social proofs.

**What they cannot do:** Change the handle (immutable); access funds (no custody); see other users' data.

**Mitigation:**
- editToken is stored in `localStorage`, not a cookie — not automatically sent with requests
- editToken is 16-char hex (~64 bits of entropy) — not guessable
- The server never returns editToken in GET responses
- `editTokenCreatedAt` stored for future rotation/expiry enforcement

**Recovery path (v0.3):** None. If editToken is lost, profile edits are blocked. Handle still receives tips at the registered address. Contact rarestaketech@gmail.com for manual reset.

**Documentation requirement:** All edit-gated UI must clearly warn: "Your edit token is stored in this browser only. There is no password recovery in this version."

---

### Malicious agent delegation

**Risk:** Identity owner creates an agent with too-broad permissions, or an agent key is compromised.

**Mitigation in place:**
- Agents have explicit `allowedActions` and `allowedRails` allowlists
- Spend limits (`perTxLimitRdd`, `dailyLimitRdd`, `monthlyLimitRdd`) constrain financial damage
- `humanApprovalThresholdRdd` requires owner approval above a threshold
- Agent revocation is a first-class operation — owner can revoke any agent immediately
- editToken is never used for agent operations (separate credential required)

**Known gap (v0.3):** Agent credentials (`controllerKey`) are stored but not cryptographically validated yet. Any request claiming to be from an agent is accepted if it has the parent editToken — this is a placeholder auth model for the prototype.

**v0.4 requirement:** Agent operations must use scoped, hashed, revocable credentials tied to the `controllerKey`. Parent editToken must not authorize agent actions.

---

### Payment status spoofing

**Risk:** Attacker fakes a payment confirmation to deceive the recipient.

**Current mitigation:**
- Payment intents have a `txid` field that must be set on confirmation
- MockRail intents are clearly labeled as mock
- The system does not auto-confirm payments — confirmation comes from blockchain verification (future) or manual update

**v0.4 target:** `NativeRddRail` adapter queries Blockbook to verify txid before confirming.

---

### Backend database tampering

**Risk:** The flat `data/db.json` file is directly readable and writable by anyone with server filesystem access.

**Current state:** Prototype-only. Single-process, no concurrent write protection. No encryption at rest.

**Mitigation:** Documented as prototype behavior. Production deployment must use Turso/Postgres with proper access controls.

---

### Privacy leakage via public API

**Risk:** The GET `/api/identities/[handle]` response accidentally exposes private data.

**Mitigation:**
- `publicIdentity()` serializer explicitly strips all private fields before any external response
- Wallet `visibility` filtering applied in serializer
- Social proof `visibility` filtering applied
- editToken, editTokenCreatedAt, verificationChallenges, revocationKey always stripped

---

### Rate limiting

**Current state:** No rate limiting on any route. This is a known prototype gap.

**Risk:** Spam registrations, challenge flooding, brute-force editToken guessing.

**Planned (v0.4):**
- In-memory per-IP rate limiter for registration: max 3 per hour
- Per-handle challenge limit: max 5 active challenges per day
- editToken attempt counter with exponential backoff

**Production target:** Redis-backed middleware or edge rate limiting.

---

## Security Checklist

### Implemented
- [x] Reserved handles block route paths and brand names
- [x] Challenge codes expire (8h, tracked via `expiresAt`)
- [x] Attempt counter on challenges (max 5)
- [x] `publicIdentity()` strips all private fields
- [x] editToken never returned in GET responses
- [x] RDD address format validation (legacy + SegWit)
- [x] Agent revocation as first-class operation
- [x] Soft-delete pattern for wallets, agents, proofs

### Partial / scaffold only
- [ ] editToken expiry enforcement — `editTokenCreatedAt` stored; expiry not enforced
- [ ] Nonce/timestamp in wallet signing challenges — fields designed, verification not implemented
- [ ] Agent credential validation — `controllerKey` stored; not cryptographically checked
- [ ] Rate limiting — in-memory placeholder; no Redis

### Not yet implemented
- [ ] Abuse/impersonation reporting endpoint
- [ ] Admin moderation surface
- [ ] Handle recovery mechanism
- [ ] Real wallet signature verification
- [ ] Social proof auto-verification (platform API)
- [ ] CSRF protection (low risk for this architecture; no session cookies)
- [ ] Audit logging for security-sensitive events

---

## Privacy Principles

1. **Minimal data collection.** Only store what the user explicitly provides and what the product requires.
2. **No legal identity required.** Handles are pseudonymous by design.
3. **Selective visibility.** Every wallet and social proof can be made private or unlisted.
4. **No analytics tracking.** No Google Analytics, no tracking pixels in this repo.
5. **No unnecessary PII.** No phone numbers, no email addresses, no government IDs.
6. **Separate public and private responses.** `publicIdentity()` enforces this boundary.
7. **Right to erasure.** Delete endpoint designed; manual process in prototype.

---

## What Data Is Stored

| Field | Stored | Notes |
|---|---|---|
| Handle | Yes | Public, permanent, lowercase |
| Display name | Yes | Optional, public |
| Bio | Yes | Optional, public, max 160 chars |
| Avatar URL | Yes | Optional, public, user-supplied URL only |
| Website | Yes | Optional, public |
| RDD wallet address | Yes | Public (if visibility = public) |
| Social proof username | Yes | Public (if visibility = public) |
| Social proof URL | Yes | URL of public post — already public |
| editToken | Yes (hashed?) | Never returned in GET. v0.3: stored as plain hex. Future: hash. |
| IP address | No | Not logged |
| Email address | No | Not collected |
| Private key | Never | Not requested, not stored |
| Agent spend limits | Yes | Private (not in public API) |
| Agent controller key | Yes | Private, future: verified |

---

## Privacy Checklist

### Implemented
- [x] `publicIdentity()` strips editToken, verificationChallenges, private wallets, private proofs
- [x] Wallet visibility field (public/unlisted/private)
- [x] Social proof visibility field
- [x] No cookies used
- [x] No analytics in codebase

### Designed / scaffold
- [ ] Data export endpoint — `GET /api/identities/[handle]/export` with editToken
- [ ] Delete/deactivate endpoint — `DELETE /api/identities/[handle]` with editToken
- [ ] Privacy page at `/privacy` (in-app)
- [ ] Terms of use at `/terms` (in-app)

### Deferred
- [ ] GDPR-compliant data processing record
- [ ] Cookie consent (no cookies currently needed)
- [ ] Third-party data processor agreements (CoinGecko, Blockbook are stateless queries)

---

## Responsible Disclosure

**Contact:** rarestaketech@gmail.com  
**Subject line:** `[SECURITY] ReddWeb — {brief description}`

**Response commitment:**
- Acknowledgment within 72 hours
- Assessment within 14 days
- Fix or mitigation within 90 days for confirmed vulnerabilities
- Credit given in CHANGELOG if desired

**In scope:**
- Authentication bypass
- editToken exposure
- Unauthorized profile modification
- Injection vulnerabilities
- Data exposure via API
- Agent permission bypass

**Out of scope:**
- Social engineering of end users
- Third-party services (CoinGecko, Blockbook)
- Denial of service
- Theoretical attacks requiring physical server access

**Please do not:** publicly disclose unpatched vulnerabilities, access production data beyond your own test account, or run automated scanners against production.
