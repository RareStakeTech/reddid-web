# Revocation — ReddID Revocation Model

**Last updated:** 2026-05-25
**Status:** RevocationRegistry typed and mocked. Soft-delete pattern implemented.

---

## Principle

Revocation is a first-class operation in ReddID. It is not a delete. It is a permanent, auditable event that changes the status of a record from active to revoked.

**Why not delete?**
- Deletion loses the audit trail
- Silent deletion allows the appearance of never having existed
- Revocation makes the event public and attributable
- Recipients of tips/payments need to know if the receiving identity was compromised

---

## What can be revoked

| Target type | Who can revoke | What happens |
|-------------|---------------|-------------|
| `identity` | Holder of `revocationKey` | Profile shows revocation banner; wallets hidden; no new payment intents |
| `wallet` | Identity owner (editToken) | Wallet soft-deleted; `revokedAt` set; not shown publicly |
| `social-proof` | Identity owner (editToken) | Proof status → `revoked`; removed from public profile |
| `credential` | Issuer or credential holder | Status → `revoked`; `revocationRef` points to RevocationEvent |
| `agent` | Parent identity (editToken) | Agent `revokedAt` set; all pending actions fail; not in public list |
| `payment-intent` | Payee (editToken) or agent | Intent status → `cancelled`; no new submissions accepted |
| `action-envelope` | Creator of envelope | Envelope status → `cancelled`; signature not accepted if submitted |

---

## RevocationEvent type

```typescript
interface RevocationEvent {
  id: string;
  targetType: 'identity' | 'wallet' | 'social-proof' | 'credential' | 'agent' | 'payment-intent' | 'action-envelope';
  targetId: string;           // id of the revoked record
  targetHandle: string;       // the ReddID handle this event concerns
  revokedBy: string;          // handle or system component that issued the revocation
  reason: string;             // public reason string (max 200 chars)
  createdAt: string;
  visibility: 'public' | 'private';
}
```

---

## Visibility model for revocation

| Visibility | Who sees it |
|------------|-------------|
| `public` | Anyone — appears on the relevant public profile |
| `private` | Only the identity owner (via editToken-gated API) |

Default visibility by target type:
- `identity` revocation: always `public` (users need to know)
- `wallet` revocation: `private` (implementation detail of key rotation)
- `social-proof` revocation: `public` (other users linked to this proof should know)
- `credential` revocation: depends on credential visibility
- `agent` revocation: `public` (any user interacting with that agent should know)
- `payment-intent` cancellation: `private` (between the parties only)

---

## Identity revocation consequences

When an identity is revoked:
1. Public profile shows: "This identity has been revoked. [reason] [revokedAt]"
2. Wallet addresses are hidden from the public profile (prevent reuse on a revoked name)
3. All agents under this identity are implicitly revoked
4. No new `PaymentIntent` can be created for this handle
5. The handle is permanently reserved — cannot be re-registered
6. Social proofs remain in the record but are not shown publicly
7. All `AgentIdentity` records under this identity have `revokedAt` set

What is still shown:
- Handle (to confirm it was registered)
- Revocation timestamp
- Revocation reason (if `visibility: 'public'`)

What is never shown after revocation:
- Wallet addresses (to prevent "go send money to this revoked identity" attacks)
- editToken (always)
- Private fields (always)

---

## Agent revocation consequences

When an agent is revoked:
1. Agent no longer appears in `/[handle]/agents` public listing
2. Any pending `ActionEnvelope` with `agentId` set to this agent is cancelled
3. Any pending `PaymentIntent` created by this agent is cancelled
4. New requests claiming to be from this agent are rejected by `PolicyEngine`
5. The revocation is logged in `RevocationRegistry`
6. The agent record retains `revokedAt` and `revokedReason` in storage (audit trail)

---

## Social proof revocation consequences

When a social proof is revoked:
1. The proof's `verificationStatus` → `'revoked'`
2. The proof is removed from `publicIdentity()` output
3. A `RevocationEvent` is created (if visibility = 'public')
4. The underlying social account is not affected (we don't control it)
5. The user may add the same platform again with a new proof

---

## Wallet revocation consequences

When a wallet is revoked:
1. `WalletLink.revokedAt` set to current timestamp
2. Wallet is removed from `publicIdentity()` output
3. If it was the `primary` wallet, the `primaryRddAddress()` function returns null
   → UI shows "No active receiving address" on the public profile
4. A new wallet of the same chain must be promoted to primary before another wallet can be revoked

---

## Permanent vs. cancellable revocations

| Type | Permanent? | Notes |
|------|-----------|-------|
| Identity revocation | Yes | Handle never freed; cannot be un-revoked |
| Agent revocation | Yes | Cannot re-activate; create a new agent |
| Credential revocation | Yes | Use `status: 'revoked'`; cannot be reversed |
| Wallet revocation | Yes | Add a new wallet instead |
| Social proof revocation | Yes | Add a new proof for the same platform |
| Payment intent cancellation | No (soft) | Intent is cancelled; new one can be created |
| Action envelope cancellation | No (soft) | Envelope invalid; new one can be created |

---

## RevocationRegistry interface

```typescript
interface RevocationRegistry {
  record(event: Omit<RevocationEvent, 'id' | 'createdAt'>): RevocationEvent;
  getByTarget(targetId: string): RevocationEvent | null;
  getByHandle(handle: string): RevocationEvent[];
  isRevoked(targetId: string): boolean;
}
```

Current implementation: `MockRevocationRegistry` — stores events in `db.json` as a top-level `revocationEvents: RevocationEvent[]` array.

---

## Recovery

In v0.3, there is no automated recovery path.

Planned (v0.5):
- `revocationKey` field on Identity allows a pre-registered key to sign a revocation
- Handle recovery: if a user loses their editToken but has the revocationKey private key, they can revoke and re-register under a new handle (the old handle remains reserved)
- Key rotation: a new editToken can be issued via a signed recovery envelope

See `docs/SECURITY_PRIVACY.md § Compromised editToken` for current manual process.
