/**
 * migrate.ts — schema migration runner for ReddID Next.
 *
 * Strategy:
 *   - Each record stores a `schemaVersion` integer.
 *   - Migration functions are additive and idempotent.
 *   - Migrations run at application startup via runMigrations().
 *   - The db.json file is written back only if changes were made.
 *   - Old fields are retained until all reads have migrated (soft deprecation).
 *
 * Version history:
 *   v0 (no schemaVersion field): original prototype — single rddAddress string
 *   v1 (schemaVersion: 1): tagged — same shape as v0, just stamped
 *   v2 (schemaVersion: 2): wallets[], agents[], identityType, avatar,
 *     editTokenCreatedAt, revocation fields, parentHandle
 *
 * To add a new migration:
 *   1. Increment CURRENT_SCHEMA_VERSION
 *   2. Add a migrateVxToVy(identity) function below
 *   3. Add it to MIGRATIONS array in order
 *   4. Document it in the Version history table above
 */

import fs from 'fs';
import path from 'path';
import type { Identity, DbSchema } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export const CURRENT_SCHEMA_VERSION = 2;

// ── Migration functions ──────────────────────────────────────────────────────
// Each function takes a record at version N and returns it at version N+1.
// The function MUST set schemaVersion on the returned record.

/**
 * v0 → v1: tag all legacy records without schemaVersion.
 * No-op transformation — just stamps the version number so v1→v2 can run.
 */
function migrateV0ToV1(identity: Identity): Identity {
  return { ...identity, schemaVersion: 1 };
}

/**
 * v1 → v2: expand Identity to full v2 model.
 *
 * - Adds wallets[] from rddAddress (retains rddAddress for compat)
 * - Adds identityType: 'human'
 * - Adds avatar, publicSigningKey, editTokenCreatedAt
 * - Adds agents[], parentHandle, revocationKey, revokedAt, revokedReason
 */
function migrateV1ToV2(identity: Identity): Identity {
  const now = identity.updatedAt ?? identity.createdAt ?? new Date().toISOString();

  // Build wallets[] from rddAddress only if wallets not already present
  const wallets =
    identity.wallets && identity.wallets.length > 0
      ? identity.wallets
      : identity.rddAddress
      ? [
          {
            id: `mig-${Date.now().toString(36)}`,
            chain: 'rdd' as const,
            address: identity.rddAddress,
            label: null,
            purpose: 'receive' as const,
            visibility: 'public' as const,
            proofType: 'self-reported' as const,
            proofSignature: null,
            proofNonce: null,
            verified: false,
            primary: true,
            addedAt: identity.createdAt ?? now,
            revokedAt: null,
          },
        ]
      : [];

  // Clear any pre-v2 string-format challenges — they used Record<string, string>
  // which is incompatible with the VerificationChallenge object format.
  // Challenges are ephemeral (8h TTL) so clearing them on migration is safe.
  const verificationChallenges: Record<string, never> = {};

  return {
    ...identity,
    identityType: identity.identityType ?? 'human',
    wallets,
    avatar: identity.avatar ?? null,
    publicSigningKey: identity.publicSigningKey ?? null,
    parentHandle: identity.parentHandle ?? null,
    agents: identity.agents ?? [],
    revocationKey: identity.revocationKey ?? null,
    revokedAt: identity.revokedAt ?? null,
    revokedReason: identity.revokedReason ?? null,
    editTokenCreatedAt: identity.editTokenCreatedAt ?? identity.createdAt,
    verificationChallenges,
    schemaVersion: 2,
  };
}

// ── Migration registry ───────────────────────────────────────────────────────
// Each entry: { fromVersion, toVersion, migrate }
// Applied in order; each step expects records already at `fromVersion`.

const MIGRATIONS: Array<{
  fromVersion: number;
  toVersion: number;
  migrate: (identity: Identity) => Identity;
}> = [
  { fromVersion: 0, toVersion: 1, migrate: migrateV0ToV1 },
  { fromVersion: 1, toVersion: 2, migrate: migrateV1ToV2 },
];

// ── Runner ───────────────────────────────────────────────────────────────────

function getEffectiveVersion(identity: Identity): number {
  // Records created before schemaVersion was added have no field → treat as 0
  return identity.schemaVersion ?? 0;
}

/**
 * Migrate a single identity record to CURRENT_SCHEMA_VERSION.
 * Applies migrations in sequence. Skips migrations already applied.
 */
export function migrateIdentity(identity: Identity): Identity {
  let current = { ...identity };
  let version = getEffectiveVersion(current);

  for (const step of MIGRATIONS) {
    if (version === step.fromVersion) {
      current = step.migrate(current);
      version = step.toVersion;
    }
  }

  return current;
}

/**
 * Run all pending migrations against the on-disk db.json.
 * Safe to call on every startup — idempotent.
 * Returns the number of records that were actually mutated.
 */
export function runMigrations(): number {
  if (!fs.existsSync(DB_PATH)) return 0;

  let db: DbSchema;
  try {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as DbSchema;
  } catch {
    return 0;
  }

  let changed = 0;
  const migrated = db.identities.map(identity => {
    if (getEffectiveVersion(identity) < CURRENT_SCHEMA_VERSION) {
      changed++;
      return migrateIdentity(identity);
    }
    return identity;
  });

  if (changed > 0) {
    db.identities = migrated;
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`[migrate] Applied migrations to ${changed} record(s). DB at v${CURRENT_SCHEMA_VERSION}.`);
  }

  return changed;
}
