/**
 * BridgeStatusAdapter — fetches the current reserve/bridge status.
 *
 * In MVP: mock implementation returns zeros (isLive: false).
 * In v1.0: LiveBridgeStatusAdapter will query the Gajumaru QPQ or a
 *   designated reserve address watcher.
 *
 * The /reserve page always checks isLive before displaying data.
 * If isLive is false, the "Not Live — Placeholder Data" banner shows.
 *
 * See docs/ARCHITECTURE.md — Reserve section.
 */

import type { ReserveSnapshot } from '@/lib/types';

export interface BridgeStatusAdapter {
  /**
   * Fetch the current reserve and bridge status.
   * Must never throw — return zeroed snapshot with isLive:false on error.
   */
  getSnapshot(): Promise<ReserveSnapshot>;

  /** Whether this adapter is connected to live data. */
  isLive(): boolean;
}

export type { ReserveSnapshot } from '@/lib/types';
