# Trust Levels — ReddID Proof and Verification Model

**Last updated:** 2026-05-25
**Status:** TrustEvaluator typed and mocked. UI labels implemented.

---

## The problem this solves

Without a trust hierarchy, every social proof badge looks equally credible regardless of how it was verified. A user who typed their own Twitter handle looks identical to one who went through challenge-response verification. This is misleading.

ReddID distinguishes trust levels clearly in both the data model and the UI.

---

## Trust level definitions

| Level | Name | How it is earned | UI label |
|-------|------|-----------------|----------|
| 0 | `self-reported` | User asserts a claim with no mechanism to verify it | **Self-Reported** |
| 1 | `challenge-post-verified` | Server-generated challenge code confirmed as posted on the claimed platform | **Challenge Verified** |
| 2 | `wallet-signature-verified` | Cryptographic signature verified server-side against the claimed address | **Wallet Verified** |
| 3 | `community-attested` | Multiple community members have attested to this claim | **Community Attested** |
| 4 | `project-attested` | Signed by ReddCoin project or a named partner | **Project Attested** |
| 5 | `third-party-credentialed` | Issued by a recognized third-party verifier | **Externally Verified** |
| — | `disputed` | Claim has been flagged by multiple users | **Disputed** |
| — | `revoked` | Claim has been deliberately removed | **Revoked** |

---

## Current status by proof type

| Proof type | Trust level assigned | Notes |
|------------|---------------------|-------|
| Social proof — v0.3 trust-based | `self-reported` | User submits URL; server does not check it |
| Social proof — v0.4 challenge confirmed | `challenge-post-verified` | Server checks challenge code in post (future) |
| Wallet link — self-asserted | `self-reported` | User provides address; no signature |
| Wallet link — signed | `wallet-signature-verified` | ECDSA verifymessage (v0.5) |
| Agent authorization | `self-reported` | Parent identity issues; not independently verified |
| Creator credential | `project-attested` | System-generated on first tip confirmation |
| Community attestation | `community-attested` | Multiple signers required (v0.6+) |
| Mock/demo credential | `self-reported` | All mock-source credentials get lowest trust level |

---

## TrustEvaluator interface

```typescript
type TrustLevel =
  | 'self-reported'
  | 'challenge-post-verified'
  | 'wallet-signature-verified'
  | 'community-attested'
  | 'project-attested'
  | 'third-party-credentialed'
  | 'disputed'
  | 'revoked';

interface TrustEvaluator {
  evaluate(credential: Credential): TrustLevel;
  evaluateSocialProof(proof: SocialProof): TrustLevel;
  evaluateWallet(wallet: WalletLink): TrustLevel;
}
```

The `TrustEvaluator` is a pure function — it takes a record and returns a level. It does not make network calls.

---

## UI display rules

### What must be shown

- Every social proof badge must show its trust level. No badge may appear without a label.
- `self-reported` must be shown without any implication of verification.
- `challenge-post-verified` must include a note that the challenge was confirmed, not that the system verified the URL is currently live.
- `wallet-signature-verified` may show a checkmark, but must not say "verified identity" — it only confirms wallet control.
- `disputed` must show prominently. The user may not suppress it for public-visibility proofs.
- `revoked` proofs are not shown on public profiles (stripped by `publicIdentity()`).

### What must NOT be shown

- A generic "✓ Verified" badge without specifying what was verified
- Any implication that self-reported proofs are independently verified
- Wallet ownership as equivalent to identity verification
- A badge that implies the system has confirmed the user is who they say they are

### Display format (component: TrustBadge)

```
[platform icon] username  [SELF-REPORTED]     ← grey chip, no checkmark
[platform icon] username  [CHALLENGE VERIFIED] ← blue chip, shield icon
[platform icon] username  [WALLET VERIFIED]    ← green chip, checkmark icon
[platform icon] username  [PROJECT ATTESTED]   ← brand-red chip, star icon
[platform icon] username  [DISPUTED]           ← orange chip, warning icon
```

---

## Escalation path

When does a claim move to a higher trust level?

1. `self-reported` → `challenge-post-verified`: user completes challenge flow (v0.4 improvement; v0.5 auto-verify)
2. `self-reported` → `wallet-signature-verified`: user signs a nonce with their RDD wallet (v0.5)
3. `challenge-post-verified` → `project-attested`: project manually attests after independent review (v0.5+)
4. Any level → `disputed`: community flagging reaches threshold (v0.6+)
5. Any level → `revoked`: owner revokes proof, or moderation revokes it

Escalation cannot go down. Once a proof reaches `wallet-signature-verified`, it cannot be demoted to `challenge-post-verified` — revocation is the only downgrade path.

---

## Why not just use "verified" / "unverified"

Binary verified/unverified signals have a known failure mode: anything not labeled "unverified" looks "verified." The trust level system makes the gradation explicit and prevents dark patterns where a self-asserted claim appears equivalent to cryptographically proven ownership.

The UI spec does not use the word "Verified" alone. It always says what was verified and how.

---

## Non-discrimination principle

Trust levels are about the strength of a proof mechanism, not about the perceived credibility of a user. A low-trust-level proof from a public figure is still only `self-reported`. A high-trust-level proof from an unknown user is still `wallet-signature-verified`. Trust levels describe the mechanism, not the person.
