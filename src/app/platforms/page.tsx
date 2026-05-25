import type { Metadata } from 'next';
import Link from 'next/link';
import { GitFork, CheckCircle, Clock, Layers, ExternalLink } from 'lucide-react';
import { PLATFORMS, LIVE_PLATFORMS } from '@/lib/platforms';
import type { PlatformDef, PlatformStatus } from '@/lib/platforms';

export const metadata: Metadata = {
  title: 'Supported Platforms — ReddID Next',
  description:
    'ReddID supports 13 live platforms and counting. The plugin architecture lets any developer add a new network in ~30 lines of JS.',
};

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; summary: string }> = {
  mainstream: {
    label: 'Mainstream',
    summary:
      'The largest networks by audience. Most likely to resist third-party monetization tools — which is exactly why it matters that creators can receive tips there anyway.',
  },
  alternative: {
    label: 'Creator-aligned',
    summary:
      'Platforms that lean into creator ownership, crypto-friendly audiences, or both. These are the platforms most receptive to RDD tipping from day one.',
  },
  decentralized: {
    label: 'Decentralized / Federated',
    summary:
      'Open protocols where no single company controls the social graph. Philosophically aligned with ReddCoin\'s peer-to-peer roots.',
  },
  creator: {
    label: 'Creator platforms',
    summary:
      'Newsletter and publishing platforms where individual creators own their audience.',
  },
  developer: {
    label: 'Developer',
    summary:
      'Code-hosting platforms where open-source contributors can receive tips for their work.',
  },
};

const STATUS_CONFIG: Record<PlatformStatus, {
  label: string; bg: string; color: string; border: string;
}> = {
  live: {
    label: 'Live',
    bg: 'rgba(74,222,128,0.08)',
    color: '#4ade80',
    border: 'rgba(74,222,128,0.25)',
  },
  beta: {
    label: 'Beta',
    bg: 'rgba(96,165,250,0.08)',
    color: '#60a5fa',
    border: 'rgba(96,165,250,0.25)',
  },
  planned: {
    label: 'Planned',
    bg: 'rgba(251,191,36,0.07)',
    color: '#fbbf24',
    border: 'rgba(251,191,36,0.22)',
  },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PlatformStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        padding: '2px 7px',
        borderRadius: 4,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {status === 'live' && <CheckCircle size={9} />}
      {status === 'planned' && <Clock size={9} />}
      {cfg.label}
    </span>
  );
}

