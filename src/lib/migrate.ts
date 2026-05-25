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
 *   v1 (no schemaVersion field): original prototype — single rddAddress string
 *   v2 (schemaVersion: 2): wallets[], agents[], identityType, revocation fields
 *     → migration: convert rddAddress → wallets[0], add default fields
 *     → NOT YET APPLIED — added in Commit 4
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

export const CURRENT_SCHEMA_VERSION = 1;

// ── Migration functions ──────────────────────────────────────────────────────
// Each function takes a record at version N and returns it at version N+1.
// The function MUST set schemaVersion on the returned record.

/**
 * v1 → v1 (normalise): tag all legacy records without schemaVersion.
 * This is a no-op transformation — it just stamps the version number
 * so future migrations can reliably detect where each record sits.
 */
function migrateUnversionedToV1(identity: Identity): Identity {
  return {
    ...identity,
    schemaVersion: 1,
  };
}

// ── Migration registry ───────────────────────────────────────────────────────
// Each entry: { fromVersion, toVersion, migrate }
// Migrations are applied in order; each expects records at `fromVersion`.

const MIGRATIONS: Array<{
  fromVersion: number;
  toVersion: number;
  migrate: (identity: Identity) => Identity;
}> = [
  // Normalise legacy records that have no schemaVersion field
  {
    fromVersion: 0,      // 0 = "no version tag" sentinel
    toVersion: 1,
    migrate: migrateUnversionedToV1,
  },
  // Commit 4 will add:
  // { fromVersion: 1, toVersion: 2, migrate: migrateV1ToV2 }
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
