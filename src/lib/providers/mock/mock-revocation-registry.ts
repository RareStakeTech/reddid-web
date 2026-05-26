/**
 * MockRevocationRegistry — stores RevocationEvents in db.json.
 *
 * Unlike most "mocks," this one persists real data. It is called "mock" because
 * it uses the flat JSON file store rather than a production database.
 * The revocation logic is real and should be used as-is in production
 * by replacing the storage backend, not the logic.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { RevocationRegistry, RecordRevocationInput } from '@/lib/providers/revocation-registry';
import type { RevocationEvent, DbSchema } from '@/lib/types';
import { DB_PATH } from '@/lib/config';

function readRevocationEvents(): RevocationEvent[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(raw) as DbSchema;
    return db.revocationEvents ?? [];
  } catch {
    return [];
  }
}

function writeRevocationEvent(event: RevocationEvent): void {
  let db: DbSchema;
  try {
    if (!fs.existsSync(DB_PATH)) {
      db = { identities: [], revocationEvents: [], abuseReports: [], version: 1 };
    } else {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as DbSchema;
    }
  } catch {
    db = { identities: [], revocationEvents: [], abuseReports: [], version: 1 };
  }
  if (!db.revocationEvents) db.revocationEvents = [];
  db.revocationEvents.push(event);
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export class MockRevocationRegistry implements RevocationRegistry {
  record(input: RecordRevocationInput): RevocationEvent {
    const event: RevocationEvent = {
      id: crypto.randomBytes(8).toString('hex'),
      ...input,
      createdAt: new Date().toISOString(),
    };
    writeRevocationEvent(event);
    return event;
  }

  getByTarget(targetId: string): RevocationEvent | null {
    const events = readRevocationEvents();
    return events.find(e => e.targetId === targetId) ?? null;
  }

  getByHandle(handle: string): RevocationEvent[] {
    return readRevocationEvents().filter(e => e.targetHandle === handle);
  }

  isRevoked(targetId: string): boolean {
    return this.getByTarget(targetId) !== null;
  }
}
