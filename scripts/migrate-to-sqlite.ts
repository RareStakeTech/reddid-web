/**
 * migrate-to-sqlite.ts — One-time migration from data/db.json to SQLite.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-sqlite.ts [--dry-run] [--db-path /path/to/db.json]
 *
 * What it does:
 *   1. Reads the existing db.json (runs JSON schema migrations v0→v2 first)
 *   2. Writes each identity + abuse report to the SQLite database
 *   3. Verifies row counts match
 *   4. Prints a summary
 *
 * Safety:
 *   - Run in --dry-run mode first to preview what would happen
 *   - The source db.json is NEVER modified — it stays as a fallback
 *   - If SQLite fails, set REDDID_DB_ENGINE=json to roll back instantly
 *   - Run against a copy of the production db.json before running live:
 *       cp data/db.json data/db.backup.json
 *       npx tsx scripts/migrate-to-sqlite.ts
 *
 * Sprint 4 / S4-02 (2026-05-26).
 */

import fs from 'fs';
import path from 'path';

// ── Parse CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const dbPathArg = args.find(a => a.startsWith('--db-path='))?.split('=')[1];

// ── Paths ─────────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_JSON_PATH = dbPathArg
  ? path.resolve(dbPathArg)
  : path.join(PROJECT_ROOT, 'data', 'db.json');
const DB_SQLITE_PATH = path.join(path.dirname(DB_JSON_PATH), 'reddid.db');

// ── Load modules (after path resolution so cwd is set correctly) ──────────────
// We import directly rather than going through getStore() so we can control
// exactly what happens — no singleton, no env var dependency.

/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const { migrateIdentity } = require('../src/lib/migrate');

// ── Types (inline to avoid import resolution issues in tsx) ──────────────────

interface DbSchema {
  identities: Record<string, unknown>[];
  revocationEvents?: Record<string, unknown>[];
  abuseReports?: Record<string, unknown>[];
  version?: number;
}

interface Identity {
  handle: string;
  rddAddress?: string | null;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string | null;
  schemaVersion?: number;
  socialProofs?: Array<{ platform: string; username: string; verificationStatus?: string }>;
}

