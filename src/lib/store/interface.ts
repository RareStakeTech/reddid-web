/**
 * DataStore — abstract interface for all persistence operations.
 *
 * Current implementation: JsonFileDataStore (flat JSON, single-process).
 * Future implementations: TursoDataStore (LibSQL), PostgresDataStore.
 *
 * All API routes and server components must go through getStore() —
 * never import JsonFileDataStore directly.
 */

import type {
  Identity,
  SocialProof,
  AgentIdentity,
  CreateIdentityInput,
  UpdateIdentityInput,
  CreateAgentInput,
  ReserveSnapshot,
} from '@/lib/types';

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
  createIdentity(input: CreateIdentityInput): Identity;
  updateIdentity(
    handle: string,
    editToken: string,
    updates: UpdateIdentityInput,
  ): Identity;

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
   * v0.3: trust-based. v0.5: auto-verify via platform API.
   */
  confirmSocialProof(
    handle: string,
    platform: string,
    username: string,
    proofUrl: string,
    editToken: string,
  ): Identity;
  addSocialProof(
    handle: string,
    proof: Omit<SocialProof, 'addedAt'>,
  ): Identity;

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

  // ── Reserve ─────────────────────────────────────────────────────────────────
  /** Returns placeholder zeros until MockBridgeStatus is replaced by LiveBridgeStatus. */
  getReserveSnapshot(): ReserveSnapshot;
}
