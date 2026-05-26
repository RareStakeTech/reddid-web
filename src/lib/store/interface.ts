/**
 * DataStore — abstract interface for all persistence operations.
 *
 * Current implementation: JsonFileDataStore (flat JSON, single-process).
 * Future implementations: TursoDataStore (LibSQL), PostgresDataStore.
 *
 * All API routes and server components must go through getStore() —
 * never import JsonFileDataStore directly.
 *
 * Sprint 1 additions (2026-05-26):
 *  - createIdentity() now returns { identity, revocationKeyPlaintext } (S1-06)
 *  - reissueToken() — rotate editToken (S1-01)
 *  - deleteIdentity() — self-service account removal (S1-02)
 *  - exportIdentity() — GDPR data export (S1-03)
 *  - recoverByRevocationKey() — emergency access recovery (S1-06)
 */

import type {
  Identity,
  SocialProof,
  AgentIdentity,
  WalletLink,
  CreateIdentityInput,
  UpdateIdentityInput,
  CreateAgentInput,
  ReserveSnapshot,
  StoredAbuseReport,
  ProofMethod,
} from '@/lib/types';
import type { AddWalletInput } from '@/lib/providers/wallet-link-provider';

export interface DataStore {
  // ── Identity queries ────────────────────────────────────────────────────────
  getIdentityByHandle(handle: string): Identity | null;
  getIdentityByAddress(rddAddress: string): Identity | null;
  /**
   * Find by a linked social platform + username.
   * Falls back to handle === username if no explicit social proof match.
   */
  getIdentityBySocial(platform: string, username: string): Identity | null;
  getAllIdentities(): Identity[];
  countIdentities(): number;

  // ── Identity mutations ──────────────────────────────────────────────────────

  /**
   * Create a new identity.
   * Returns the stored Identity AND the plaintext revocationKey.
   * The plaintext is shown to the user exactly once and never stored.
   * The SHA-256 hash is persisted in identity.revocationKey.
   */
  createIdentity(
    input: CreateIdentityInput,
  ): { identity: Identity; revocationKeyPlaintext: string };

  updateIdentity(
    handle: string,
    editToken: string,
    updates: UpdateIdentityInput,
  ): Identity;

  /**
   * Rotate the editToken. Accepts expired tokens (otherwise the user couldn't
   * recover from expiry). Still rejects wrong tokens.
   */
  reissueToken(
    handle: string,
    editToken: string,
  ): { editToken: string; expiresAt: string };

  /**
   * Hard-delete an identity. editToken must be valid and non-expired.
   * Logs a RevocationEvent before deletion for audit purposes.
   */
  deleteIdentity(handle: string, editToken: string): void;

  /**
   * Return a full copy of the identity's stored data.
   * revocationKey hash is omitted (internal security data).
   * editToken IS included — it's the user's own credential.
   */
  exportIdentity(handle: string, editToken: string): Omit<Identity, 'revocationKey'>;

  /**
   * Verify the revocationKey plaintext and issue a new editToken.
   * Use when the user has lost their editToken.
   * The revocationKey is NOT rotated — user may need it again.
   */
  recoverByRevocationKey(
    handle: string,
    revocationKey: string,
  ): { editToken: string; expiresAt: string };

  // ── Social proofs ──────────────────────────────────────────────────────────
  /**
   * Generate (or regenerate) a verification challenge code.
   * Returns the code and its expiry so the UI can display a countdown.
   */
  createVerificationChallenge(
    handle: string,
    platform: string,
    editToken: string,
  ): { code: string; expiresAt: string };
  /**
   * Record a social proof after the user claims to have posted the challenge.
   *
   * proofMethod controls the stored trust level:
   *  - 'challenge-post' (default) — trust-based; user submitted a URL but it
   *    was not fetched. TrustBadge renders as 'Post Verified'.
   *  - 'url-fetch-verified' — server fetched proofUrl and confirmed the
   *    challenge code appears in the response. TrustBadge renders as 'URL Verified'.
   *
   * S3-01: route now calls fetchProofUrl() before invoking this method and
   * passes the appropriate proofMethod.
   */
  confirmSocialProof(
    handle: string,
    platform: string,
    username: string,
    proofUrl: string,
    editToken: string,
    proofMethod?: ProofMethod,
  ): Identity;
  addSocialProof(
    handle: string,
    proof: Omit<SocialProof, 'addedAt'>,
  ): Identity;

  /**
   * Set verificationStatus='revoked' on a social proof.
   * The record is kept for audit but hidden from publicIdentity().
   */
  removeSocialProof(handle: string, platform: string, editToken: string): Identity;

  // ── Agent management ────────────────────────────────────────────────────────
  /**
   * Create a new agent attached to a parent identity.
   * editToken must belong to the parent — never the agent.
   * Max 10 agents per parent in MVP.
   */
  createAgent(
    parentHandle: string,
    editToken: string,
    input: CreateAgentInput,
  ): AgentIdentity;

  /** Returns all non-revoked agents for a parent handle. */
  getAgents(parentHandle: string): AgentIdentity[];

  /**
   * Revoke an agent (sets revokedAt, revokedReason).
   * Does not delete the record — revocation is permanent and auditable.
   */
  revokeAgent(
    parentHandle: string,
    agentId: string,
    editToken: string,
    reason: string,
  ): AgentIdentity;

  // ── Wallet management ───────────────────────────────────────────────────────
  /**
   * Add a wallet to an identity. editToken required.
   * Throws DUPLICATE_ADDRESS if same address+chain already linked.
   * Throws WALLET_LIMIT if identity already has 20 wallets.
   */
  addWallet(handle: string, editToken: string, input: AddWalletInput): WalletLink;

  /**
   * Remove a wallet entry by walletId. editToken required.
   * Throws LAST_WALLET if this is the only remaining wallet.
   */
  removeWallet(handle: string, editToken: string, walletId: string): void;

  /**
   * Set a wallet as primary for its chain. Clears primary=true on siblings.
   * editToken required.
   */
  setPrimaryWallet(handle: string, editToken: string, walletId: string): WalletLink;

  // ── Abuse reports ────────────────────────────────────────────────────────────
  /**
   * Persist an abuse report to the store.
   * v0.4: writes to abuseReports[] in db.json.
   */
  saveAbuseReport(report: StoredAbuseReport): void;

  /**
   * Return all stored abuse reports, newest first.
   * Admin-only — never exposed in public API routes.
   */
  getAbuseReports(): StoredAbuseReport[];

  /**
   * Mark a report as reviewed (admin action).
   */
  markReportReviewed(reportId: string, note?: string): StoredAbuseReport;

  // ── Reserve ─────────────────────────────────────────────────────────────────
  /** Returns placeholder zeros until MockBridgeStatus is replaced by LiveBridgeStatus. */
  getReserveSnapshot(): ReserveSnapshot;
}
