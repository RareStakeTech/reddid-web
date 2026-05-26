import Link from 'next/link';
import { AtSign, Zap, Link2, Bot, Scale } from 'lucide-react';
import { countIdentities } from '@/lib/db';
import CountUp from '@/components/CountUp';
import MarketTicker from '@/components/MarketTicker';

export const dynamic = 'force-dynamic';

function StatCard({ value, animateTarget, label }: { value: string | number; animateTarget?: number; label: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '20px 28px',
        textAlign: 'center',
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", color: 'var(--text-primary)' }}>
        {animateTarget !== undefined ? <CountUp target={animateTarget} /> : value}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.04em' }}>{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    Icon: AtSign,
    title: 'Human-readable @handles',
    desc: 'Register @yourname and share a clean tip URL. Anyone can send Ɍ RDD to your name — no long addresses, no friction.',
  },
  {
    Icon: Zap,
    title: 'Instant tip pages + payment QR',
    desc: 'redd.love/@yourname — a public tip page with your RDD address, a BIP21 QR code, and a focused /pay page for payers.',
  },
  {
    Icon: Link2,
    title: 'Social identity across 13 platforms',
    desc: 'Link Twitter, YouTube, GitHub, Twitch, Bluesky, and 8 more. The Love Button browser extension surfaces a tip button next to Follow on every one.',
  },
  {
    Icon: Bot,
    title: 'Agent delegation — v0.4 types, UI coming',
    desc: 'Authorize AI agents and bots to tip on your behalf — with strict per-tx limits, required public disclosure, and instant revocation.',
  },
  {
    Icon: Scale,
    title: 'Transparent reserve model',
    desc: 'When ReddRail launches, all represented Ɍ RDD will be backed by native RDD in publicly auditable reserve wallets. Non-custodial by design.',
  },
];

export default async function HomePage() {
  const identityCount = countIdentities();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 20px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              background: 'var(--redd-red-pale)',
              border: '1px solid var(--redd-red-border)',
              color: 'var(--redd-red-light)',
              fontSize: '0.72rem',
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.1em',
              padding: '4px 14px',
              borderRadius: 20,
              textTransform: 'uppercase',
            }}
          >
            v0.4 beta · Native Ɍ RDD only
          </span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 6vw, 3.2rem)',
            fontWeight: 700,
            fontFamily: "'Rubik', sans-serif",
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 18,
            letterSpacing: '-0.02em',
          }}
        >
          Your @handle for
          <br />
          <span style={{ color: 'var(--redd-red)' }}>Ɍ ReddCoin social payments</span>
        </h1>
        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            maxWidth: 520,
            margin: '0 auto 32px',
            lineHeight: 1.75,
          }}
        >
          Register a human-readable identity. Link your Ɍ RDD wallet.
          Let anyone tip you by name — no long addresses, no friction.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/register"
            style={{
              background: 'var(--redd-red)',
              color: 'white',
              textDecoration: 'none',
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '12px 28px',
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.15s',
            }}
          >
            <AtSign size={16} />
            Register @handle
          </Link>
          <Link
            href="/roadmap"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 500,
              fontSize: '0.95rem',
              padding: '12px 24px',
              borderRadius: 8,
              display: 'inline-block',
            }}
          >
            View Roadmap →
          </Link>
        </div>
      </div>

      {/* Market ticker */}
      <div style={{ marginBottom: 24 }}>
        <MarketTicker />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 64, flexWrap: 'wrap' }}>
        <StatCard value={identityCount} animateTarget={identityCount} label="Registered @handles" />
        <StatCard value="v0.4" label="Current version" />
        <StatCard value="Ɍ Native RDD" label="Root asset" />
        <StatCard value="13" label="Platforms supported" />
      </div>

      {/* Features */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '36px',
          marginBottom: 48,
        }}
      >
        <h2 style={{ fontWeight: 700, fontFamily: "'Rubik', sans-serif", fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 28 }}>
          What ReddID Next does
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div
                style={{
                  background: 'var(--redd-red-pale)',
                  border: '1px solid var(--redd-red-border)',
                  borderRadius: 8,
                  padding: '8px',
                  lineHeight: 0,
                  flexShrink: 0,
                  color: 'var(--redd-red)',
                }}
              >
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontFamily: "'Rubik', sans-serif", fontSize: '0.95rem', color: 'var(--text-primary)' }}>{title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Beta notice */}
      <div
        style={{
          border: '1px solid rgba(234,179,8,0.3)',
          background: 'rgba(234,179,8,0.04)',
          borderRadius: 10,
          padding: '20px 24px',
          marginBottom: 40,
        }}
      >
        <div style={{ fontWeight: 600, fontFamily: "'Rubik', sans-serif", color: '#f0c040', fontSize: '0.85rem', marginBottom: 6 }}>
          ⚠ Public Beta — v0.4
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.7, margin: 0 }}>
          Registration is open. Handle registration uses format validation — cryptographic address-ownership
          proof (wallet signature) ships in v0.5. Do not register a handle you cannot reclaim if needed.
          Social proof challenge-post flow is live but trust-based; platform API verification comes in v0.5.
          No payment channels are live yet — tip pages display your Ɍ RDD address for direct wallet-to-wallet tips.
          ReddRail (high-throughput social-payment channels) integrates once Gajumaru Associate Chain tooling is available.
        </p>
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { href: '/explore',  label: '→ Explore creators' },
          { href: '/platforms',label: '→ Supported platforms' },
          { href: '/reserve',  label: '→ Reserve model' },
          { href: '/roadmap',  label: '→ Build roadmap' },
          { href: '/docs',     label: '→ Architecture' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontFamily: "'Rubik', sans-serif",
              fontSize: '0.85rem',
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
