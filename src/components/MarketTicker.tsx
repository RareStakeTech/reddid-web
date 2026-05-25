'use client';

/**
 * MarketTicker — live RDD price widget via CoinGecko public API.
 * No API key required for low-frequency requests.
 * Falls back silently if the request fails (returns null).
 */

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CoinData {
  usd: number;
  usd_24h_change: number;
  usd_market_cap: number;
  usd_24h_vol: number;
}

function fmt(n: number, decimals = 6): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(decimals)}`;
}

export default function MarketTicker({ compact = false }: { compact?: boolean }) {
  const [data, setData]       = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=reddcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true',
          { next: { revalidate: 60 } } // Next.js cache hint (client-side no-op, but harmless)
        );
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (!json?.reddcoin?.usd) throw new Error('no data');
        setData(json.reddcoin as CoinData);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const id = setInterval(fetchPrice, 5 * 60_000); // refresh every 5 min
    return () => clearInterval(id);
  }, []);

  if (loading || error || !data) return null;

  const change = data.usd_24h_change ?? 0;
  const positive = change > 0;
  const neutral   = Math.abs(change) < 0.01;
  const changeColor = neutral ? 'var(--text-dim)' : positive ? '#4ade80' : '#f87171';
  const TrendIcon = neutral ? Minus : positive ? TrendingUp : TrendingDown;

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '4px 12px',
        fontSize: '0.78rem',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          Ɍ {fmt(data.usd, 6)}
        </span>
        <span style={{ color: changeColor, display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendIcon size={11} />
          {Math.abs(change).toFixed(2)}%
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      gap: 24,
      flexWrap: 'wrap',
      alignItems: 'center',
    }}>
      {/* Price + change */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Ɍ RDD
        </span>
        <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: "'Rubik', sans-serif", color: 'var(--text-primary)' }}>
          {fmt(data.usd, 8)}
        </span>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: changeColor, display: 'flex', alignItems: 'center', gap: 3 }}>
          <TrendIcon size={13} />
          {positive ? '+' : ''}{change.toFixed(2)}%
          <span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--text-dim)' }}>24h</span>
        </span>
      </div>

      {/* Market cap */}
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Market cap</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>{fmt(data.usd_market_cap, 0)}</div>
      </div>

      {/* Volume */}
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>24h volume</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>{fmt(data.usd_24h_vol, 0)}</div>
      </div>

      {/* Source */}
      <div style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
        via CoinGecko
      </div>
    </div>
  );
}
