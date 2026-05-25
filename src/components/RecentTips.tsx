'use client';

/**
 * RecentTips — shows the last 5 incoming on-chain tips for a given RDD address.
 * Fetches from Blockbook v2: /api/v2/address/{addr}?details=txs&pageSize=5
 * Only displays vout entries that credit the watched address (incoming).
 */

import { useEffect, useState, useCallback } from 'react';
import { ArrowDownLeft, RefreshCw, Loader2 } from 'lucide-react';

interface TipEntry {
  txid: string;
  amount: number;        // RDD, already converted from sat
  time: number;          // unix timestamp
  confirmations: number;
}

interface BlockbookTx {
  txid: string;
  blockTime?: number;
  confirmations?: number;
  vout: { addresses?: string[]; value?: string }[];
}

interface BlockbookResp {
  transactions?: BlockbookTx[];
}

const BLOCKBOOK = 'https://blockbook.reddcoin.com';
const SAT = 1e8;

function satToRdd(s: string | undefined): number {
  return parseInt(s ?? '0', 10) / SAT;
}

function relTime(unix: number): string {
  const diff = Math.floor(Date.now() / 1000) - unix;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RecentTips({ rddAddress }: { rddAddress: string }) {
  const [tips, setTips]       = useState<TipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchTips = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const url = `${BLOCKBOOK}/api/v2/address/${encodeURIComponent(rddAddress)}?details=txs&pageSize=5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const data: BlockbookResp = await res.json();

      const incoming: TipEntry[] = (data.transactions ?? []).flatMap(tx => {
        const total = tx.vout
          .filter(o => o.addresses?.includes(rddAddress))
          .reduce((acc, o) => acc + satToRdd(o.value), 0);
        if (total <= 0) return [];
        return [{
          txid: tx.txid,
          amount: total,
          time: tx.blockTime ?? Math.floor(Date.now() / 1000),
          confirmations: tx.confirmations ?? 0,
        }];
      });

      setTips(incoming.slice(0, 5));
      setLastFetch(Date.now());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [rddAddress]);

  useEffect(() => {
    fetchTips();
    const id = setInterval(fetchTips, 60_000);
    return () => clearInterval(id);
  }, [fetchTips]);

  if (error) return null; // silent — tip page still works without this block

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '18px 20px',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <ArrowDownLeft size={14} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Recent tips
          </span>
        </div>
        <button
          onClick={fetchTips}
          disabled={loading}
          title="Refresh"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}
        >
          {loading
            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            : <RefreshCw size={12} />}
        </button>
      </div>

      {/* List */}
      {loading && tips.length === 0 ? (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', padding: '8px 0' }}>
          Loading…
        </div>
      ) : tips.length === 0 ? (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', padding: '8px 0' }}>
          No tips yet — be the first! ♥
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tips.map(tip => (
            <a
              key={tip.txid}
              href={`https://blockbook.reddcoin.com/tx/${tip.txid}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <ArrowDownLeft size={11} style={{ color: '#4ade80' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    +{tip.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} Ɍ
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    {tip.confirmations === 0 ? '⏳ unconfirmed' : relTime(tip.time)}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                {tip.txid.slice(0, 8)}…
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      {tips.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <a
            href={`https://blockbook.reddcoin.com/address/${rddAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textDecoration: 'none' }}
          >
            View all on Blockbook →
          </a>
          {lastFetch > 0 && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', float: 'right' }}>
              updated {relTime(Math.floor(lastFetch / 1000))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
