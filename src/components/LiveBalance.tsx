'use client';

import { useEffect, useState } from 'react';

interface BalanceData {
  balance: number;
  totalReceived: number;
  txs: number;
}

function formatRdd(val: number): string {
  if (val === 0) return '0';
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(2)}K`;
  return val.toFixed(4);
}

export default function LiveBalance({ address }: { address: string }) {
  const [data, setData]       = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  async function fetchBalance() {
    try {
      const blockbookUrl =
        process.env.NEXT_PUBLIC_REDDID_BLOCKBOOK_URL ?? 'https://blockbook.reddcoin.com';
      const res = await fetch(
        `${blockbookUrl}/api/v2/address/${encodeURIComponent(address)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      setData({
        balance:       parseInt(json.balance       ?? '0', 10) / 1e8,
        totalReceived: parseInt(json.totalReceived ?? '0', 10) / 1e8,
        txs:           json.txs ?? 0,
      });
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBalance();
    const timer = setInterval(fetchBalance, 60_000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const dim: React.CSSProperties = { color: 'var(--text-dim)', fontSize: '0.7rem' };
  const val: React.CSSProperties = { fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' };
  const row: React.CSSProperties = { display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' };

  if (loading) {
    return (
      <div style={{ ...dim, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span
          style={{
            display: 'inline-block',
            width: 10, height: 10,
            border: '1.5px solid var(--border)',
            borderTopColor: 'var(--redd-red)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        Fetching live data…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ ...dim, marginTop: 8, fontStyle: 'italic' }}>
        Explorer data unavailable
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={row}>
        <div>
          <span style={val}>Ɍ {formatRdd(data.balance)}</span>
          <span style={{ ...dim, marginLeft: 4 }}>balance</span>
        </div>
        <div>
          <span style={val}>Ɍ {formatRdd(data.totalReceived)}</span>
          <span style={{ ...dim, marginLeft: 4 }}>total received</span>
        </div>
        <div>
          <span style={val}>{data.txs}</span>
          <span style={{ ...dim, marginLeft: 4 }}>txns</span>
        </div>
        <button
          onClick={fetchBalance}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.65rem',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: 3,
          }}
          title="Refresh"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
