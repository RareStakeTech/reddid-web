'use client';

import { useEffect, useRef, useState } from 'react';
import CopyButton from '@/components/CopyButton';

interface TipEvent {
  tipper: string;
  amount: number;
  timestamp: string;
}


function formatRdd(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(2)}K`;
  return n.toLocaleString();
}

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedCounter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const start  = useRef(0);
  const from   = useRef(0);
  const raf    = useRef<number | null>(null);

  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    from.current  = display;
    start.current = performance.now();

    function step(now: number) {
      const elapsed = now - start.current;
      const t = Math.min(elapsed / duration, 1);
      const current = Math.round(from.current + (target - from.current) * easeOut(t));
      setDisplay(current);
      if (t < 1) raf.current = requestAnimationFrame(step);
    }

    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <span>{formatRdd(display)}</span>;
}

export default function LiveSession({ handle, rddAddress }: { handle: string; rddAddress: string }) {
  const [tips, setTips]         = useState<TipEvent[]>([]);
  const [total, setTotal]       = useState(0);
  const [status, setStatus]     = useState<'connecting' | 'live' | 'error'>('connecting');
  const [elapsed, setElapsed]   = useState(0);
  const startTime               = useRef(Date.now());
  const bip21                   = `reddcoin:${rddAddress}`;

  // Elapsed session timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  function formatElapsed(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // SSE connection
  useEffect(() => {
    const es = new EventSource(`/api/live/${handle}/events`);

    es.addEventListener('init', () => setStatus('live'));

    es.addEventListener('tip', (e) => {
      const tip: TipEvent = JSON.parse(e.data);
      setTips(prev => [tip, ...prev].slice(0, 10));
      setTotal(prev => prev + tip.amount);
    });

    es.onerror = () => setStatus('error');

    return () => es.close();
  }, [handle]);

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 10,
  };

  return (
    <div>
      {/* Live indicator + timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              display: 'inline-block',
              width: 9, height: 9,
              borderRadius: '50%',
              background: status === 'live' ? 'var(--redd-red)' : status === 'error' ? '#f87171' : '#555',
              boxShadow: status === 'live' ? '0 0 0 3px rgba(227,6,19,0.25)' : 'none',
              animation: status === 'live' ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ fontWeight: 700, fontSize: '0.72rem', color: status === 'live' ? 'var(--redd-red)' : 'var(--text-dim)', letterSpacing: '0.1em' }}>
            {status === 'connecting' ? 'CONNECTING…' : status === 'error' ? 'DISCONNECTED' : 'LIVE SESSION'}
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          {formatElapsed(elapsed)}
        </span>
        <span style={{
          fontSize: '0.65rem',
          background: 'rgba(227,6,19,0.1)',
          border: '1px solid rgba(227,6,19,0.2)',
          color: 'var(--redd-red)',
          borderRadius: 4,
          padding: '1px 7px',
          fontWeight: 600,
        }}>
          PROTOTYPE
        </span>
      </div>

      {/* Big counter */}
      <div
        style={{
          textAlign: 'center',
          padding: '32px 20px',
          background: 'linear-gradient(135deg, #160606, #0e0606)',
          border: '1px solid rgba(227,6,19,0.2)',
          borderRadius: 14,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Session total
        </div>
        <div
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            fontWeight: 800,
            fontFamily: "'Rubik', sans-serif",
            color: 'var(--redd-red)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Ɍ <AnimatedCounter target={total} />
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 8 }}>
          {tips.length} tip{tips.length !== 1 ? 's' : ''} this session
        </div>
      </div>

      {/* Tip feed */}
      <div style={{ marginBottom: 20 }}>
        <div style={sectionLabel}>Recent tips</div>
        {tips.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
            {status === 'live' ? 'Waiting for first tip…' : 'Connecting…'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tips.map((tip, i) => (
              <div
                key={`${tip.timestamp}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: i === 0 ? 'rgba(227,6,19,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === 0 ? 'rgba(227,6,19,0.2)' : 'var(--border)'}`,
                  borderRadius: 7,
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  transition: 'all 0.3s ease',
                }}
              >
                <span>
                  <span style={{ color: 'var(--redd-red)', marginRight: 6 }}>🔴</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {tip.tipper === 'anonymous' ? 'anonymous' : `@${tip.tipper}`}
                  </span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>tipped</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Rubik', sans-serif" }}>
                    Ɍ {formatRdd(tip.amount)}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    {relTime(tip.timestamp)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to tip */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '18px 20px',
        }}
      >
        <div style={sectionLabel}>Send a tip now</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#0a0a0a',
            border: '1px solid var(--border)',
            borderRadius: 7,
            padding: '10px 12px',
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <code style={{ flex: 1, fontSize: '0.78rem', color: '#d4d4d4', wordBreak: 'break-all', minWidth: 0 }}>
            {rddAddress}
          </code>
          <CopyButton text={rddAddress} label="Address" />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CopyButton text={bip21} label="BIP21 URI" />
          <a
            href={bip21}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--redd-red)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: "'Rubik', sans-serif",
            }}
          >
            💳 Open wallet
          </a>
        </div>
        <p style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Every tip is a real Ɍ RDD on-chain transaction. No custodian, no intermediary.
          Visible on <a href={`https://blockbook.reddcoin.com/address/${rddAddress}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)' }}>blockbook.reddcoin.com</a>.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
