/**
 * db.ts — backwards-compatibility shim for v0.4 refactor.
 *
 * All persistence logic is now in src/lib/store/.
 * This file preserves the original export surface so the 14 existing import
 * sites continue to work without changes during the v0.4 sprint.
 *
 * New code should import from '@/lib/store' (getStore) or '@/lib/types' directly.
 * This shim will be thinned further as routes migrate to getStore() in Commit 9+.
 */

// ── Type re-exports ───────────────────────────────────────────────────────────
export type {
  Identity,
  SocialProof,
  CreateIdentityInput,
  UpdateIdentityInput,
  ReserveSnapshot,
} from './types';

// ── Store re-export ───────────────────────────────────────────────────────────
export { getStore } from './store';

// ── Function delegates ────────────────────────────────────────────────────────
// Each function simply calls getStore() and delegates. No logic lives here.

import { getStore as _getStore } from './store';
import type {
  Identity,
  SocialProof,
  CreateIdentityInput,
  UpdateIdentityInput,
} from './types';

export const getIdentityByHandle = (handle: string): Identity | null =>
  _getStore().getIdentityByHandle(handle);

export const getIdentityByAddress = (rddAddress: string): Identity | null =>
  _getStore().getIdentityByAddress(rddAddress);

export const getIdentityBySocial = (
  platform: string,
  username: string,
): Identity | null => _getStore().getIdentityBySocial(platform, username);

export const getAllIdentities = (): Identity[] =>
  _getStore().getAllIdentities();

export const countIdentities = (): number =>
  _getStore().countIdentities();

export const createIdentity = (input: CreateIdentityInput): Identity =>
  _getStore().createIdentity(input);

export const updateIdentity = (
  handle: string,
  editToken: string,
  updates: UpdateIdentityInput,
): Identity => _getStore().updateIdentity(handle, editToken, updates);

export const createVerificationChallenge = (
  handle: string,
  platform: string,
  editToken: string,
): { code: string; expiresAt: string } =>
  _getStore().createVerificationChallenge(handle, platform, editToken);

export const confirmSocialProof = (
  handle: string,
  platform: string,
  username: string,
  proofUrl: string,
  editToken: string,
): Identity =>
  _getStore().confirmSocialProof(handle, platform, username, proofUrl, editToken);

export const addSocialProof = (
  handle: string,
  proof: Omit<SocialProof, 'addedAt'>,
): Identity => _getStore().addSocialProof(handle, proof);

export const getReserveSnapshot = () =>
  _getStore().getReserveSnapshot();

/**
 * Strip private fields before returning to public API consumers.
 * Re-exported here for shim compatibility; will move to types.ts in Commit 9.
 */
export function publicIdentity(
  identity: Identity,
): Omit<Identity, 'editToken' | 'verificationChallenges'> {
  const { editToken: _et, verificationChallenges: _vc, ...pub } = identity;
  return pub;
}
