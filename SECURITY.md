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
| **Information disclosure** | Leaking `editToken`, `verificationChallenges`, or private wallet data in API responses |
| **Server-side request forgery** | Triggering requests to internal resources via Blockbook or other external calls |
| **RDD address manipulation** | Substituting or corrupting a stored wallet address |
| **Rate-limit bypass** | Circumventing registration or challenge-post limits |
| **Challenge replay** | Reusing an expired or consumed verification challenge |

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
- **`editToken` is the only authentication mechanism.** It is a 16-char hex secret shown once at registration. Loss of the token means loss of edit access (no reset path in v0.4).
- **Data is stored in a flat JSON file in v0.4.** There is no database isolation between records. Concurrent-write bugs are a known limitation (D2 — SQLite migration planned).

---

## No bug bounty

We do not currently offer monetary rewards. We will credit all responsible disclosures in the relevant release changelog entry with the reporter's preferred name/handle.

---

## Preferred contact

**Jay Laurence — Rare Stake Technology LLC**  
Email: rarestaketech@gmail.com  
GitHub: [@RareStakeTech](https://github.com/RareStakeTech)
