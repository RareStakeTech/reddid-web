/**
 * Core domain types for ReddID Next.
 *
 * schemaVersion 1: original prototype — single rddAddress string
 * schemaVersion 2: wallets[], identityType, agents[], revocation (THIS FILE)
 *
 * Additive design: all new v2 fields are optional on the stored type so v1
 * records continue to parse correctly before migration runs.
 *
 * Full spec: docs/IDENTITY_MODEL.md
 */

// ── Shared ────────────────────────────────────────────────────────────────────

export type VisibilityLevel = 'public' | 'unlisted' | 'private';

// ── Identity type ─────────────────────────────────────────────────────────────

export type IdentityType =
  | 'human'        // default for individual human registrations
  | 'creator'      // content creator — emphasises tipping
  | 'organization' // company, project, DAO
  | 'bot'          // automated non-AI script
  | 'ai-agent'     // LLM/ML-backed agent
  | 'service';     // API service or infrastructure

// ── WalletLink ────────────────────────────────────────────────────────────────

export type ChainType = 'rdd' | 'bsc' | 'base' | 'gajumaru' | 'other';
export type WalletPurpose = 'receive' | 'tipping' | 'bridge' | 'agent' | 'watch-only';
export type WalletProofType = 'none' | 'signed-challenge' | 'self-reported';

export interface WalletLink {
  id: string;
  chain: ChainType;
  address: string;
  label: string | null;             // user-supplied name, e.g. "Hot wallet"
  purpose: WalletPurpose;
  visibility: VisibilityLevel;
  proofType: WalletProofType;
  proofSignature: string | null;    // future: ECDSA / ed25519 signature
  proofNonce: string | null;        // future: replay-prevention nonce
  verified: boolean;                // true only if signature verified server-side
  primary: boolean;                 // one primary per chain per identity
  addedAt: string;
  revokedAt: string | null;         // soft-delete
}

// ── SocialProof ───────────────────────────────────────────────────────────────

export type ProofMethod =
  | 'challenge-post'   // user posts 8-char hex challenge code publicly
  | 'signed-message'   // user signs with platform keypair (future)
  | 'dns-txt'          // DNS TXT record (future, for websites)
  | 'self-reported';   // no verification mechanism

export type VerificationStatus =
  | 'pending'   // challenge issued, not yet confirmed
  | 'verified'  // proof confirmed (trust-based for now; API-verify in v0.5)
  | 'failed'    // confirmation attempted and rejected
  | 'expired'   // challenge expired without confirmation
  | 'revoked';  // deliberately removed by owner

export interface SocialProof {
  id?: string;                       // generated; absent in v1 records
  platform: string;
  username: string;
  proofMethod?: ProofMethod;         // absent in v1 records → treat as 'self-reported'
  proofUrl: string | null;
  proofSignature?: string | null;    // future: cryptographic signature
  verificationStatus?: VerificationStatus; // absent in v1 → treat as 'verified'
  verifiedAt?: string | null;
  recheckAfter?: string | null;      // future: scheduled re-verification
  visibility?: VisibilityLevel;      // absent in v1 → treat as 'public'
  addedAt: string;
}

// ── VerificationChallenge ─────────────────────────────────────────────────────

export interface VerificationChallenge {
  code: string;       // 8-char hex, e.g. "a1b2c3d4"
  platform: string;
  createdAt: string;
  expiresAt: string;  // createdAt + 8 hours
  attempts: number;   // max 5 before rate-limiting
}

// ── AgentIdentity ─────────────────────────────────────────────────────────────

export type AgentType =
  | 'bot'             // automated non-AI script
  | 'ai-agent'        // LLM/ML-backed agent
  | 'service'         // API service or infrastructure
  | 'automation'      // scheduled or event-driven automation
  | 'human-delegate'  // another human acting on behalf of the owner
  | 'org-delegate';   // organisational sub-entity

export const AGENT_ACTIONS = [
  'tip',            // initiate payment intents up to per-tx limit
  'read-profile',   // read public identity profiles
  'post-proof',     // submit social proof on parent's behalf
  'create-intent',  // create payment intents (may require human approval)
  'read-balance',   // query wallet balance info
] as const;

export type AgentAction = (typeof AGENT_ACTIONS)[number];

export type PaymentRailId =
  | 'native-rdd'
  | 'bsc-wrdd'
  | 'base-wrdd'
  | 'gajumaru-rail'
  | 'mock';

export interface AgentIdentity {
  id: string;
  parentHandle: string;
  agentSlug: string;
  displayHandle: string;        // @parent.agentSlug — display-only, not registerable
  agentType: AgentType;
  displayPurpose: string;       // public description, max 200 chars

  // ── Authorization ──────────────────────────────────────────────────────────
  controllerKey: string | null; // pubkey that can authenticate as this agent
  allowedActions: AgentAction[];
  allowedRails: PaymentRailId[];

