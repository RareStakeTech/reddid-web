/**
 * JsonFileDataStore — DataStore implementation backed by a flat JSON file.
 *
 * Intentionally simple: single-process, no concurrent write protection.
 * NOT safe for multi-process deployments. Swap for TursoDataStore in production.
 *
 * Sprint 1 additions (2026-05-26):
 *  - Atomic writes (tmp → rename) — prevents db.json corruption under concurrent writes (S1-02)
 *  - editToken expiry at 30 days, derived from editTokenCreatedAt (S1-01)
 *  - revocationKey generated at registration — SHA-256 hash stored; plaintext returned once (S1-06)
 *  - reissueToken() — rotate editToken before/after expiry (S1-01)
 *  - deleteIdentity() — hard delete with RevocationEvent audit trail (S1-02)
 *  - exportIdentity() — GDPR-style full-data export (S1-03)
 *  - recoverByRevocationKey() — emergency editToken reissue after token loss (S1-06)
 *  - sanitizeText() — strips HTML tags from user-supplied text before storage (S1-05)
 *
 * File path: data/db.json (relative to process.cwd()).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  DbSchema,
  StoredAbuseReport,
  ProofMethod,
} from '@/lib/types';
import type { AddWalletInput } from '@/lib/providers/wallet-link-provider';
import { DB_PATH } from '@/lib/config';

const EMPTY_DB: DbSchema = { identities: [], revocationEvents: [], abuseReports: [], version: 1 };

/** editToken expires after 30 days. Derived from editTokenCreatedAt — no schema migration needed. */
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/** revocationKey plaintext is 32 random bytes = 64 hex chars — cryptographically unguessable. */
const REVOCATION_KEY_BYTES = 32;

export class JsonFileDataStore implements DataStore {
  // ── Internal helpers ────────────────────────────────────────────────────────

