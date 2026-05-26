/**
 * SqliteDataStore — DataStore implementation backed by better-sqlite3.
 *
 * Drop-in replacement for JsonFileDataStore. Selected via REDDID_DB_ENGINE=sqlite.
 * All API routes and server components continue to call getStore() — no route changes.
 *
 * Schema design — hybrid approach:
 *   identities table: flat columns for indexed lookups + full JSON `data` column.
 *   social_proof_index: enables fast getIdentityBySocial() without full-table scan.
 *   abuse_reports: structured columns for admin queries + full JSON blob.
 *   revocation_events: audit trail for deletes and agent revocations.
 *   rate_limit_counters: SQLite-backed rate limiting (replaces in-memory Map in S4-06).
 *
 * Safety:
 *   WAL mode: concurrent reads don't block writes; single writer at a time.
 *   synchronous=NORMAL: safe with WAL; only risks data loss on power failure (not corruption).
 *   All mutations run inside explicit transactions — partial writes are impossible.
 *   Multi-instance warning: SQLite single-writer model is incompatible with Railway
 *   auto-scaling. Run exactly ONE instance in production. See ARCHITECTURE.md.
 *
 * Sprint 4 / S4-01+02+03 (2026-05-26).
 */

import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import type { DataStore } from './interface';
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
import { DB_PATH } from '@/lib/config';

/** editToken expires after 30 days — matches JsonFileDataStore. */
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/** revocationKey plaintext is 32 random bytes = 64 hex chars. */
const REVOCATION_KEY_BYTES = 32;

/** Derive the SQLite DB path from the JSON DB path (same dir, .db extension). */
function sqlitePath(): string {
  const dir = path.dirname(DB_PATH);
  return path.join(dir, 'reddid.db');
}

// ── Row types (narrow — only fields we actually read back) ────────────────────

interface IdentityRow { data: string }
interface HandleRow { handle: string }
interface CountRow { count: number }
interface ReportRow { data: string }

// ── SqliteDataStore ───────────────────────────────────────────────────────────

export class SqliteDataStore implements DataStore {
  private db: BetterSqlite3.Database;

  constructor(dbPath: string = sqlitePath()) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(dbPath);

    // WAL mode: readers don't block writers; writers don't block readers.
    // safe under concurrent Next.js requests (single process, many async handlers).
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    // NORMAL sync: safe with WAL. FULL would be safer against OS crash but slower.
    this.db.pragma('synchronous = NORMAL');