  // ── Spend limits (private — not exposed in public API) ────────────────────
  perTxLimitRdd: number | null;
  dailyLimitRdd: number | null;
  monthlyLimitRdd: number | null;
  allowedRecipients: string[] | null; // handle allowlist (null = any registered)
  humanApprovalThresholdRdd: number | null;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  expiresAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  activityLogRef: string | null; // future: pointer to activity log

  createdAt: string;
}

// ── PaymentIntent ─────────────────────────────────────────────────────────────

export type PaymentAsset = 'rdd' | 'wrdd-bsc' | 'wrdd-base' | 'rdd-rail';

export type PaymentStatus =
  | 'draft'      // created but not yet shared
  | 'requested'  // shared with payer, awaiting action
  | 'signed'     // payer has signed the tx
  | 'submitted'  // tx broadcast to network
  | 'confirmed'  // tx confirmed on-chain
  | 'failed'
  | 'cancelled'
  | 'expired';   // expiresAt passed without action

export interface PaymentIntent {
  id: string;
  fromHandle: string | null;    // null = anonymous tip
  toHandle: string;
  toAddress: string;            // snapshot of primary wallet at creation time
  amount: number;               // in RDD units (not satoshis)
  asset: PaymentAsset;
  rail: PaymentRailId;
  memo: string | null;          // max 160 chars
  platform: string | null;      // originating context (twitter, kick, etc.)
  agentId: string | null;       // if created by an agent
  status: PaymentStatus;
  requiresApproval: boolean;    // true if above agent's humanApprovalThreshold
  approvedAt: string | null;
  txid: string | null;
  externalRef: string | null;
  createdAt: string;
  expiresAt: string;            // createdAt + 24h default
  updatedAt: string;
}

// ── Identity (v1 + v2) ────────────────────────────────────────────────────────

export interface Identity {
  // ── Identifiers ────────────────────────────────────────────────────────────
  id: string;
  handle: string;

  // ── Profile ────────────────────────────────────────────────────────────────
  identityType?: IdentityType;       // [v2] absent in v1 → treat as 'human'
  displayName: string | null;
  bio: string | null;
  avatar?: string | null;            // [v2] URL string; never server-fetched
  website: string | null;
  publicSigningKey?: string | null;  // [v2] future: ed25519 pubkey hex

  // ── Wallet linkage ──────────────────────────────────────────────────────────
  /** @deprecated v1 field. Use wallets[] in v2. Retained for migration and fallback. */
  rddAddress?: string;
  wallets?: WalletLink[];            // [v2] canonical wallet list

  // ── Social proofs ───────────────────────────────────────────────────────────
  socialProofs: SocialProof[];

  // ── Agent delegation ────────────────────────────────────────────────────────
  parentHandle?: string | null;      // [v2] null = root identity
  agents?: AgentIdentity[];          // [v2] child agent records

  // ── Revocation ─────────────────────────────────────────────────────────────
  revocationKey?: string | null;     // [v2]
  revokedAt?: string | null;         // [v2]
  revokedReason?: string | null;     // [v2]

  // ── Authentication ──────────────────────────────────────────────────────────
  editToken: string;
  editTokenCreatedAt?: string;       // [v2]
  verificationChallenges: Record<string, string>; // platform → challenge code (v1 format)

  // ── Metadata ───────────────────────────────────────────────────────────────
  createdAt: string;
  updatedAt: string;
  schemaVersion?: number;            // absent → v0; 1 = tagged; 2 = expanded
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive the primary RDD address from an identity or any object with wallet fields.
 * Works across both v1 (rddAddress) and v2 (wallets[]).
 * Accepts a partial identity so it can be called on publicIdentity() return values.
 */
export function primaryRddAddress(
  identity: { wallets?: WalletLink[]; rddAddress?: string },
): string | null {
  // v2 path: use wallets[]
  if (identity.wallets && identity.wallets.length > 0) {
    const primary = identity.wallets.find(
      w => w.chain === 'rdd' && w.primary && !w.revokedAt,
    );
    if (primary) return primary.address;
  }
  // v1 fallback: use rddAddress directly
  return identity.rddAddress ?? null;
}

// ── Input shapes ──────────────────────────────────────────────────────────────

export interface CreateIdentityInput {
  handle: string;
  displayName?: string;
  rddAddress: string;
  bio?: string;
  website?: string;
  identityType?: IdentityType;
}

export interface UpdateIdentityInput {
  displayName?: string;
  bio?: string;
  website?: string;
  identityType?: IdentityType;
  avatar?: string;
}

// ── Reserve ───────────────────────────────────────────────────────────────────

export interface ReserveSnapshot {
  nativeRddReserve: number;
  pendingRedemptions: number;
  backingAvailable: number;
  totalRepresented: number;
  backingRatio: number | null;
  lastUpdated: string;
  reserveAddresses: { address: string; label: string }[];
  isLive: boolean;
}

// ── Internal DB schema ────────────────────────────────────────────────────────

export interface DbSchema {
  identities: Identity[];
  version: number;
}