function PlatformCard({ p }: { p: PlatformDef }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${p.status === 'planned' ? 'rgba(251,191,36,0.35)' : p.color}`,
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: p.status === 'planned' ? 0.75 : 1,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              fontSize: '1.25rem',
              lineHeight: 1,
              flexShrink: 0,
              color: p.color,
              filter: p.status === 'planned' ? 'grayscale(0.5)' : 'none',
            }}
          >
            {p.icon}
          </span>
          <span
            style={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            {p.name}
          </span>
        </div>
        <StatusBadge status={p.status} />
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '0.76rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          margin: 0,
          flex: 1,
        }}
      >
        {p.description}
      </p>

      {/* Footer chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <code
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            padding: '1px 7px',
            borderRadius: 3,
            fontSize: '0.66rem',
            color: 'var(--text-dim)',
            fontFamily: 'monospace',
          }}
        >
          {p.id}
        </code>
        {p.federated && (
          <span
            style={{
              background: 'rgba(99,100,255,0.10)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,100,255,0.22)',
              padding: '1px 7px',
              borderRadius: 3,
              fontSize: '0.66rem',
            }}
          >
            federated
          </span>
        )}
        {p.placeholder && (
          <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>
            e.g.{' '}
            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              {p.placeholder}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformsPage() {
  const liveCount    = LIVE_PLATFORMS.length;
  const plannedCount = PLATFORMS.filter(p => p.status === 'planned').length;

  // Preserve insertion order for categories
  const categories = [...new Set(PLATFORMS.map(p => p.category))];

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '40px 20px' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Layers size={20} style={{ color: 'var(--redd-red)' }} />
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              fontFamily: "'Rubik', sans-serif",
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Platform coverage
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: 620 }}>
          ReddID and the Love Button browser extension support{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{liveCount} platforms today</strong>
          {' '}and{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{plannedCount} more are planned</strong>
          . The plugin architecture makes adding a new network a 30-line pull request.
        </p>

        {/* Status summary */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {(Object.entries(STATUS_CONFIG) as [PlatformStatus, typeof STATUS_CONFIG[PlatformStatus]][]).map(
            ([status, cfg]) => {
              const count = PLATFORMS.filter(p => p.status === status).length;
              if (!count) return null;
              return (
                <div
                  key={status}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    borderRadius: 8,
                    padding: '8px 14px',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: cfg.color, fontFamily: "'Rubik', sans-serif" }}>
                    {count}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* ── Platform matrix ──────────────────────────────────────────────── */}
      {categories.map(cat => {
        const catMeta    = CATEGORY_META[cat];
        const platforms  = PLATFORMS.filter(p => p.category === cat);
        if (!platforms.length || !catMeta) return null;

        return (
          <section key={cat} style={{ marginBottom: 44 }}>
            <div style={{ marginBottom: 14 }}>
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily: "'Rubik', sans-serif",
                  color: 'var(--text-primary)',
                  marginBottom: 5,
                }}
              >
                {catMeta.label}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 680 }}>
                {catMeta.summary}
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 12,
              }}
            >
              {platforms.map(p => <PlatformCard key={p.id} p={p} />)}
            </div>
          </section>
        );
      })}

      {/* ── Plugin spec callout ──────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 16,
          background: 'rgba(227,6,19,0.04)',
          border: '1px solid rgba(227,6,19,0.18)',
          borderRadius: 12,
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              background: 'rgba(227,6,19,0.12)',
              borderRadius: 8,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GitFork size={18} style={{ color: 'var(--redd-red)' }} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                fontFamily: "'Rubik', sans-serif",
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              Adding a platform takes ~30 lines of JS
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 580 }}>
              The Love Button extension uses a lightweight plugin architecture. Every platform is
              an independent content script that implements a simple three-step contract:
              detect the profile URL, look up the ReddID handle, and inject the Tip button.
              The shared <code style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>ReddIDPlatformUtil</code> library
              handles lookup, button creation, SPA navigation watching, and floating fallback.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {[
            { n: '1', title: 'detectProfile(url)', desc: 'Match the URL pattern. Return { username } or null.' },
            { n: '2', title: 'tryLookup()', desc: 'Call the shared util — it queries ReddID by social proof, with a handle fallback.' },
            { n: '3', title: 'inject(tipUrl)', desc: 'Insert the button. Use DOM selectors or the floating fallback.' },
          ].map(step => (
            <div
              key={step.n}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'rgba(227,6,19,0.15)',
                  border: '1px solid rgba(227,6,19,0.3)',
                  color: 'var(--redd-red)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  fontFamily: "'Rubik', sans-serif",
                }}
              >
                {step.n}
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  marginBottom: 5,
                  fontWeight: 600,
                }}
              >
                {step.title}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <a
            href="https://github.com/RareStakeTech/reddid-love-button/blob/main/PLUGINS.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'var(--redd-red)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'opacity 0.15s',
            }}
          >
            Read PLUGINS.md
            <ExternalLink size={13} />
          </a>
          <a
            href="https://github.com/RareStakeTech/reddid-love-button/issues/new?labels=new-platform&template=platform_request.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'transparent',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 18px',
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Request a platform
            <ExternalLink size={13} />
          </a>
          <a
            href="https://github.com/RareStakeTech/reddid-love-button/pulls"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'transparent',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 18px',
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Open a PR
            <ExternalLink size={13} />
          </a>
        </div>

        <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          All plugins must follow the{' '}
          <a
            href="https://github.com/RareStakeTech/reddid-love-button/blob/main/PLUGINS.md#platform-checklist"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--redd-red-light)', textDecoration: 'none' }}
          >
            platform checklist
          </a>
          {' '}(responsible reserved-path exclusions, SPA navigation handling, floating fallback).
          Maintainers review all submissions before merge. The ReddID team prioritises
          platforms with strong creator-aligned communities.
        </p>
      </div>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: 12 }}>
          Not registered yet?
        </p>
        <Link
          href="/register"
          style={{
            color: 'var(--redd-red)',
            textDecoration: 'none',
            fontWeight: 700,
            fontFamily: "'Rubik', sans-serif",
            fontSize: '0.9rem',
          }}
        >
          Register your @handle →
        </Link>
      </div>
    </div>
  );
}
