/**
 * JsonFileDataStore — DataStore implementation backed by a flat JSON file.
 *
 * Intentionally simple: single-process, no concurrent write protection.
 * NOT safe for multi-process deployments. Swap for TursoDataStore in production.
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
  CreateIdentityInput,
  UpdateIdentityInput,
  ReserveSnapshot,
  DbSchema,
} from '@/lib/types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const EMPTY_DB: DbSchema = { identities: [], version: 1 };

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

  private writeDb(db: DbSchema): void {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  private generateToken(bytes = 8): string {
    return crypto.randomBytes(bytes).toString('hex');
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

  createIdentity(input: CreateIdentityInput): Identity {
    const db = this.readDb();
    const existing = db.identities.find(
      i => i.handle === input.handle.toLowerCase(),
    );
    if (existing) throw new Error(`Handle @${input.handle} is already taken.`);

    const now = new Date().toISOString();
    const address = input.rddAddress.trim();
    const identity: Identity = {
      id: this.generateId(),
      handle: input.handle.toLowerCase(),
      identityType: input.identityType ?? 'human',
      displayName: input.displayName?.trim() || null,
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
      bio: input.bio?.trim().slice(0, 160) || null,
      avatar: null,
      publicSigningKey: null,
      website: input.website?.trim() || null,
      socialProofs: [],
      parentHandle: null,
      agents: [],
      revocationKey: null,
      revokedAt: null,
      revokedReason: null,
      editToken: this.generateToken(8), // 16-char hex
      editTokenCreatedAt: now,
      verificationChallenges: {},
      createdAt: now,
      updatedAt: now,
      schemaVersion: 2,
    };
    db.identities.push(identity);
    this.writeDb(db);
    return identity;
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
    if (db.identities[idx].editToken !== editToken) throw new Error('UNAUTHORIZED');

    if (updates.displayName !== undefined)
      db.identities[idx].displayName =
        updates.displayName.trim().slice(0, 60) || null;
    if (updates.bio !== undefined)
      db.identities[idx].bio = updates.bio.trim().slice(0, 160) || null;
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

  // ── Social proofs ──────────────────────────────────────────────────────────

  createVerificationChallenge(
    handle: string,
    platform: string,
    editToken: string,
  ): string {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === handle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');
    if (db.identities[idx].editToken !== editToken) throw new Error('UNAUTHORIZED');

    const code = this.generateToken(4); // 8-char hex
    db.identities[idx].verificationChallenges[platform.toLowerCase()] = code;
    db.identities[idx].updatedAt = new Date().toISOString();
    this.writeDb(db);
    return code;
  }

  confirmSocialProof(
    handle: string,
    platform: string,
    username: string,
    proofUrl: string,
    editToken: string,
  ): Identity {
    const db = this.readDb();
    const idx = db.identities.findIndex(
      i => i.handle === handle.toLowerCase(),
    );
    if (idx === -1) throw new Error('NOT_FOUND');
    if (db.identities[idx].editToken !== editToken) throw new Error('UNAUTHORIZED');

    // Replace existing proof for this platform, then append the new one
    db.identities[idx].socialProofs = db.identities[idx].socialProofs.filter(
      p => p.platform.toLowerCase() !== platform.toLowerCase(),
    );
    db.identities[idx].socialProofs.push({
      platform: platform.toLowerCase(),
      username: username.trim(),
      proofUrl: proofUrl.trim() || null,
      addedAt: new Date().toISOString(),
    });
    // Clear the challenge once used
    delete db.identities[idx].verificationChallenges[platform.toLowerCase()];
    db.identities[idx].updatedAt = new Date().toISOString();
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