    this.bootstrap();
  }

  // ── Schema bootstrap ────────────────────────────────────────────────────────

  private bootstrap(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS identities (
        handle      TEXT PRIMARY KEY,
        data        TEXT NOT NULL,
        rdd_address TEXT,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        revoked_at  TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_identities_rdd_address
        ON identities (rdd_address);

      -- Fast lookup for getIdentityBySocial().
      -- Kept in sync with identities.data on every write.
      -- Revoked proofs are NOT indexed here (removed on revocation).
      CREATE TABLE IF NOT EXISTS social_proof_index (
        handle   TEXT NOT NULL,
        platform TEXT NOT NULL,
        username TEXT NOT NULL,
        PRIMARY KEY (handle, platform)
      );

      CREATE TABLE IF NOT EXISTS abuse_reports (
        id          TEXT PRIMARY KEY,
        data        TEXT NOT NULL,
        created_at  TEXT NOT NULL,
        reviewed    INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS revocation_events (
        id             TEXT PRIMARY KEY,
        target_type    TEXT NOT NULL,
        target_id      TEXT NOT NULL,
        target_handle  TEXT,
        revoked_by     TEXT NOT NULL,
        reason         TEXT,
        created_at     TEXT NOT NULL,
        visibility     TEXT NOT NULL DEFAULT 'private'
      );

      -- SQLite-backed rate limiting (S4-06).
      -- window_start is a Unix timestamp (seconds). Reset count when now > window_start + window_secs.
      CREATE TABLE IF NOT EXISTS rate_limit_counters (
        identifier   TEXT NOT NULL,
        action       TEXT NOT NULL,
        count        INTEGER NOT NULL DEFAULT 0,
        window_start INTEGER NOT NULL,
        PRIMARY KEY (identifier, action)
      );
    `);
  }

  // ── Private helpers (identical logic to JsonFileDataStore) ──────────────────

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  private generateToken(bytes = 8): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  private hashRevocationKey(plaintext: string): string {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
  }

  private sanitizeText(input: string): string {
    return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private checkEditToken(identity: Identity, editToken: string): void {
    if (identity.editToken !== editToken) throw new Error('UNAUTHORIZED');
    if (identity.editTokenCreatedAt) {
      const age = Date.now() - new Date(identity.editTokenCreatedAt).getTime();
      if (age > TOKEN_EXPIRY_MS) throw new Error('TOKEN_EXPIRED');
    }
  }

  /** Deserialise a row's JSON data column into an Identity. */
  private parseIdentity(row: IdentityRow): Identity {
    return JSON.parse(row.data) as Identity;
  }

  /**
   * Persist an identity — upserts the main row and rebuilds social_proof_index.
   * Runs inside a single SQLite transaction; partial writes are impossible.
   */
  private saveIdentity(identity: Identity): void {
    const upsertIdentity = this.db.prepare(`
      INSERT INTO identities (handle, data, rdd_address, created_at, updated_at, revoked_at)
      VALUES (@handle, @data, @rdd_address, @created_at, @updated_at, @revoked_at)
      ON CONFLICT(handle) DO UPDATE SET
        data        = excluded.data,
        rdd_address = excluded.rdd_address,
        updated_at  = excluded.updated_at,
        revoked_at  = excluded.revoked_at
    `);

    const deleteSocialIndex = this.db.prepare(
      'DELETE FROM social_proof_index WHERE handle = ?'
    );
    const insertSocialIndex = this.db.prepare(
      'INSERT INTO social_proof_index (handle, platform, username) VALUES (?, ?, ?)'
    );

    const tx = this.db.transaction(() => {
      upsertIdentity.run({
        handle:      identity.handle,
        data:        JSON.stringify(identity),
        rdd_address: identity.rddAddress ?? null,
        created_at:  identity.createdAt,
        updated_at:  identity.updatedAt,
        revoked_at:  identity.revokedAt ?? null,
      });

      // Rebuild the social proof index for this handle.
      // Only index active (non-revoked) proofs.
      deleteSocialIndex.run(identity.handle);
      for (const proof of identity.socialProofs) {
        if (proof.verificationStatus !== 'revoked') {
          insertSocialIndex.run(
            identity.handle,
            proof.platform.toLowerCase(),
            proof.username.toLowerCase(),
          );
        }
      }
    });

    tx();
  }

  // ── Identity queries ────────────────────────────────────────────────────────

  getIdentityByHandle(handle: string): Identity | null {
    const row = this.db
      .prepare('SELECT data FROM identities WHERE handle = ?')
      .get(handle.toLowerCase()) as IdentityRow | undefined;
    return row ? this.parseIdentity(row) : null;
  }

  getIdentityByAddress(rddAddress: string): Identity | null {
    const row = this.db
      .prepare('SELECT data FROM identities WHERE rdd_address = ?')
      .get(rddAddress) as IdentityRow | undefined;
    return row ? this.parseIdentity(row) : null;
  }

  getIdentityBySocial(platform: string, username: string): Identity | null {
    const lowerUser = username.toLowerCase();
    const lowerPlat = platform.toLowerCase();

    // Primary lookup: social_proof_index
    const indexRow = this.db
      .prepare('SELECT handle FROM social_proof_index WHERE platform = ? AND username = ?')
      .get(lowerPlat, lowerUser) as HandleRow | undefined;

    if (indexRow) {
      return this.getIdentityByHandle(indexRow.handle);
    }

    // Fallback: handle === username (legacy / direct handle lookup)
    return this.getIdentityByHandle(lowerUser);
  }

  getAllIdentities(): Identity[] {
    const rows = this.db
      .prepare('SELECT data FROM identities')
      .all() as IdentityRow[];
    return rows.map(r => this.parseIdentity(r));
  }

  countIdentities(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM identities')
      .get() as CountRow;
    return row.count;
  }

  // ── Identity mutations ──────────────────────────────────────────────────────

  createIdentity(
    input: CreateIdentityInput,
  ): { identity: Identity; revocationKeyPlaintext: string } {
    const existing = this.getIdentityByHandle(input.handle);
    if (existing) throw new Error(`Handle @${input.handle} is already taken.`);

    const now = new Date().toISOString();
    const address = input.rddAddress.trim();

    const revocationKeyPlaintext = this.generateToken(REVOCATION_KEY_BYTES);
    const revocationKeyHash = this.hashRevocationKey(revocationKeyPlaintext);

    const identity: Identity = {
      id: this.generateId(),
      handle: input.handle.toLowerCase(),
      identityType: input.identityType ?? 'human',
      displayName: input.displayName
        ? this.sanitizeText(input.displayName.trim()).slice(0, 60) || null
        : null,
      rddAddress: address,
      wallets: [
        {
          id: this.generateId(),
          chain: 'rdd',
          address,
          label: null,
          purpose: 'receive',
          visibility: 'public',
          proofType: 'self-reported',
          proofSignature: null,
          proofNonce: null,
          verified: false,
          primary: true,
          addedAt: now,
          revokedAt: null,
        },
      ],
      bio: input.bio
        ? this.sanitizeText(input.bio.trim()).slice(0, 160) || null
        : null,
      avatar: null,
      publicSigningKey: null,
      website: input.website?.trim() || null,
      socialProofs: [],
      parentHandle: null,
      agents: [],
      revocationKey: revocationKeyHash,
      revokedAt: null,
      revokedReason: null,
      editToken: this.generateToken(8),
      editTokenCreatedAt: now,
      verificationChallenges: {},
      createdAt: now,
      updatedAt: now,
      schemaVersion: 2,
    };

    this.saveIdentity(identity);
    return { identity, revocationKeyPlaintext };
  }

  updateIdentity(
    handle: string,
    editToken: string,
    updates: UpdateIdentityInput,
  ): Identity {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    if (updates.displayName !== undefined)
      identity.displayName =
        this.sanitizeText(updates.displayName.trim()).slice(0, 60) || null;
    if (updates.bio !== undefined)
      identity.bio =
        this.sanitizeText(updates.bio.trim()).slice(0, 160) || null;
    if (updates.website !== undefined)
      identity.website = updates.website.trim() || null;
    if (updates.identityType !== undefined)
      identity.identityType = updates.identityType;
    if (updates.avatar !== undefined)
      identity.avatar = updates.avatar.trim() || null;

    identity.updatedAt = new Date().toISOString();
    this.saveIdentity(identity);
    return identity;
  }

  reissueToken(
    handle: string,
    editToken: string,
  ): { editToken: string; expiresAt: string } {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');
    // Accept expired tokens — that's how you un-expire. Still reject wrong tokens.
    if (identity.editToken !== editToken) throw new Error('UNAUTHORIZED');

    const now = new Date();
    const newToken = this.generateToken(8);
    identity.editToken = newToken;
    identity.editTokenCreatedAt = now.toISOString();
    identity.updatedAt = now.toISOString();
    this.saveIdentity(identity);

    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS).toISOString();
    return { editToken: newToken, expiresAt };
  }

  deleteIdentity(handle: string, editToken: string): void {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const now = new Date().toISOString();

    const tx = this.db.transaction(() => {
      // Audit trail before deleting
      this.db.prepare(`
        INSERT INTO revocation_events
          (id, target_type, target_id, target_handle, revoked_by, reason, created_at, visibility)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        this.generateId(),
        'identity',
        identity.id,
        identity.handle,
        identity.handle,
        'Self-requested account deletion.',
        now,
        'private',
      );

      // Remove social proof index entries
      this.db.prepare('DELETE FROM social_proof_index WHERE handle = ?').run(identity.handle);

      // Delete the identity row
      this.db.prepare('DELETE FROM identities WHERE handle = ?').run(identity.handle);
    });

    tx();
  }

  exportIdentity(handle: string, editToken: string): Omit<Identity, 'revocationKey'> {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const { revocationKey: _rk, ...exportData } = identity;
    return exportData;
  }

  recoverByRevocationKey(
    handle: string,
    revocationKey: string,
  ): { editToken: string; expiresAt: string } {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');

    const storedHash = identity.revocationKey;
    if (!storedHash) throw new Error('NO_RECOVERY_KEY');

    const inputHash = this.hashRevocationKey(revocationKey);
    if (inputHash !== storedHash) throw new Error('UNAUTHORIZED');

    const now = new Date();
    const newToken = this.generateToken(8);
    identity.editToken = newToken;
    identity.editTokenCreatedAt = now.toISOString();
    identity.updatedAt = now.toISOString();
    this.saveIdentity(identity);

    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS).toISOString();
    return { editToken: newToken, expiresAt };
  }

  // ── Social proofs ───────────────────────────────────────────────────────────

  createVerificationChallenge(
    handle: string,
    platform: string,
    editToken: string,
  ): { code: string; expiresAt: string } {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const now = new Date();
    const code = this.generateToken(4); // 8-char hex
    const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();

    identity.verificationChallenges[platform.toLowerCase()] = {
      code,
      platform: platform.toLowerCase(),
      createdAt: now.toISOString(),
      expiresAt,
      attempts: 0,
    };
    identity.updatedAt = now.toISOString();
    this.saveIdentity(identity);
    return { code, expiresAt };
  }

  confirmSocialProof(
    handle: string,
    platform: string,
    username: string,
    proofUrl: string,
    editToken: string,
    proofMethod: ProofMethod = 'challenge-post',
  ): Identity {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const now = new Date();
    const platformKey = platform.toLowerCase();

    const challenge = identity.verificationChallenges[platformKey];
    if (challenge && typeof challenge === 'object' && challenge.expiresAt) {
      challenge.attempts += 1;
      if (challenge.attempts > 5) throw new Error('CHALLENGE_RATE_LIMITED');
      if (new Date(challenge.expiresAt) < now) throw new Error('CHALLENGE_EXPIRED');
    }

    identity.socialProofs = identity.socialProofs.filter(
      p => p.platform.toLowerCase() !== platformKey,
    );
    identity.socialProofs.push({
      id: this.generateId(),
      platform: platformKey,
      username: this.sanitizeText(username.trim()),
      proofMethod,
      proofUrl: proofUrl.trim() || null,
      proofSignature: null,
      verificationStatus: 'verified',
      verifiedAt: now.toISOString(),
      recheckAfter: null,
      visibility: 'public',
      addedAt: now.toISOString(),
    });

    delete identity.verificationChallenges[platformKey];
    identity.updatedAt = now.toISOString();
    this.saveIdentity(identity);
    return identity;
  }

  addSocialProof(
    handle: string,
    proof: Omit<SocialProof, 'addedAt'>,
  ): Identity {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error(`Identity @${handle} not found.`);

    identity.socialProofs = identity.socialProofs.filter(
      p => p.platform !== proof.platform,
    );
    identity.socialProofs.push({
      ...proof,
      addedAt: new Date().toISOString(),
    });
    identity.updatedAt = new Date().toISOString();
    this.saveIdentity(identity);
    return identity;
  }

  removeSocialProof(handle: string, platform: string, editToken: string): Identity {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('HANDLE_NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const proof = identity.socialProofs.find(
      p => p.platform === platform && p.verificationStatus !== 'revoked',
    );
    if (!proof) throw new Error('NOT_FOUND');

    proof.verificationStatus = 'revoked';
    identity.updatedAt = new Date().toISOString();
    this.saveIdentity(identity);
    return identity;
  }

  // ── Agent management ────────────────────────────────────────────────────────

  createAgent(
    parentHandle: string,
    editToken: string,
    input: CreateAgentInput,
  ): AgentIdentity {
    const identity = this.getIdentityByHandle(parentHandle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const agents = identity.agents ?? [];
    if (agents.length >= 10) throw new Error('AGENT_LIMIT_EXCEEDED');

    const slug = input.agentSlug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/.test(slug) && !/^[a-z0-9]{3,20}$/.test(slug)) {
      throw new Error('INVALID_AGENT_SLUG');
    }
    if (agents.some(a => a.agentSlug === slug && !a.revokedAt)) {
      throw new Error('AGENT_SLUG_TAKEN');
    }

    const now = new Date().toISOString();
    const agent: AgentIdentity = {
      id: this.generateId(),
      parentHandle: parentHandle.toLowerCase(),
      agentSlug: slug,
      displayHandle: `@${parentHandle.toLowerCase()}.${slug}`,
      agentType: input.agentType,
      displayPurpose: input.displayPurpose.trim().slice(0, 200),
      controllerKey: input.controllerKey,
      allowedActions: input.allowedActions,
      allowedRails: input.allowedRails,
      perTxLimitRdd: input.perTxLimitRdd,
      dailyLimitRdd: input.dailyLimitRdd,
      monthlyLimitRdd: input.monthlyLimitRdd,
      allowedRecipients: input.allowedRecipients,
      humanApprovalThresholdRdd: input.humanApprovalThresholdRdd,
      expiresAt: input.expiresAt,
      revokedAt: null,
      revokedReason: null,
      activityLogRef: null,
      createdAt: now,
    };

    identity.agents = [...agents, agent];
    identity.updatedAt = now;
    this.saveIdentity(identity);
    return agent;
  }

  getAgents(parentHandle: string): AgentIdentity[] {
    const identity = this.getIdentityByHandle(parentHandle);
    if (!identity) throw new Error('NOT_FOUND');
    return (identity.agents ?? []).filter(a => !a.revokedAt);
  }

  revokeAgent(
    parentHandle: string,
    agentId: string,
    editToken: string,
    reason: string,
  ): AgentIdentity {
    const identity = this.getIdentityByHandle(parentHandle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const agents = identity.agents ?? [];
    const agentIdx = agents.findIndex(a => a.id === agentId);
    if (agentIdx === -1) throw new Error('AGENT_NOT_FOUND');
    if (agents[agentIdx].revokedAt) throw new Error('AGENT_ALREADY_REVOKED');

    const now = new Date().toISOString();
    const revoked: AgentIdentity = {
      ...agents[agentIdx],
      revokedAt: now,
      revokedReason: reason.trim().slice(0, 200) || 'Revoked by owner.',
    };

    identity.agents = agents.map((a, i) => (i === agentIdx ? revoked : a));
    identity.updatedAt = now;
    this.saveIdentity(identity);
    return revoked;
  }

  // ── Wallet management ───────────────────────────────────────────────────────

  addWallet(handle: string, editToken: string, input: AddWalletInput): WalletLink {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const wallets = identity.wallets ?? [];
    if (wallets.length >= 20) throw new Error('WALLET_LIMIT');

    const addr = input.address.trim();
    if (wallets.some(w => w.chain === input.chain && w.address === addr && !w.revokedAt)) {
      throw new Error('DUPLICATE_ADDRESS');
    }

    const now = new Date().toISOString();
    if (input.primary) {
      wallets.forEach(w => { if (w.chain === input.chain) w.primary = false; });
    }

    const wallet: WalletLink = {
      id: this.generateId(),
      chain: input.chain,
      address: addr,
      label: input.label?.trim().slice(0, 60) ?? null,
      purpose: input.purpose,
      visibility: input.visibility,
      proofType: 'self-reported',
      proofSignature: null,
      proofNonce: null,
      verified: false,
      primary: input.primary,
      addedAt: now,
      revokedAt: null,
    };

    identity.wallets = [...wallets, wallet];
    identity.updatedAt = now;
    this.saveIdentity(identity);
    return wallet;
  }

  removeWallet(handle: string, editToken: string, walletId: string): void {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const wallets = identity.wallets ?? [];
    const activeWallets = wallets.filter(w => !w.revokedAt);
    if (activeWallets.length <= 1) throw new Error('LAST_WALLET');

    const walletIdx = wallets.findIndex(w => w.id === walletId);
    if (walletIdx === -1) throw new Error('WALLET_NOT_FOUND');

    const now = new Date().toISOString();
    wallets[walletIdx] = { ...wallets[walletIdx], revokedAt: now, primary: false };

    // Auto-promote next wallet on same chain if primary was removed
    const revoked = wallets[walletIdx];
    if (!wallets.some(w => w.chain === revoked.chain && w.primary && !w.revokedAt)) {
      const next = wallets.find(w => w.chain === revoked.chain && !w.revokedAt);
      if (next) next.primary = true;
    }

    identity.wallets = wallets;
    identity.updatedAt = now;
    this.saveIdentity(identity);
  }

  setPrimaryWallet(handle: string, editToken: string, walletId: string): WalletLink {
    const identity = this.getIdentityByHandle(handle);
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    const wallets = identity.wallets ?? [];
    const walletIdx = wallets.findIndex(w => w.id === walletId);
    if (walletIdx === -1) throw new Error('WALLET_NOT_FOUND');
    if (wallets[walletIdx].revokedAt) throw new Error('WALLET_REVOKED');

    const chain = wallets[walletIdx].chain;
    wallets.forEach(w => { if (w.chain === chain) w.primary = false; });
    wallets[walletIdx] = { ...wallets[walletIdx], primary: true };

    identity.wallets = wallets;
    identity.updatedAt = new Date().toISOString();
    this.saveIdentity(identity);
    return wallets[walletIdx];
  }

  // ── Abuse reports ────────────────────────────────────────────────────────────

  saveAbuseReport(report: StoredAbuseReport): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO abuse_reports (id, data, created_at, reviewed)
      VALUES (?, ?, ?, ?)
    `).run(
      report.id,
      JSON.stringify(report),
      report.createdAt,
      report.reviewed ? 1 : 0,
    );
  }

  getAbuseReports(): StoredAbuseReport[] {
    const rows = this.db
      .prepare('SELECT data FROM abuse_reports ORDER BY created_at DESC')
      .all() as ReportRow[];
    return rows.map(r => JSON.parse(r.data) as StoredAbuseReport);
  }

  markReportReviewed(reportId: string, note?: string): StoredAbuseReport {
    const row = this.db
      .prepare('SELECT data FROM abuse_reports WHERE id = ?')
      .get(reportId) as ReportRow | undefined;
    if (!row) throw new Error('REPORT_NOT_FOUND');

    const report = JSON.parse(row.data) as StoredAbuseReport;
    const updated: StoredAbuseReport = {
      ...report,
      reviewed: true,
      reviewedAt: new Date().toISOString(),
      reviewNote: note ?? null,
    };

    this.db.prepare(`
      UPDATE abuse_reports SET data = ?, reviewed = 1 WHERE id = ?
    `).run(JSON.stringify(updated), reportId);

    return updated;
  }

  // ── Reserve ─────────────────────────────────────────────────────────────────

  getReserveSnapshot(): ReserveSnapshot {
    return {
      nativeRddReserve: 0,
      pendingRedemptions: 0,
      backingAvailable: 0,
      totalRepresented: 0,
      backingRatio: null,
      lastUpdated: new Date().toISOString(),
      reserveAddresses: [],
      isLive: false,
    };
  }

  // ── Rate limiting (S4-06 — SQLite-backed) ───────────────────────────────────
  // These methods are NOT part of the DataStore interface — they're called
  // directly from src/lib/rate-limit.ts when REDDID_DB_ENGINE=sqlite.

  /**
   * Check and increment a rate limit counter.
   * Returns { ok, remaining, resetAt } — compatible with RateLimitResult in rate-limit.ts.
   *
   * @param identifier - IP address or handle
   * @param action     - e.g. 'register', 'challenge', 'recover'
   * @param limit      - max allowed count per window
   * @param windowMs   - window duration in milliseconds (matches rate-limit.ts convention)
   */
  checkRateLimit(
    identifier: string,
    action: string,
    limit: number,
    windowMs: number,
  ): { ok: boolean; remaining: number; resetAt: number } {
    const nowMs = Date.now();
    const nowSecs = Math.floor(nowMs / 1000);
    const windowSecs = Math.floor(windowMs / 1000);
    const windowStart = nowSecs - windowSecs;

    const row = this.db
      .prepare('SELECT count, window_start FROM rate_limit_counters WHERE identifier = ? AND action = ?')
      .get(identifier, action) as { count: number; window_start: number } | undefined;

    let currentCount: number;

    if (!row || row.window_start < windowStart) {
      // No record or window has expired — start fresh at count=1
      this.db.prepare(`
        INSERT INTO rate_limit_counters (identifier, action, count, window_start)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(identifier, action) DO UPDATE SET count = 1, window_start = excluded.window_start
      `).run(identifier, action, nowSecs);
      currentCount = 1;
    } else {
      currentCount = row.count + 1;
      this.db.prepare(
        'UPDATE rate_limit_counters SET count = count + 1 WHERE identifier = ? AND action = ?'
      ).run(identifier, action);
    }

    const windowStartMs = (row && row.window_start >= windowStart ? row.window_start : nowSecs) * 1000;
    const resetAt = windowStartMs + windowMs;

    return {
      ok: currentCount <= limit,
      remaining: Math.max(0, limit - currentCount),
      resetAt,
    };
  }
}
