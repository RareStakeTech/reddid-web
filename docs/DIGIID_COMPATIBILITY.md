# Digi-ID Compatibility — ReddID

**Last updated:** 2026-05-25
**Status:** Design only. Not implemented. Planned for v0.5.

---

## What Digi-ID is

Digi-ID is an open authentication protocol that uses wallet-signed QR codes to authenticate a user without a password. The user scans a QR code, their wallet signs a nonce with their private key, and the signature is sent to the server as proof of wallet control.

Key properties:
- No passwords
- No private keys leave the wallet
- No server-side secret storage
- Authentication is separate from payment
- Works with any wallet that implements the standard

Original spec: https://github.com/Digi-ID/Digi-ID

---

## Why ReddID cares about Digi-ID

1. **No-password login**: ReddID currently uses `editToken` in localStorage — a single device, single browser credential. Digi-ID would replace this with a cryptographic wallet-signed login that works across devices.
2. **Wallet proof without private keys**: The Digi-ID challenge-response flow is exactly what ReddID needs for `WalletOwnershipCredential` — prove you control an address without giving us anything sensitive.
3. **Standard protocol**: Implementing Digi-ID means any Digi-ID-compatible wallet can authenticate with ReddID without a custom integration.
4. **ReddCoin precedent**: ReddCoin Core already supports `verifymessage` (ECDSA), which is the cryptographic primitive Digi-ID uses.

---

## How Digi-ID works

```
1. Server generates a Digi-ID URI:
   digiid://redd.love/callback/login?x={nonce}&unsecure=0

2. Server encodes URI as QR code and displays it to the user

3. User opens their Digi-ID-compatible wallet and scans the QR code

4. Wallet shows the user: "Sign in to redd.love with address R..."
   User approves.

5. Wallet signs the URI with the private key corresponding to the address
   Signature = ECDSA(privateKey, sha256d(URI))

6. Wallet POSTs to the callback URL:
   { "uri": "digiid://...", "address": "Rxxx...", "signature": "..." }

7. Server verifies:
   - URI matches the expected challenge
   - Nonce is unused and not expired
   - ECDSA signature is valid for the address
   - (Optional) address is linked to a ReddID handle

8. Login is complete. Session token issued.
```

---

## ActionEnvelope mapping

The Digi-ID flow maps directly to an `ActionEnvelope`:

```typescript
const loginEnvelope: ActionEnvelope = {
  type: 'login',
  domain: 'redd.love',
  origin: 'https://redd.love',
  humanReadableSummary: 'Log in to redd.love with your RDD wallet — no password needed',
  payload: {
    callbackUrl: 'https://redd.love/api/auth/digiid/callback',
    digiidUri: 'digiid://redd.love/api/auth/digiid/callback?x=abc123',
  },
  nonce: 'abc123abc123abc1',
  expiresAt: /* +5 minutes */,
  requiredSigner: null, // any address (not pre-specified for login)
  signatureType: 'rdd-message',
  status: 'pending-signature',
};
```

For wallet-link (address proof), `requiredSigner` is set to the specific address being linked:

```typescript
const walletLinkEnvelope: ActionEnvelope = {
  type: 'wallet-link',
  humanReadableSummary: 'Prove you control Rxxxx...yyyy to link it to @alice',
  payload: { address: 'Rxxxx...yyyy' },
  requiredSigner: 'Rxxxx...yyyy',
  signatureType: 'rdd-message',
};
```

---

## Implementation plan (v0.5)

### What needs to be built

1. **`/api/auth/digiid/request`** — `GET ?handle=alice`
   - Generates a Digi-ID URI with a nonce
   - Creates a `login` `ActionEnvelope`
   - Returns the URI (for QR encoding)

2. **`/api/auth/digiid/callback`** — `POST`
   - Receives `{ uri, address, signature }`
   - Verifies signature using `reddcoinjs-lib` ECDSA
   - Validates nonce matches a pending `ActionEnvelope`
   - Issues session (or editToken for the matched handle)

3. **`SignatureVerifier` (real)**
   - `verify(message: string, address: string, signature: string): boolean`
   - Uses `reddcoinjs-lib` `verifyMessage` or equivalent

4. **QR code display**
   - The login page shows a Digi-ID QR
   - User scans with any compatible wallet
   - Page polls `/api/auth/digiid/status/{nonce}` until signed

### What is already compatible (no changes needed)

- `ActionEnvelope` type is already designed for this
- `WalletLink.proofType: 'signed-challenge'` is already defined
- `WalletLink.proofNonce` field exists for the nonce
- `WalletLink.proofSignature` field exists for the signature

---

## Fallback path

Digi-ID requires a compatible wallet. For users without one, the editToken (localStorage) remains available as a fallback. No user is forced to use Digi-ID.

For wallet-link proof, the fallback is `proofType: 'self-reported'` (current v0.4 behavior) with a `TrustLevel` of `self-reported`.

---

## ReddCoin wallet compatibility

ReddCoin Core supports `verifymessage` via the RPC interface. The implementation question is:
- Does the wallet also support Digi-ID QR scanning? (Requires wallet UI support)
- Does `reddcoinjs-lib` expose the ECDSA verify function in JavaScript? (Yes — it uses the bitcoin-secp256k1 implementation)

ReddCoin's address prefix (`0x3D`, prefix `R`) and the Digi-ID message format (`verifymessage` style) are compatible. The `SignatureVerifier` mock implementation already specifies the correct interface.
