/**
 * Lightweight JSON file database for ReddID Next v0.1 prototype.
 *
 * This is intentionally simple — a flat JSON file with in-process
 * read/write. It is adequate for a single-server prototype and easy
 * to swap for Turso (LibSQL), Postgres, or any other DB for production.
 *
 * NOT safe for concurrent multi-process writes. Single Next.js process only.
 */

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export interface Identity {
  id: string;
  handle: string;
  displayName: string | null;
  rddAddress: string;
  bio: string | null;
  website: string | null;
  socialProofs: SocialProof[];
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

// ── Identities ─────────────────────────────────────────────────────────────

export function getIdentityByHandle(handle: string): Identity | null {
  const db = readDb();
  return db.identities.find(i => i.handle === handle.toLowerCase()) ?? null;
}

export function getIdentityByAddress(rddAddress: string): Identity | null {
  const db = readDb();
  return db.identities.find(i => i.rddAddress === rddAddress) ?? null;
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
    createdAt: now,
    updatedAt: now,
  };
  db.identities.push(identity);
  writeDb(db);
  return identity;
}

export function addSocialProof(
  handle: string,
  proof: Omit<SocialProof, 'addedAt'>
): Identity {
  const db = readDb();
  const idx = db.identities.findIndex(i => i.handle === handle.toLowerCase());
  if (idx === -1) throw new Error(`Identity @${handle} not found.`);

  // Replace existing proof for the same platform
  db.identities[idx].socialProofs = db.identities[idx].socialProofs.filter(
    p => p.platform !== proof.platform
  );
  db.identities[idx].socialProofs.push({ ...proof, addedAt: new Date().toISOString() });
  db.identities[idx].updatedAt = new Date().toISOString();
  writeDb(db);
  return db.identities[idx];
}

// ── Reserve (placeholder for bridge data) ──────────────────────────────────

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

/** Placeholder reserve data — replaced by real indexer data when bridge is live. */
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
