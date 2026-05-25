/**
 * Lightweight JSON file database for ReddID Next v0.1 prototype.
 *
 * Intentionally simple — a flat JSON file with in-process read/write.
 * Easy to swap for Turso (LibSQL), Postgres, or any other DB for production.
 *
 * NOT safe for concurrent multi-process writes. Single Next.js process only.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export interface Identity {
  id: string;
  handle: string;
  displayName: string | null;
  rddAddress: string;
  bio: string | null;
  website: string | null;
  socialProofs: SocialProof[];
  /** 16-char hex token returned once at registration. Used to authorise edits. */
  editToken: string;
  /** platform → 8-char hex challenge code, pending proof submission */
  verificationChallenges: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface SocialProof {
  platform: string;
  username: string;
  proofUrl: string | null;
  addedAt: string;
}

interface DbSchema {
  identities: Identity[];
  version: number;
}

const EMPTY_DB: DbSchema = { identities: [], version: 1 };

function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_PATH)) return { ...EMPTY_DB, identities: [] };
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DbSchema;
  } catch {
    return { ...EMPTY_DB, identities: [] };
  }
}

function writeDb(db: DbSchema): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateToken(bytes = 8): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// ── Identities ─────────────────────────────────────────────────────────────

export function getIdentityByHandle(handle: string): Identity | null {
  const db = readDb();
  return db.identities.find(i => i.handle === handle.toLowerCase()) ?? null;
}

export function getIdentityByAddress(rddAddress: string): Identity | null {
  const db = readDb();
  return db.identities.find(i => i.rddAddress === rddAddress) ?? null;
}

/**
 * Find an identity by a linked social platform + username.
 * Checks socialProofs first, then falls back to handle === username.
 */
export function getIdentityBySocial(platform: string, username: string): Identity | null {
  const db = readDb();
  const lowerUser = username.toLowerCase();
  const lowerPlat = platform.toLowerCase();

  // Primary: explicit social proof match
  const bySocial = db.identities.find(i =>
    i.socialProofs.some(
      p => p.platform.toLowerCase() === lowerPlat &&
           p.username.toLowerCase() === lowerUser
    )
  );
  if (bySocial) return bySocial;

  // Fallback: handle matches username (creators who used their social name as handle)
  return db.identities.find(i => i.handle === lowerUser) ?? null;
}

export function getAllIdentities(): Identity[] {
  return readDb().identities;
}

export function countIdentities(): number {
  return readDb().identities.length;
}

export interface CreateIdentityInput {
  handle: string;
  displayName?: string;
  rddAddress: string;
  bio?: string;
  website?: string;
}

export function createIdentity(input: CreateIdentityInput): Identity {
  const db = readDb();
  const existing = db.identities.find(i => i.handle === input.handle.toLowerCase());
  if (existing) throw new Error(`Handle @${input.handle} is already taken.`);

  const now = new Date().toISOString();
  const identity: Identity = {
    id: generateId(),
    handle: input.handle.toLowerCase(),
    displayName: input.displayName?.trim() || null,
    rddAddress: input.rddAddress.trim(),
    bio: input.bio?.trim().slice(0, 160) || null,
    website: input.website?.trim() || null,
    socialProofs: [],
    editToken: generateToken(8),            // 16-char hex
    verificationChallenges: {},
    createdAt: now,
    updatedAt: now,
  };
  db.identities.push(identity);
  writeDb(db);
  return identity;
}

export interface UpdateIdentityInput {
  displayName?: string;
  bio?: string;
  website?: string;
}

/**
 * Update mutable profile fields. Requires correct editToken.
 */
export function updateIdentity(
  handle: string,
  editToken: string,
  updates: UpdateIdentityInput
): Identity {
  const db = readDb();
  const idx = db.identities.findIndex(i => i.handle === handle.toLowerCase());
  if (idx === -1) throw new Error('NOT_FOUND');
  if (db.identities[idx].editToken !== editToken) throw new Error('UNAUTHORIZED');

  if (updates.displayName !== undefined)
    db.identities[idx].displayName = updates.displayName.trim().slice(0, 60) || null;
  if (updates.bio !== undefined)
    db.identities[idx].bio = updates.bio.trim().slice(0, 160) || null;
  if (updates.website !== undefined)
    db.identities[idx].website = updates.website.trim() || null;

  db.identities[idx].updatedAt = new Date().toISOString();
  writeDb(db);
  return db.identities[idx];
}

/**
 * Generate (or regenerate) a verification challenge code for a platform.
 * Returns the 8-char hex code. Requires editToken.
 */
export function createVerificationChallenge(
  handle: string,
  platform: string,
  editToken: string
): string {
  const db = readDb();
  const idx = db.identities.findIndex(i => i.handle === handle.toLowerCase());
  if (idx === -1) throw new Error('NOT_FOUND');
  if (db.identities[idx].editToken !== editToken) throw new Error('UNAUTHORIZED');

  const code = generateToken(4); // 8-char hex
  db.identities[idx].verificationChallenges[platform.toLowerCase()] = code;
  db.identities[idx].updatedAt = new Date().toISOString();
  writeDb(db);
  return code;
}

/**
 * Record a social proof after user claims to have posted the challenge.
 * v0.1: trust-based (stores what user submits). v0.2 will verify via platform API.
 */
export function confirmSocialProof(
  handle: string,
  platform: string,
  username: string,
  proofUrl: string,
  editToken: string
): Identity {
  const db = readDb();
  const idx = db.identities.findIndex(i => i.handle === handle.toLowerCase());
  if (idx === -1) throw new Error('NOT_FOUND');
  if (db.identities[idx].editToken !== editToken) throw new Error('UNAUTHORIZED');

  // Remove existing proof for this platform, then add new one
  db.identities[idx].socialProofs = db.identities[idx].socialProofs.filter(
    p => p.platform.toLowerCase() !== platform.toLowerCase()
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
  writeDb(db);
  return db.identities[idx];
}

export function addSocialProof(
  handle: string,
  proof: Omit<SocialProof, 'addedAt'>
): Identity {
  const db = readDb();
  const idx = db.identities.findIndex(i => i.handle === handle.toLowerCase());
  if (idx === -1) throw new Error(`Identity @${handle} not found.`);

  db.identities[idx].socialProofs = db.identities[idx].socialProofs.filter(
    p => p.platform !== proof.platform
  );
  db.identities[idx].socialProofs.push({ ...proof, addedAt: new Date().toISOString() });
  db.identities[idx].updatedAt = new Date().toISOString();
  writeDb(db);
  return db.identities[idx];
}

/** Strip the editToken before returning to public API consumers. */
export function publicIdentity(identity: Identity): Omit<Identity, 'editToken' | 'verificationChallenges'> {
  const { editToken: _et, verificationChallenges: _vc, ...pub } = identity;
  return pub;
}

// ── Reserve (placeholder for bridge data) ─────────────────────────────────

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

export function getReserveSnapshot(): ReserveSnapshot {
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
