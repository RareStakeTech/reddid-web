/**
 * Core domain types for ReddID Next.
 *
 * This is v1 — the minimal prototype model.
 * v2 types (wallets[], agents, revocation, visibility) are defined in
 * docs/IDENTITY_MODEL.md and will be added in the Commit 4 expansion.
 */

// ── Identity ──────────────────────────────────────────────────────────────────

export interface Identity {
  id: string;
  handle: string;
  displayName: string | null;
  /** v1 single-address field. v2 replaces this with wallets[]. */
  rddAddress: string;
  bio: string | null;
  website: string | null;
  socialProofs: SocialProof[];
  /** 16-char hex token — authorises profile edits. Never returned in GET responses. */
  editToken: string;
  /** platform → 8-char hex challenge code, pending proof submission */
  verificationChallenges: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  /** Schema version: 1 = v1 (this model). 2 = v2 with wallets[], agents, etc. */
  schemaVersion?: number;
}

// ── Social proof ──────────────────────────────────────────────────────────────

export interface SocialProof {
  platform: string;
  username: string;
  proofUrl: string | null;
  addedAt: string;
}

// ── Input shapes ──────────────────────────────────────────────────────────────

export interface CreateIdentityInput {
  handle: string;
  displayName?: string;
  rddAddress: string;
  bio?: string;
  website?: string;
}

export interface UpdateIdentityInput {
  displayName?: string;
  bio?: string;
  website?: string;
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