  private readDb(): DbSchema {
    try {
      if (!fs.existsSync(DB_PATH)) return { ...EMPTY_DB, identities: [] };
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw) as DbSchema;
    } catch {
      return { ...EMPTY_DB, identities: [] };
    }
  }

  /**
   * Atomic write: write to DB_PATH.tmp then rename over the live file.
   * On POSIX systems rename() is atomic at the OS level — prevents corruption
   * if the process is killed mid-write. On Windows it replaces the destination.
   * Sprint 1 / S1-02 — fixes db-001 from VALIDATION_LOG.md.
   */
  private writeDb(db: DbSchema): void {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = DB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_PATH);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  private generateToken(bytes = 8): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * One-way hash of a revocation key for storage.
   * SHA-256 is sufficient here — plaintext is 64 hex chars of random data
   * so rainbow tables are useless. Never store plaintext.
   */
  private hashRevocationKey(plaintext: string): string {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
  }

  /**
   * Strip HTML tags from user-supplied text to prevent stored XSS.
   * Also collapses internal whitespace and trims.
   * Sprint 1 / S1-05.
   */
  private sanitizeText(input: string): string {
    return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Validate an editToken against a stored identity.
   *
   * Throws 'UNAUTHORIZED'  — token doesn't match stored token.
   * Throws 'TOKEN_EXPIRED' — token matches but older than 30 days.
   *
   * Grace rule: identities without editTokenCreatedAt (v1 records migrated
   * before Sprint 1) are treated as never-expired until they next reissue —
   * giving existing users a seamless transition window.
   */
  private checkEditToken(identity: Identity, editToken: string): void {
    if (identity.editToken !== editToken) throw new Error('UNAUTHORIZED');
    if (identity.editTokenCreatedAt) {
      const age = Date.now() - new Date(identity.editTokenCreatedAt).getTime();
      if (age > TOKEN_EXPIRY_MS) throw new Error('TOKEN_EXPIRED');
    }
  }

  // ── Identity queries ────────────────────────────────────────────────────────

  getIdentityByHandle(handle: string): Identity | null {
    const db = this.readDb();
    return db.identities.find(i => i.handle === handle.toLowerCase()) ?? null;
  }

  getIdentityByAddress(rddAddress: string): Identity | null {
    const db = this.readDb();
    return db.identities.find(i => i.rddAddress === rddAddress) ?? null;
  }

  getIdentityBySocial(platform: string, username: string): Identity | null {
    const db = this.readDb();
    const lowerUser = username.toLowerCase();
    const lowerPlat = platform.toLowerCase();

    const bySocial = db.identities.find(i =>
      i.socialProofs.some(
        p =>
          p.platform.toLowerCase() === lowerPlat &&
          p.username.toLowerCase() === lowerUser,
      ),
    );
    if (bySocial) return bySocial;

    return db.identities.find(i => i.handle === lowerUser) ?? null;
  }

  getAllIdentities(): Identity[] {
    return this.readDb().identities;
  }

  countIdentities(): number {
    return this.readDb().identities.length;
  }

  // ── Identity mutations ──────────────────────────────────────────────────────

  /**
   * Create a new identity.
   *
   * Returns the stored Identity AND the plaintext revocationKey — caller must
   * pass the plaintext to the user exactly once. It is never retrievable again.
   * The SHA-256 hash of the plaintext is stored in identity.revocationKey.
   */
  createIdentity(
    input: CreateIdentityInput,
  ): { identity: Identity; revocationKeyPlaintext: string } {
    const db = this.readDb();
    const existing = db.identities.find(
      i => i.handle === input.handle.toLowerCase(),
    );
    if (existing) throw new Error(`Handle @${input.handle} is already taken.`);

    const now = new Date().toISOString();
    const address = input.rddAddress.trim();

    // Generate revocationKey — 64-char hex plaintext shown once to user; hash stored.
    const revocationKeyPlaintext = this.generateToken(REVOCATION_KEY_BYTES);
    const revocationKeyHash = this.hashRevocationKey(revocationKeyPlaintext);

    const identity: Identity = {
      id: this.generateId(),
      handle: input.handle.toLowerCase(),
      identityType: input.identityType ?? 'human',
      displayName: input.displayName
        ? this.sanitizeText(input.displayName.trim()).slice(0, 60) || null
        : null,
      // v1 compat field — kept so existing reads that use rddAddress still work
      rddAddress: address,
      // v2 canonical wallet list
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
      revocationKey: revocationKeyHash,   // SHA-256 hash — never the plaintext
      revokedAt: null,
      revokedReason: null,
      editToken: this.generateToken(8),    // 16-char hex bearer token
      editTokenCreatedAt: now,
      verificationChallenges: {},
      createdAt: now,
      updatedAt: now,
      schemaVersion: 2,
    };
    db.identities.push(identity);
    this.writeDb(db);
    return { identity, revocationKeyPlaintext };
  }

  updateIdentity(
    handle: string,
    editToken: string,
    updates: UpdateIdentityInput,
  ): Identity {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === handle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    if (updates.displayName !== undefined)
      db.identities[idx].displayName =
        this.sanitizeText(updates.displayName.trim()).slice(0, 60) || null;
    if (updates.bio !== undefined)
      db.identities[idx].bio =
        this.sanitizeText(updates.bio.trim()).slice(0, 160) || null;
    if (updates.website !== undefined)
      db.identities[idx].website = updates.website.trim() || null;
    if (updates.identityType !== undefined)
      db.identities[idx].identityType = updates.identityType;
    if (updates.avatar !== undefined)
      db.identities[idx].avatar = updates.avatar.trim() || null;

    db.identities[idx].updatedAt = new Date().toISOString();
    this.writeDb(db);
    return db.identities[idx];
  }

  /**
   * Rotate the editToken. Accepts tokens that are expired (otherwise the user
   * couldn't reissue once expired). Still rejects wrong tokens.
   * Sprint 1 / S1-01.
   */
  reissueToken(
    handle: string,
    editToken: string,
  ): { editToken: string; expiresAt: string } {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === handle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');
    // Accept expired tokens — reissue is exactly how you un-expire.
    // Still reject wrong tokens to prevent unauthorized rotation.
    if (db.identities[idx].editToken !== editToken) throw new Error('UNAUTHORIZED');

    const now = new Date();
    const newToken = this.generateToken(8);
    db.identities[idx].editToken = newToken;
    db.identities[idx].editTokenCreatedAt = now.toISOString();
    db.identities[idx].updatedAt = now.toISOString();
    this.writeDb(db);

    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS).toISOString();
    return { editToken: newToken, expiresAt };
  }

  /**
   * Hard-delete an identity. Requires valid, non-expired editToken.
   * Logs a RevocationEvent for audit purposes before removing the record.
   * Sprint 1 / S1-02.
   */
  deleteIdentity(handle: string, editToken: string): void {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === handle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    const now = new Date().toISOString();
    const { id, handle: storedHandle } = db.identities[idx];

    // Audit trail — log before deleting so the event references a valid ID
    db.revocationEvents.push({
      id: this.generateId(),
      targetType: 'identity',
      targetId: id,
      targetHandle: storedHandle,
      revokedBy: storedHandle,
      reason: 'Self-requested account deletion.',
      createdAt: now,
      visibility: 'private',
    });

    db.identities.splice(idx, 1);
    this.writeDb(db);
  }

  /**
   * Return a full copy of the identity's stored data for GDPR-style export.
   * The revocationKey hash is omitted — it is internal security data, not
   * personal data meaningful to the user. editToken IS included (it's theirs).
   * Sprint 1 / S1-03.
   */
  exportIdentity(handle: string, editToken: string): Omit<Identity, 'revocationKey'> {
    const db = this.readDb();
    const identity = db.identities.find(
      i => i.handle === handle.toLowerCase(),
    );
    if (!identity) throw new Error('NOT_FOUND');
    this.checkEditToken(identity, editToken);

    // Spread to avoid mutating the live record; _rk is intentionally unused
    const { revocationKey: _rk, ...exportData } = identity;
    return exportData;
  }

  /**
   * Emergency recovery: verify the revocationKey plaintext, then issue a new
   * editToken. The revocationKey itself is NOT rotated — the user may need it
   * again. editToken rotation is the only side effect.
   * Sprint 1 / S1-06.
   */
  recoverByRevocationKey(
    handle: string,
    revocationKey: string,
  ): { editToken: string; expiresAt: string } {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === handle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');

    const storedHash = db.identities[idx].revocationKey;
    if (!storedHash) throw new Error('NO_RECOVERY_KEY');

    const inputHash = this.hashRevocationKey(revocationKey);
    if (inputHash !== storedHash) throw new Error('UNAUTHORIZED');

    const now = new Date();
    const newToken = this.generateToken(8);
    db.identities[idx].editToken = newToken;
    db.identities[idx].editTokenCreatedAt = now.toISOString();
    db.identities[idx].updatedAt = now.toISOString();
    this.writeDb(db);

    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS).toISOString();
    return { editToken: newToken, expiresAt };
  }

  // ── Social proofs ──────────────────────────────────────────────────────────

  createVerificationChallenge(
    handle: string,
    platform: string,
    editToken: string,
  ): { code: string; expiresAt: string } {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === handle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    const now = new Date();
    const code = this.generateToken(4); // 8-char hex
    const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours

    db.identities[idx].verificationChallenges[platform.toLowerCase()] = {
      code,
      platform: platform.toLowerCase(),
      createdAt: now.toISOString(),
      expiresAt,
      attempts: 0,
    };
    db.identities[idx].updatedAt = now.toISOString();
    this.writeDb(db);
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
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === handle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    const now = new Date();
    const platformKey = platform.toLowerCase();

    // Check challenge expiry (v2 format only — string-type legacy challenges are ignored)
    const challenge = db.identities[idx].verificationChallenges[platformKey];
    if (challenge && typeof challenge === 'object' && challenge.expiresAt) {
      // Increment attempt counter before checking
      challenge.attempts += 1;
      if (challenge.attempts > 5) {
        throw new Error('CHALLENGE_RATE_LIMITED');
      }
      if (new Date(challenge.expiresAt) < now) {
        throw new Error('CHALLENGE_EXPIRED');
      }
    }

    // Replace existing proof for this platform, then append the updated one
    db.identities[idx].socialProofs = db.identities[idx].socialProofs.filter(
      p => p.platform.toLowerCase() !== platformKey,
    );
    db.identities[idx].socialProofs.push({
      id: this.generateId(),
      platform: platformKey,
      username: this.sanitizeText(username.trim()),
      proofMethod,
      proofUrl: proofUrl.trim() || null,
      proofSignature: null,
      // 'verified' for both trust-based and server-fetched proofs.
      // The distinction is surfaced via proofMethod:
      //   'challenge-post'     → TrustBadge: 'Post Verified' (trust-based)
      //   'url-fetch-verified' → TrustBadge: 'URL Verified'  (server confirmed)
      verificationStatus: 'verified',
      verifiedAt: now.toISOString(),
      recheckAfter: null,
      visibility: 'public',
      addedAt: now.toISOString(),
    });

    // Clear the challenge once used
    delete db.identities[idx].verificationChallenges[platformKey];
    db.identities[idx].updatedAt = now.toISOString();
    this.writeDb(db);
    return db.identities[idx];
  }

  addSocialProof(
    handle: string,
    proof: Omit<SocialProof, 'addedAt'>,
  ): Identity {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === handle.toLowerCase(),
    );
    if (idx === -1) throw new Error(`Identity @${handle} not found.`);

    db.identities[idx].socialProofs = db.identities[idx].socialProofs.filter(
      p => p.platform !== proof.platform,
    );
    db.identities[idx].socialProofs.push({
      ...proof,
      addedAt: new Date().toISOString(),
    });
    db.identities[idx].updatedAt = new Date().toISOString();
    this.writeDb(db);
    return db.identities[idx];
  }

  /**
   * Revoke a social proof link. Sets verificationStatus='revoked' and records
   * a revokedAt timestamp. The record is kept for audit but hidden from public views.
   * editToken must be valid and non-expired.
   */
  removeSocialProof(
    handle: string,
    platform: string,
    editToken: string,
  ): Identity {
    const db = this.readDb();
    const idx = db.identities.findIndex(i => i.handle === handle.toLowerCase());
    if (idx === -1) throw new Error('HANDLE_NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    const proof = db.identities[idx].socialProofs.find(
      p => p.platform === platform && p.verificationStatus !== 'revoked',
    );
    if (!proof) throw new Error('NOT_FOUND');

    proof.verificationStatus = 'revoked';
    db.identities[idx].updatedAt = new Date().toISOString();
    this.writeDb(db);
    return db.identities[idx];
  }

  // ── Agent management ───────────────────────────────────────────────────────

  createAgent(
    parentHandle: string,
    editToken: string,
    input: CreateAgentInput,
  ): AgentIdentity {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === parentHandle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    const agents = db.identities[idx].agents ?? [];
    if (agents.length >= 10) throw new Error('AGENT_LIMIT_EXCEEDED');

    // Validate slug: 3-20 chars, lowercase alphanumeric + hyphens
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

    db.identities[idx].agents = [...agents, agent];
    db.identities[idx].updatedAt = now;
    this.writeDb(db);
    return agent;
  }

  getAgents(parentHandle: string): AgentIdentity[] {
    const db = this.readDb();
    const identity = db.identities.find(
      i => i.handle === parentHandle.toLowerCase(),
    );
    if (!identity) throw new Error('NOT_FOUND');
    return (identity.agents ?? []).filter(a => !a.revokedAt);
  }

  revokeAgent(
    parentHandle: string,
    agentId: string,
    editToken: string,
    reason: string,
  ): AgentIdentity {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === parentHandle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    const agents = db.identities[idx].agents ?? [];
    const agentIdx = agents.findIndex(a => a.id === agentId);
    if (agentIdx === -1) throw new Error('AGENT_NOT_FOUND');
    if (agents[agentIdx].revokedAt) throw new Error('AGENT_ALREADY_REVOKED');

    const now = new Date().toISOString();
    const revoked: AgentIdentity = {
      ...agents[agentIdx],
      revokedAt: now,
      revokedReason: reason.trim().slice(0, 200) || 'Revoked by owner.',
    };

    db.identities[idx].agents = agents.map((a, i) => (i === agentIdx ? revoked : a));
    db.identities[idx].updatedAt = now;
    this.writeDb(db);
    return revoked;
  }

  // ── Wallet management ───────────────────────────────────────────────────────

  addWallet(handle: string, editToken: string, input: AddWalletInput): WalletLink {
    const db = this.readDb();
    const idx = db.identities.findIndex(i => i.handle === handle.toLowerCase());
    if (idx === -1) throw new Error('NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    const wallets = db.identities[idx].wallets ?? [];
    if (wallets.length >= 20) throw new Error('WALLET_LIMIT');

    // Check for duplicate address+chain
    const addr = input.address.trim();
    if (wallets.some(w => w.chain === input.chain && w.address === addr && !w.revokedAt)) {
      throw new Error('DUPLICATE_ADDRESS');
    }

    const now = new Date().toISOString();
    // If marked primary, clear existing primary wallets on the same chain
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
      proofType: 'self-reported', // MVP: all wallets are self-reported
      proofSignature: null,
      proofNonce: null,
      verified: false,
      primary: input.primary,
      addedAt: now,
      revokedAt: null,
    };

    db.identities[idx].wallets = [...wallets, wallet];
    db.identities[idx].updatedAt = now;
    this.writeDb(db);
    return wallet;
  }

  removeWallet(handle: string, editToken: string, walletId: string): void {
    const db = this.readDb();
    const idx = db.identities.findIndex(i => i.handle === handle.toLowerCase());
    if (idx === -1) throw new Error('NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    const wallets = db.identities[idx].wallets ?? [];
    const activeWallets = wallets.filter(w => !w.revokedAt);
    if (activeWallets.length <= 1) throw new Error('LAST_WALLET');

    const walletIdx = wallets.findIndex(w => w.id === walletId);
    if (walletIdx === -1) throw new Error('WALLET_NOT_FOUND');

    // Soft-delete: mark as revoked rather than deleting
    const now = new Date().toISOString();
    wallets[walletIdx] = { ...wallets[walletIdx], revokedAt: now, primary: false };

    // If we just revoked the primary, promote the next available wallet on the same chain
    const revoked = wallets[walletIdx];
    if (!wallets.some(w => w.chain === revoked.chain && w.primary && !w.revokedAt)) {
      const next = wallets.find(w => w.chain === revoked.chain && !w.revokedAt);
      if (next) next.primary = true;
    }

    db.identities[idx].wallets = wallets;
    db.identities[idx].updatedAt = now;
    this.writeDb(db);
  }

  setPrimaryWallet(handle: string, editToken: string, walletId: string): WalletLink {
    const db = this.readDb();
    const idx = db.identities.findIndex(i => i.handle === handle.toLowerCase());
    if (idx === -1) throw new Error('NOT_FOUND');
    this.checkEditToken(db.identities[idx], editToken);

    const wallets = db.identities[idx].wallets ?? [];
    const walletIdx = wallets.findIndex(w => w.id === walletId);
    if (walletIdx === -1) throw new Error('WALLET_NOT_FOUND');
    if (wallets[walletIdx].revokedAt) throw new Error('WALLET_REVOKED');

    const chain = wallets[walletIdx].chain;
    // Clear primary on all wallets of this chain, then set the target
    wallets.forEach(w => { if (w.chain === chain) w.primary = false; });
    wallets[walletIdx] = { ...wallets[walletIdx], primary: true };

    db.identities[idx].wallets = wallets;
    db.identities[idx].updatedAt = new Date().toISOString();
    this.writeDb(db);
    return wallets[walletIdx];
  }

  // ── Abuse reports ────────────────────────────────────────────────────────────

  saveAbuseReport(report: StoredAbuseReport): void {
    const db = this.readDb();
    if (!db.abuseReports) db.abuseReports = [];
    db.abuseReports.unshift(report); // newest first
    this.writeDb(db);
  }

  getAbuseReports(): StoredAbuseReport[] {
    const db = this.readDb();
    return (db.abuseReports ?? []).slice().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  markReportReviewed(reportId: string, note?: string): StoredAbuseReport {
    const db = this.readDb();
    if (!db.abuseReports) db.abuseReports = [];
    const idx = db.abuseReports.findIndex(r => r.id === reportId);
    if (idx === -1) throw new Error('REPORT_NOT_FOUND');
    db.abuseReports[idx] = {
      ...db.abuseReports[idx],
      reviewed: true,
      reviewedAt: new Date().toISOString(),
      reviewNote: note ?? null,
    };
    this.writeDb(db);
    return db.abuseReports[idx];
  }

  // ── Reserve ─────────────────────────────────────────────────────────────────

  getReserveSnapshot(): ReserveSnapshot {
    // MockBridgeStatus — returns zeros until LiveBridgeStatus is implemented.
    // isLive: false keeps the "Not Live" banner showing on /reserve.
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
}
