import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getIdentityByHandle } from '@/lib/db';
import { primaryRddAddress } from '@/lib/types';
import LiveSession from '@/components/LiveSession';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const identity = getIdentityByHandle(handle);
  if (!identity) return { title: 'Live session — ReddID' };
  const name = identity.displayName ?? `@${identity.handle}`;
  return {
    title: `${name} — Live tip session · ReddRail prototype`,
    description: `Watch live Ɍ RDD tips arriving for ${name}. ReddRail social payments prototype.`,
  };
}

export default async function LivePage({ params }: Props) {
  const { handle } = await params;
  const identity = getIdentityByHandle(handle.toLowerCase());
  if (!identity) notFound();

  const displayName = identity.displayName ?? `@${identity.handle}`;
  const addr = primaryRddAddress(identity) ?? '';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 20px' }}>

      {/* ── Demo mode banner — must be visible before any public demo ── */}
      <div
        style={{
          background: 'rgba(251,191,36,0.07)',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.8rem',
          color: '#d4a017',
        }}
      >
        <span style={{ fontWeight: 700 }}>Demo Mode — Simulated Activity.</span>
        {' '}Tip events on this page are generated locally. No real RDD transactions are shown.
      </div>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <Link
            href={`/${identity.handle}`}
            style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← {displayName}
          </Link>
        </div>
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            fontWeight: 800,
            fontFamily: "'Rubik', sans-serif",
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          {displayName}
          <span style={{ color: 'var(--redd-red)', marginLeft: 12 }}>Live</span>
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Real-time Ɍ RDD tip session — ReddRail prototype
        </p>
      </div>

      {/* Live session component */}
      <LiveSession handle={identity.handle} rddAddress={addr} />

      {/* Architecture section */}
      <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 32 }}>
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-dim)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          How ReddRail works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            {
              phase: 'Today — v0.1',
              title: 'Direct on-chain tips',
              body: 'Every tip is a native Ɍ RDD transaction. Visible on blockbook.reddcoin.com. No intermediary.',
              color: '#60a5fa',
            },
            {
              phase: 'ReddRail — v0.3',
              title: 'State channel sessions',
              body: 'Open a channel, batch micro-tips, settle once on-chain. Powered by Gajumaru: 300+ TPS, 2–3s micro-block settlement.',
              color: 'var(--redd-red)',
            },
            {
              phase: 'ReddRail — v0.4',
              title: 'AI-agent payments',
              body: 'Bots and AI agents tip and pay per-use through the same rail. Programmable micro-payment policies.',
              color: '#a78bfa',
            },
          ].map(({ phase, title, body, color }) => (
            <div
              key={phase}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 18px',
              }}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                {phase}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", marginBottom: 6 }}>
                {title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                {body}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 16,
            background: 'rgba(227,6,19,0.04)',
            border: '1px solid rgba(227,6,19,0.15)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: 'var(--text-muted)' }}>Gajumaru infrastructure:</strong>{' '}
          Groot mainnet launched October 2024 — 300+ TPS, 43 billion tx/day per node capacity, 3–4 minute finality.
          Associate Chain support (enabling RDD-denominated state channels) is expected Q3/Q4 2026.
          Until then, this page runs in demo mode with simulated tip events.{' '}
          <Link href="/roadmap" style={{ color: 'var(--redd-red)', textDecoration: 'none' }}>See roadmap →</Link>
        </div>
      </div>

    </div>
  );
}
