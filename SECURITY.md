# Security Policy — ReddID Next

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Email security reports to: **rarestaketech@gmail.com**

Use the subject line: `[SECURITY] ReddID Next — <short description>`

We aim to acknowledge reports within **48 hours** and provide an initial assessment within **5 business days**.

---

## Scope

Reports are welcome for the `reddid-web` repository (Next.js app). In-scope concerns include:

| Area | Examples |
|------|---------|
| **Authentication bypass** | Forging or bypassing the `editToken` check; editing another user's identity |
| **Injection** | SQL/NoSQL injection (if applicable), path traversal in the data layer |
| **Information disclosure** | Leaking `editToken`, `verificationChallenges`, `proofUrl`, or private wallet data in API responses |
| **Server-side request forgery** | Triggering requests to internal resources via Blockbook or other external calls |
| **RDD address manipulation** | Substituting or corrupting a stored wallet address |
| **Rate-limit bypass** | Circumventing registration, challenge-post, or recovery limits |
| **Challenge replay** | Reusing an expired or consumed verification challenge |
| **revocationKey bypass** | Forging or reusing a recovery key to illicitly reissue an editToken |

---

## Out of scope

The following are **not** considered security issues at this stage:

- Bugs in mock / demo surfaces (clearly labelled in the UI)
- Social engineering of the project team
- Denial-of-service attacks on a public demo instance
- Issues requiring physical access to the server
- Self-XSS (the attacker can only harm themselves)
- ReddCoin blockchain bugs (report to the ReddCoin core team)

---

## Important constraints

- **The server never stores private keys.** The identity model is intentionally non-custodial. If you find otherwise, that is a critical finding.
- **`editToken` is the primary authentication mechanism.** It is a 16-char hex secret shown once at registration. Tokens expire after 30 days; `POST /api/identities/[handle]/token` re-issues a new one. A separate `revocationKey` (64-char hex, shown once at registration, stored as a SHA-256 hash) allows recovery via `POST /api/identities/[handle]/recover` if the editToken is lost.
- **Data is stored in a flat JSON file in v0.4.** Writes are atomic (tmp → renameSync pattern). No database isolation between records; SQLite migration is planned (Sprint 4).

---

## No bug bounty

We do not currently offer monetary rewards. We will credit all responsible disclosures in the relevant release changelog entry with the reporter's preferred name/handle.

---

## Preferred contact

**Jay Laurence — Rare Stake Technology LLC**  
Email: rarestaketech@gmail.com  
GitHub: [@RareStakeTech](https://github.com/RareStakeTech)
