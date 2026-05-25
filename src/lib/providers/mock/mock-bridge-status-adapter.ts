/**
 * MockBridgeStatusAdapter — returns zeroed snapshot with isLive:false.
 *
 * This is the only implementation in MVP. The /reserve page checks isLive
 * and shows "Not Live — Placeholder Data" banner when false.
 *
 * Swap for LiveBridgeStatusAdapter when:
 *   - Gajumaru QPQ is operational AND
 *   - A reserve watcher service (or on-chain query) is available.
 *
 * See docs/ARCHITECTURE.md — Reserve section.
 */

import type { BridgeStatusAdapter } from '@/lib/providers/bridge-status-adapter';
import type { ReserveSnapshot } from '@/lib/types';

export class MockBridgeStatusAdapter implements BridgeStatusAdapter {
  async getSnapshot(): Promise<ReserveSnapshot> {
    return {
      nativeRddReserve: 0,
      pendingRedemptions: 0,
      backingAvailable: 0,
      totalRepresented: 0,
      backingRatio: null,
      lastUpdated: new Date().toISOString(),
      reserveAddresses: [],
      isLive: false,
    };
  }

  isLive(): boolean {
    return false;
  }
}
