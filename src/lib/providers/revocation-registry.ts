/**
 * RevocationRegistry — permanent, auditable log of all revocation events.
 *
 * Revocation is a first-class operation. Records are never silently deleted
 * when revocation is semantically important. This registry stores the permanent
 * audit trail.
 *
 * See docs/REVOCATION.md for the full revocation model.
 */

import type { RevocationEvent, RevocationTargetType } from '@/lib/types';

export interface RecordRevocationInput {
  targetType: RevocationTargetType;
  targetId: string;
  targetHandle: string;
  revokedBy: string;
  reason: string;
  visibility: 'public' | 'private';
}

export interface RevocationRegistry {
  /** Record a new revocation event. Returns the stored event with generated id. */
  record(input: RecordRevocationInput): RevocationEvent;

  /** Get the revocation event for a specific target, if any. */
  getByTarget(targetId: string): RevocationEvent | null;

  /** Get all revocation events concerning a specific handle. */
  getByHandle(handle: string): RevocationEvent[];

  /** Quick check: has this target been revoked? */
  isRevoked(targetId: string): boolean;
}

export type { RevocationEvent } from '@/lib/types';
