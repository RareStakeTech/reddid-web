/**
 * getStore() — DataStore singleton factory.
 *
 * Returns the active DataStore implementation. Currently: JsonFileDataStore.
 *
 * To swap backends (e.g., for production deployment):
 *   1. Implement the DataStore interface (src/lib/store/interface.ts)
 *   2. Replace `new JsonFileDataStore()` below with the new class
 *   3. No other changes required — all routes use getStore()
 *
 * All API routes and server components must call getStore() rather than
 * importing the implementation directly.
 */

import type { DataStore } from './interface';
import { JsonFileDataStore } from './json-file-store';

let _store: DataStore | null = null;

export function getStore(): DataStore {
  if (!_store) {
    _store = new JsonFileDataStore();
  }
  return _store;
}

export type { DataStore } from './interface';
