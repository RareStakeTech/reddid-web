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
  PublicIdentity,
  PublicAgent,
  SocialProof,
  CreateIdentityInput,
  UpdateIdentityInput,
  ReserveSnapshot,
  StoredAbuseReport,
} from './types';

// ── Store re-export ───────────────────────────────────────────────────────────
export { getStore } from './store';

// ── Function delegates ────────────────────────────────────────────────────────
// Each function simply calls getStore() and delegates. No logic lives here.

import { getStore as _getStore } from './store';
import type {
  Identity,
  PublicIdentity,
  PublicAgent,
  SocialProof,
  CreateIdentityInput,
  UpdateIdentityInput,
  StoredAbuseReport,
  ProofMethod,
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

/**
 * Returns { identity, revocationKeyPlaintext }.
 * Caller must pass revocationKeyPlaintext to the user exactly once.
 */
export const createIdentity = (
  input: CreateIdentityInput,
): { identity: Identity; revocationKeyPlaintext: string } =>
  _getStore().createIdentity(input);

export const updateIdentity = (
  handle: string,
  editToken: string,
  updates: UpdateIdentityInput,
): Identity => _getStore().updateIdentity(handle, editToken, updates);

export const reissueToken = (
  handle: string,
  editToken: string,
): { editToken: string; expiresAt: string } =>
  _getStore().reissueToken(handle, editToken);

export const deleteIdentity = (handle: string, editToken: string): void =>
  _getStore().deleteIdentity(handle, editToken);

export const exportIdentity = (
  handle: string,
  editToken: string,
): Omit<Identity, 'revocationKey'> =>
  _getStore().exportIdentity(handle, editToken);

export const recoverByRevocationKey = (
  handle: string,
  revocationKey: string,
): { editToken: string; expiresAt: string } =>
  _getStore().recoverByRevocationKey(handle, revocationKey);

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
  proofMethod?: ProofMethod,
): Identity =>
  _getStore().confirmSocialProof(handle, platform, username, proofUrl, editToken, proofMethod);

export const addSocialProof = (
  handle: string,
  proof: Omit<SocialProof, 'addedAt'>,
): Identity => _getStore().addSocialProof(handle, proof);

export const removeSocialProof = (
  handle: string,
  platform: string,
  editToken: string,
): Identity => _getStore().removeSocialProof(handle, platform, editToken);

export const getReserveSnapshot = () =>
  _getStore().getReserveSnapshot();

export const saveAbuseReport = (report: StoredAbuseReport): void =>
  _getStore().saveAbuseReport(report);

export const getAbuseReports = (): StoredAbuseReport[] =>
  _getStore().getAbuseReports();

export const markReportReviewed = (reportId: string, note?: string): StoredAbuseReport =>
  _getStore().markReportReviewed(reportId, note);

/**
 * Serialize an identity for public API consumption.
 *
 * Strips:  editToken, verificationChallenges, revocationKey, rddAddress (deprecated)
 * Filters: wallets[] → public/unlisted only, non-revoked only
 * Filters: agents[]  → non-revoked only, spend limits stripped
 *
 * Return type PublicIdentity enforces at compile time that private fields
 * cannot be accidentally leaked downstream.
 */
export function publicIdentity(identity: Identity): PublicIdentity {
  const {
    editToken: _et,
    verificationChallenges: _vc,
    revocationKey: _rk,
    rddAddress: _addr,
    wallets,
    agents,
    socialProofs,
    ...rest
  } = identity;

  const publicWallets = (wallets ?? []).filter(
    w => !w.revokedAt && w.visibility !== 'private',
  );

  const publicAgents: PublicAgent[] = (agents ?? [])
    .filter(a => !a.revokedAt)
    .map(({ perTxLimitRdd: _p, dailyLimitRdd: _d, monthlyLimitRdd: _m,
             allowedRecipients: _r, humanApprovalThresholdRdd: _h, ...pub }) => pub as PublicAgent);

  // S3-08: strip proofUrl from public-facing social proofs — it may reveal
  // content the user has since removed and is not needed by any API consumer.
  // S3-04: filter out revoked proofs — they should not appear in the public tip page.
  const publicSocialProofs = (socialProofs ?? [])
    .filter(p => p.verificationStatus !== 'revoked')
    .map(({ proofUrl: _pu, ...proof }) => proof);

  return {
    ...rest,
    wallets: publicWallets,
    agents: publicAgents,
    socialProofs: publicSocialProofs,
  };
}
