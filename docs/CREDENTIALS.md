# Credentials — ReddID Credential Model

**Last updated:** 2026-05-25
**Status:** Types defined. MockCredentialProvider. No W3C VC compliance yet.

---

## Purpose

A `Credential` is a structured, verifiable claim about a subject. In ReddID, credentials replace the flat `socialProofs[]` list and extend it to cover wallet ownership, creator status, agent authorization, community attestation, and tip receipts.

The goal is a model that can evolve toward W3C Verifiable Credentials without requiring full compliance today.

---

## What credentials replace and extend

| v0.3 (current) | v0.4+ (credential model) |
|----------------|--------------------------|
| `SocialProof` flat object | `SocialProofCredential` |
| `WalletLink.verified` boolean | `WalletOwnershipCredential` |
| Agent permission check in ad-hoc code | `AgentAuthorizationCredential` |
| No creator status record | `CreatorCredential` |
| No tip receipt | `TipReceiptCredential` |

---

## Core type

```typescript
interface Credential {
  id: string;
  type: string;                   // credential type identifier (see registry below)
  issuer: string;                 // handle or system issuer (e.g. "@alice", "reddid-system")
  subject: string;                // handle the credential is about
  claims: Record<string, unknown>; // type-specific claims
  proof: CredentialProof | null;  // null = self-asserted
  status: 'draft' | 'active' | 'suspended' | 'revoked' | 'expired';
  visibility: 'public' | 'unlisted' | 'private';
  issuedAt: string;
  expiresAt: string | null;
  revocationRef: string | null;   // pointer to RevocationEvent if revoked
  source: CredentialSource;
  trustLevel: TrustLevel;         // computed by TrustEvaluator
}

interface CredentialProof {
  type: 'none' | 'data-integrity' | 'jwt' | 'rdd-message' | 'evm-signature' | 'mock';
  verificationMethod: string | null; // address or pubkey that signed
  proofValue: string | null;
  createdAt: string;
}

type CredentialSource =
  | 'self-asserted'        // subject asserts their own claim
  | 'wallet-signature'     // proven via cryptographic signature
  | 'challenge-post'       // challenge code found in a public post
  | 'community-attestation' // signed by community members
  | 'project-attestation'  // signed by ReddCoin project or partner
  | 'third-party'          // external issuer
  | 'mock';                // prototype/demo — must be labeled
```

---

## Credential type registry

### WalletOwnershipCredential
**Claims:** `{ chain, address, proofType, verified }`
**Issued by:** self (subject = issuer)
**Source:** `wallet-signature` (when live), `self-asserted` (v0.4 MVP)
**Trust level:** `wallet-signature-verified` → `self-reported`

### SocialProofCredential
**Claims:** `{ platform, username, proofUrl, proofMethod }`
**Issued by:** self
**Source:** `challenge-post` (when code confirmed), `self-asserted` (v0.3 flow)
**Trust level:** `challenge-post-verified` → `self-reported`

### CreatorCredential
**Claims:** `{ identityType, firstTipAt, tipCount, registeredAt }`
**Issued by:** reddid-system (generated on first tip receipt)
**Source:** `project-attestation`
**Trust level:** `project-attested`

### ReddHeadContributorCredential
**Claims:** `{ contribution, evidenceUrl }`
**Issued by:** project (rarestaketech handle)
**Source:** `project-attestation`
**Trust level:** `project-attested`
**Note:** Not transferable — non-transferable in the soulbound sense; holder cannot sell or assign it

### AgentAuthorizationCredential
**Claims:** `{ agentId, agentSlug, allowedActions, allowedRails, expiresAt }`
**Issued by:** parent identity
**Source:** `self-asserted` (editToken creates agent)
**Trust level:** `self-reported`
**Note:** This is the machine-readable form of the AgentIdentity record

### AgentRevocationCredential
**Claims:** `{ agentId, revokedAt, revokedReason }`
**Issued by:** parent identity
**Source:** `self-asserted`
**Note:** Complements RevocationEvent; provides portable proof that agent was revoked

### TipReceiptCredential
**Claims:** `{ fromHandle, toHandle, amount, asset, rail, txid, confirmedAt }`
**Issued by:** reddid-system
**Source:** `project-attestation` (on confirmed PaymentIntent)
**Privacy:** `private` by default — only shared via Presentation

### BridgeReserveAttestationCredential
**Claims:** `{ reserveAddress, nativeRddBalance, backingRatio, attestedAt }`
**Issued by:** reddid-system (future)
**Source:** `project-attestation`
**Status:** Reserved — not issued until bridge is live

### CommunityModerationCredential
**Claims:** `{ action, targetHandle, reason, moderatorCount }`
**Issued by:** community (multiple attestors)
**Source:** `community-attestation`
**Status:** Reserved — needs moderation surface (v0.6+)

---

## Soulbound-style credentials

Some credentials are intentionally non-transferable:
- `ReddHeadContributorCredential` — recognises real contribution; cannot be sold
- `AgentAuthorizationCredential` — bound to a specific agent; cannot be transferred to a different agent
- `CommunityModerationCredential` — bound to the moderation event; cannot be reassigned

Non-transferability is enforced by binding the credential's `subject` field to a specific handle and making the credential server-signed with a claim that explicitly names the subject.

There is no on-chain enforcement in the MVP. Non-transferability is an application-layer convention backed by the issuer's signature.

---

## W3C VC compatibility path

The credential model is designed so that migration to W3C Verifiable Credentials is additive:
- `CredentialProof.type: 'data-integrity'` maps to W3C Data Integrity Proofs
- `CredentialProof.type: 'jwt'` maps to JWT-VC
- `issuer` field will accept DID strings when a DID resolver is added
- `claims` field maps to W3C `credentialSubject`
- `status` field maps to W3C `credentialStatus`
- `expiresAt` maps to W3C `expirationDate`

To enable full W3C VC compliance: implement `W3CCredentialAdapter` that wraps `Credential` in the W3C envelope. No other changes required.

---

## CredentialProvider interface

```typescript
interface CredentialProvider {
  issue(input: IssueCredentialInput): Credential;
  get(id: string): Credential | null;
  getBySubject(handle: string): Credential[];
  revoke(id: string, reason: string): Credential;
  verify(credential: Credential): VerificationResult;
}
```

Current implementation: `MockCredentialProvider` — stores credentials in memory (future: in db.json under identity records), issues with `source: 'self-asserted'` and `proof.type: 'mock'`.

---

## Privacy model

- `visibility: 'private'` credentials are never returned in public API responses
- `visibility: 'unlisted'` credentials can be presented but are not listed on the public profile
- `visibility: 'public'` credentials appear on the public profile page
- Credential contents are only revealed via explicit `Presentation` (selective disclosure)

---

## Storage in MVP

For MVP, credentials are stored as `credentials?: Credential[]` on the `Identity` record in `db.json`. Production: separate credentials table indexed by subject handle.
