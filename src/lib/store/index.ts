/**
 * getStore() — DataStore singleton factory.
 *
 * Returns the active DataStore implementation, selected by REDDID_DB_ENGINE:
 *   'json'   → JsonFileDataStore (default)
 *   'sqlite' → SqliteDataStore (Sprint 4 S4-01 — not yet built; throws until available)
 *
 * To add a new backend:
 *   1. Implement DataStore interface (src/lib/store/interface.ts)
 *   2. Add a branch below for the new engine value
 *   3. No other changes required — all routes call getStore()
 *
 * All API routes and server components must call getStore() rather than
 * importing the implementation directly.
 */

import type { DataStore } from './interface';
import { JsonFileDataStore } from './json-file-store';
import { SqliteDataStore } from './sqlite-store';
import { runMigrations } from '@/lib/migrate';
import { DB_ENGINE } from '@/lib/config';

let _store: DataStore | null = null;

export function getStore(): DataStore {
  if (!_store) {
    if (DB_ENGINE === 'sqlite') {
      // SqliteDataStore: no JSON migration needed — the SQLite file bootstraps its
      // own schema in the constructor. runMigrations() is JSON-only; skip it here.
      // Run `npm run migrate:sqlite` (scripts/migrate-to-sqlite.ts) once to import
      // existing data/db.json records before flipping REDDID_DB_ENGINE=sqlite.
      _store = new SqliteDataStore();
    } else {
      // Default: JSON file store. Runs schema migrations exactly once per process.
      runMigrations();
      _store = new JsonFileDataStore();
    }
  }
  return _store;
}

/** Expose SqliteDataStore for the rate-limit module when using sqlite engine. */
export { SqliteDataStore } from './sqlite-store';

export type { DataStore } from './interface';
