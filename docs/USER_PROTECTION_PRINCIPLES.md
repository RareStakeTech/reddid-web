# User Protection Principles — ReddID

**Last updated:** 2026-05-25
**Status:** Active policy — applies to all v0.x development.

These principles protect users' interests, rights, identity, privacy, and income. They are not aspirational. They are binding constraints on what this system builds, claims, and ships.

---

## 1. No private keys in the backend

The server never requests, stores, processes, or transmits private keys. This is not a configuration option. It is a hard boundary.

Wallet ownership is proven via challenge-response, not by handing keys to the server.

---

## 2. No mandatory KYC

Legal identity is never required to use ReddID. Handles are pseudonymous by design. A user's legal name, government ID, phone number, or location is never collected by this system.

Voluntary disclosure (display name, website) is the user's choice.

---

## 3. No hidden live/mocked boundary

Every surface that shows simulated, mocked, or placeholder data must carry a visible label. Users must never be able to mistake a demo for reality.

Required labels: see `docs/PRODUCT_SPEC.md § Mock/Demo Surfaces`.

---

## 4. No fake verification

Self-reported proofs are labeled "Self-Reported." Challenge-verified proofs are labeled "Challenge Verified." Nothing is labeled "Verified" unless a verification step that the user did not control has been executed server-side.

An identity owner asserting their own claim is not independent verification.

---

## 5. No opaque signing

Users are never asked to sign an opaque blob without a human-readable summary of what they are approving. Every `ActionEnvelope` must include a `humanReadableSummary` field.

This applies to wallet-link proofs, agent authorization, payment requests, login challenges, and revocations.

---

## 6. No agent authority without explicit limits

Agents have scoped, bounded permissions. They cannot spend beyond their `perTxLimitRdd`, `dailyLimitRdd`, or `monthlyLimitRdd`. They cannot act on platforms not listed in `allowedRails`. They cannot reach recipients not in `allowedRecipients` (if that list is set).

An editToken never authorizes agent actions. Agent operations require a separate scoped credential.

---

## 7. No irreversible public identity harm

Revoked identities are disclosed as revoked — not silently deleted and not permanently doxxed. The public revocation record shows that a handle was revoked and the stated reason, but does not display the underlying wallet addresses or payment history.

Handles of revoked identities are reserved — they cannot be re-registered to prevent squatting on known names.

---

## 8. No custodial bridge claims before a real custody model exists

The reserve dashboard shows `isLive: false` until a real reserve indexer is running. The bridge page is labeled "Concept Only." No UI element implies users can deposit, withdraw, or transfer funds through ReddBridge until the real custody model exists and has been audited.

---

## 9. Users can export their identity data

Users have a right to their own data. The `GET /api/identities/[handle]/export` endpoint (v0.5) returns all identity data — including private fields — when the correct editToken is provided.

No exported field may be stripped or modified. The export must be machine-readable and human-readable.

---

## 10. Users can revoke agents and credentials

Any agent or credential created by a user can be revoked by that user at any time. Revocation is effective immediately. The revocation is permanent — once revoked, an agent cannot be re-activated (a new agent must be created).

---

## 11. Users can receive tips without installing anything

The fallback tip path — scan QR, copy address, open in wallet — must always be available. No feature that removes the fallback QR/copy-address path is acceptable.

Browser extension, mobile app, and ReddRail are enhancements, not requirements.

---

## 12. Users control what profile data is public

Every wallet and social proof has a `visibility` field (`public` / `unlisted` / `private`). The `publicIdentity()` serializer enforces this — private and unlisted data never appears in public API responses.

The user may change visibility at any time via the edit flow.

---

## 13. Creator income should not depend on platform lock-in

A creator registered on ReddID can receive tips from any compatible wallet by sharing a URL, a QR code, a BIP21 link, or a handle. Nothing about this system creates dependency on a specific platform or exchange.

The Love Button extension is optional. ReddRail is optional. The base case is always native RDD to a published address.

---

## 14. Payment requests must be readable

A payment request (`PaymentIntent` or `ActionEnvelope` of type `payment-request`) must show the recipient handle, amount, asset, and rail in plain language before the user takes action. No payment request may require a user to trust an opaque identifier.

---

## 15. Agent actions must be attributable to parent authorization

Every action taken by an agent must be traceable to:
- The parent handle that created the agent
- The `allowedActions` and `allowedRails` that were set at agent creation time
- The specific `AgentIdentity.id` that authorized the action

Agents cannot self-expand their permissions. Agents cannot create other agents.

---

## Enforcement

These principles are enforced through:
- TypeScript types that make violations compile-time errors where possible
- The `publicIdentity()` serializer (strips private fields automatically)
- The `PolicyEngine` (checks all agent constraints before any action)
- The `RevocationRegistry` (permanent, auditable revocation log)
- Required visible labels on all mock/demo surfaces
- Documentation that explicitly calls out gaps

Any code change that violates these principles must be flagged in PR review.

---

## Relationship to Security and Privacy

This document covers user-facing protection commitments. For technical threat modeling, see `docs/SECURITY_PRIVACY.md`. For the full data model, see `docs/IDENTITY_MODEL.md`.