interface AbuseReport {
  id: string;
  createdAt: string;
  reviewed?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function banner(msg: string) {
  console.log('\n' + '─'.repeat(60));
  console.log(msg);
  console.log('─'.repeat(60));
}

function readJsonDb(): DbSchema {
  if (!fs.existsSync(DB_JSON_PATH)) {
    console.error(`✗ db.json not found at: ${DB_JSON_PATH}`);
    console.error('  Pass --db-path=/path/to/db.json to specify a different location.');
    process.exit(1);
  }
  const raw = fs.readFileSync(DB_JSON_PATH, 'utf-8');
  return JSON.parse(raw) as DbSchema;
}

// ── Main ──────────────────────────────────────────────────────────────────────

banner('ReddID → SQLite migration' + (DRY_RUN ? ' [DRY RUN — no writes]' : ''));
console.log('Source:      ' + DB_JSON_PATH);
console.log('Destination: ' + DB_SQLITE_PATH);

// 1. Read and migrate JSON source
console.log('\n[1/4] Reading db.json and applying JSON schema migrations...');
const source = readJsonDb();
const rawIdentities = source.identities ?? [];
const rawReports = source.abuseReports ?? [];

// Apply JSON schema migrations (v0→v2) to each identity
const identities: Identity[] = rawIdentities.map((raw: Record<string, unknown>) =>
  migrateIdentity(raw) as Identity
);

console.log(`      Found: ${identities.length} identities, ${rawReports.length} abuse reports`);
if (identities.some(i => (i.schemaVersion ?? 0) < 2)) {
  console.warn('      ⚠ Some identities could not migrate to v2 — check migrate.ts');
}

// 2. Preview in dry-run mode
if (DRY_RUN) {
  console.log('\n[DRY RUN] Would migrate:');
  identities.forEach(i => {
    const proofs = i.socialProofs?.filter(p => p.verificationStatus !== 'revoked').length ?? 0;
    console.log(`  @${i.handle}  (${proofs} active social proofs)`);
  });
  console.log('\n[DRY RUN] No writes performed. Remove --dry-run to execute.');
  process.exit(0);
}

// 3. Open SQLite and write
console.log('\n[2/4] Opening SQLite database...');
if (fs.existsSync(DB_SQLITE_PATH)) {
  const backup = DB_SQLITE_PATH + '.pre-migration.bak';
  fs.copyFileSync(DB_SQLITE_PATH, backup);
  console.log(`      Existing SQLite found — backed up to: ${path.basename(backup)}`);
}

const db = new Database(DB_SQLITE_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Bootstrap schema (same as SqliteDataStore.bootstrap())
db.exec(`
  CREATE TABLE IF NOT EXISTS identities (
    handle      TEXT PRIMARY KEY,
    data        TEXT NOT NULL,
    rdd_address TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    revoked_at  TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_identities_rdd_address ON identities (rdd_address);

  CREATE TABLE IF NOT EXISTS social_proof_index (
    handle   TEXT NOT NULL,
    platform TEXT NOT NULL,
    username TEXT NOT NULL,
    PRIMARY KEY (handle, platform)
  );

  CREATE TABLE IF NOT EXISTS abuse_reports (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    reviewed   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS revocation_events (
    id            TEXT PRIMARY KEY,
    target_type   TEXT NOT NULL,
    target_id     TEXT NOT NULL,
    target_handle TEXT,
    revoked_by    TEXT NOT NULL,
    reason        TEXT,
    created_at    TEXT NOT NULL,
    visibility    TEXT NOT NULL DEFAULT 'private'
  );

  CREATE TABLE IF NOT EXISTS rate_limit_counters (
    identifier   TEXT NOT NULL,
    action       TEXT NOT NULL,
    count        INTEGER NOT NULL DEFAULT 0,
    window_start INTEGER NOT NULL,
    PRIMARY KEY (identifier, action)
  );
`);

console.log('[3/4] Writing identities and abuse reports...');

const upsertIdentity = db.prepare(`
  INSERT INTO identities (handle, data, rdd_address, created_at, updated_at, revoked_at)
  VALUES (@handle, @data, @rdd_address, @created_at, @updated_at, @revoked_at)
  ON CONFLICT(handle) DO UPDATE SET
    data        = excluded.data,
    rdd_address = excluded.rdd_address,
    updated_at  = excluded.updated_at,
    revoked_at  = excluded.revoked_at
`);

const upsertSocialIndex = db.prepare(
  'INSERT OR REPLACE INTO social_proof_index (handle, platform, username) VALUES (?, ?, ?)'
);

const upsertReport = db.prepare(`
  INSERT INTO abuse_reports (id, data, created_at, reviewed)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET data = excluded.data, reviewed = excluded.reviewed
`);

let identityCount = 0;
let socialIndexCount = 0;
let reportCount = 0;

const migrateAll = db.transaction(() => {
  for (const identity of identities) {
    upsertIdentity.run({
      handle:      identity.handle,
      data:        JSON.stringify(identity),
      rdd_address: identity.rddAddress ?? null,
      created_at:  identity.createdAt,
      updated_at:  identity.updatedAt,
      revoked_at:  identity.revokedAt ?? null,
    });
    identityCount++;

    for (const proof of identity.socialProofs ?? []) {
      if (proof.verificationStatus !== 'revoked') {
        upsertSocialIndex.run(
          identity.handle,
          proof.platform.toLowerCase(),
          proof.username.toLowerCase(),
        );
        socialIndexCount++;
      }
    }
  }

  for (const report of rawReports as unknown as AbuseReport[]) {
    upsertReport.run(
      report.id,
      JSON.stringify(report),
      report.createdAt,
      report.reviewed ? 1 : 0,
    );
    reportCount++;
  }
});

migrateAll();

// 4. Verify
console.log('\n[4/4] Verifying row counts...');
const sqliteIdentityCount = (db.prepare('SELECT COUNT(*) as c FROM identities').get() as { c: number }).c;
const sqliteSocialCount = (db.prepare('SELECT COUNT(*) as c FROM social_proof_index').get() as { c: number }).c;
const sqliteReportCount = (db.prepare('SELECT COUNT(*) as c FROM abuse_reports').get() as { c: number }).c;

db.close();

const identitiesOk = sqliteIdentityCount === identityCount;
const reportsOk = sqliteReportCount === reportCount;

console.log(`\n  Identities:    ${identityCount} → ${sqliteIdentityCount}  ${identitiesOk ? '✅' : '✗ MISMATCH'}`);
console.log(`  Social index:  ${socialIndexCount} entries written`);
console.log(`  Abuse reports: ${reportCount} → ${sqliteReportCount}  ${reportsOk ? '✅' : '✗ MISMATCH'}`);

if (!identitiesOk || !reportsOk) {
  console.error('\n✗ Row count mismatch! Do not switch to SQLite until this is resolved.');
  process.exit(1);
}

banner('Migration complete ✅');
console.log(`\nSQLite database written to: ${DB_SQLITE_PATH}`);
console.log('\nNext steps:');
console.log('  1. Set REDDID_DB_ENGINE=sqlite on Railway (or in .env.local to test locally)');
console.log('  2. Start the app and verify handles are accessible');
console.log('  3. If anything looks wrong: set REDDID_DB_ENGINE=json to roll back instantly');
console.log(`  4. Keep ${path.basename(DB_JSON_PATH)} on the persistent volume as a backup\n`);
