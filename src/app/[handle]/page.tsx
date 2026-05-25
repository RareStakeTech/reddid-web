import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Wallet, Zap, CheckCircle2 } from 'lucide-react';
import { getIdentityByHandle } from '@/lib/db';
import { getAddressType, buildBip21Uri } from '@/lib/validation';
import { primaryRddAddress } from '@/lib/types';
import CopyButton from '@/components/CopyButton';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ShareButton from '@/components/ShareButton';
import LiveBalance from '@/components/LiveBalance';
import EditLink from '@/components/EditLink';
import RecentTips from '@/components/RecentTips';
import TrustBadge from '@/components/TrustBadge';
import type { TrustLevel } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ new?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const identity = getIdentityByHandle(handle);
  if (!identity) return { title: 'Handle not found — ReddID Next' };

  const name = identity.displayName ?? `@${identity.handle}`;
  return {
    title: `${name} — Tip with Ɍ RDD`,
    description:
      identity.bio ??
      `Send ReddCoin (Ɍ RDD) to ${name}. Native RDD tip page powered by ReddID Next.`,
    openGraph: {
      title: `Tip ${name} with Ɍ RDD`,
      description: identity.bio ?? `Send Ɍ ReddCoin to ${name}.`,
      images: [{ url: `/api/og/${identity.handle}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Tip ${name} with Ɍ RDD`,
      description: identity.bio ?? `Send Ɍ ReddCoin to ${name}.`,
      images: [`/api/og/${identity.handle}`],
    },
  };
}

const PLATFORM_LABELS: Record<string, string> = {
  twitter:  '𝕏',
  youtube:  '▶',
  github:   '⌥',
  reddit:   '⬤',
  mastodon: '🐘',
};

function PlatformBadge({
  platform,
  username,
  trustLevel = 'self-reported',
}: {
  platform: string;
  username: string;
  trustLevel?: TrustLevel;
}) {
  const symbol = PLATFORM_LABELS[platform] ?? '🔗';
  return (
    <span
      style={{
        color: 'var(--text-dim)',
        fontSize: '0.75rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '2px 7px',
      }}
    >
      <span style={{ fontSize: '0.65rem' }}>{symbol}</span>
      {username}
      <TrustBadge trustLevel={trustLevel} />
    </span>
  );
}

function AddressTypeBadge({ address }: { address: string }) {
  const type = getAddressType(address);
  if (type === 'unknown') return null;

  const config = {
    legacy:  { label: 'Legacy P2PKH', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)' },
    segwit:  { label: 'SegWit',       color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
    testnet: { label: 'Testnet',      color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
  }[type];

  return (
    <span
      style={{
        fontSize: '0.65rem',
        fontWeight: 600,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        padding: '1px 6px',
        borderRadius: 4,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {config.label}
    </span>
  );
}

const TIP_AMOUNTS = [10, 50, 100, 500];

export default async function TipPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const { new: isNew } = await searchParams;

  const identity = getIdentityByHandle(handle.toLowerCase());
  if (!identity) notFound();

  const displayName = identity.displayName ?? `@${identity.handle}`;
  const joinedDate = new Date(identity.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long',
  });
  const pageUrl = `https://redd.love/@${identity.handle}`;
  // Derived from wallets[] (v2) or rddAddress fallback (v1 migration)
  const addr = primaryRddAddress(identity) ?? '';
  // BIP21 URI for QR — wallets that support reddcoin: will auto-fill the address
  const bip21Uri = buildBip21Uri(addr);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>

      {/* New registration success banner */}
      {isNew === '1' && (
        <div
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.28)',
            borderRadius: 10,
            padding: '14px 20px',
            marginBottom: 28,
            color: '#4ade80',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CheckCircle2 size={18} />
          <span>
            <strong>@{identity.handle}</strong> registered successfully! This is your public tip page —
            share the URL to receive Ɍ RDD tips.
          </span>
        </div>
      )}

      {/* Main card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a0808 0%, #120a0a 100%)',
            borderBottom: '1px solid var(--border)',
            padding: '28px 32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>

              {/* Handle + badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: 'rgba(227,6,19,0.15)',
                    border: '1px solid rgba(227,6,19,0.3)',
                    color: 'var(--redd-red-light)',
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: 20,
                  }}
                >
                  @{identity.handle}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>ReddID Next</span>
              </div>

              {/* Display name */}
              <h1
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  fontFamily: "'Rubik', sans-serif",
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  marginBottom: identity.bio ? 10 : 0,
                }}
              >
                {displayName}
              </h1>

              {/* Bio */}
              {identity.bio && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, maxWidth: 400, marginBottom: 0 }}>
                  {identity.bio}
                </p>
              )}

              {/* Links + social proofs */}
              {(identity.website || identity.socialProofs.length > 0) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  {identity.website && (
                    <a
                      href={identity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <ExternalLink size={12} />
                      {identity.website.replace(/^https?:\/\//, '').split('/')[0]}
                    </a>
                  )}
                  {identity.socialProofs.map(proof => {
                    // Map verification status → trust level for display
                    const tl: TrustLevel =
                      proof.verificationStatus === 'verified'
                        ? 'challenge-post-verified'
                        : 'self-reported';
                    return (
                      <PlatformBadge
                        key={proof.platform}
                        platform={proof.platform}
                        username={proof.username}
                        trustLevel={tl}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* QR code — BIP21 URI for wallet scanning */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <QRCodeDisplay value={bip21Uri} size={148} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Scan to tip
              </span>
            </div>
          </div>
        </div>

        {/* Address section */}
        <div style={{ padding: '22px 32px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Wallet size={13} style={{ color: 'var(--text-dim)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Ɍ RDD Address
            </span>
            <AddressTypeBadge address={addr} />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#0a0a0a',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '11px 14px',
              flexWrap: 'wrap',
            }}
          >
            <code
              className="font-address"
              style={{
                color: '#d4d4d4',
                flex: 1,
                minWidth: 0,
                overflowWrap: 'break-word',
                wordBreak: 'break-all',
                fontSize: '0.82rem',
              }}
            >
              {addr}
            </code>
            <CopyButton text={addr} label="Address" />
          </div>
          <LiveBalance address={addr} />
          <p style={{ marginTop: 7, fontSize: '0.71rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Open your ReddCoin wallet and send any amount of Ɍ RDD to this address.
            No account needed — standard network fee only.
          </p>
        </div>

        {/* Recent on-chain tips */}
        <div style={{ padding: '18px 32px', borderBottom: '1px solid var(--border-subtle)' }}>
          <RecentTips rddAddress={addr} />
        </div>

        {/* Quick tip amounts */}
        <div style={{ padding: '18px 32px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Zap size={13} style={{ color: 'var(--text-dim)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Quick tip amounts
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TIP_AMOUNTS.map(amount => (
              <CopyButton
                key={amount}
                text={buildBip21Uri(addr, amount, displayName)}
                label={`Ɍ${amount.toLocaleString()}`}
              />
            ))}
          </div>
          <p style={{ marginTop: 7, fontSize: '0.71rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Copies a <code style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>reddcoin:</code> payment URI to your clipboard.
            Paste into any BIP21-compatible wallet to pre-fill the address and amount.
          </p>
        </div>

        {/* How to tip */}
        <div style={{ padding: '18px 32px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ marginBottom: 12, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            How to send a tip
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['1', 'Get the ReddCoin wallet', 'Download ReddCoin Core or a compatible wallet from reddcoin.com'],
              ['2', 'Acquire Ɍ RDD', 'Buy on an exchange, earn through staking (PoSV), or receive tips from others'],
              ['3', 'Send to this address', 'Copy the address above and paste into your wallet\'s Send field — or scan the QR code'],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    background: 'var(--redd-red-pale)',
                    border: '1px solid var(--redd-red-border)',
                    color: 'var(--redd-red)',
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {num}
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Rubik', sans-serif" }}>{title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card footer */}
        <div
          style={{
            padding: '14px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.71rem', color: 'var(--text-dim)' }}>
              Registered {joinedDate}
            </span>
            <span style={{ fontSize: '0.71rem', color: 'var(--text-dim)' }}>
              Ɍ Native RDD · No wrapped tokens
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <ShareButton url={pageUrl} title={`Tip @${identity.handle} with Ɍ RDD`} />
            <Link
              href={`/live/${identity.handle}`}
              style={{ fontSize: '0.75rem', color: 'var(--redd-red)', textDecoration: 'none', fontFamily: "'Rubik', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              ▶ Live session
            </Link>
            <Link
              href={`/card/${identity.handle}`}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: "'Rubik', sans-serif", fontWeight: 600 }}
            >
              🃏 Tip card
            </Link>
            <EditLink handle={identity.handle} />
            <Link
              href="/register"
              style={{
                fontSize: '0.75rem',
                color: 'var(--redd-red)',
                textDecoration: 'none',
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
              }}
            >
              Get your @handle →
            </Link>
          </div>
        </div>
      </div>

      {/* Coming soon banner */}
      <div
        style={{
          marginTop: 20,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, fontFamily: "'Rubik', sans-serif" }}>
            ReddRail social payments — coming soon
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            When ReddRail launches on Gajumaru infrastructure, this page will support instant
            Ɍ micro-tips through state channels — many small payments without touching the base chain.
          </div>
        </div>
        <Link
          href="/roadmap"
          style={{
            fontSize: '0.78rem',
            color: 'var(--redd-red)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            fontWeight: 600,
            fontFamily: "'Rubik', sans-serif",
          }}
        >
          See roadmap →
        </Link>
      </div>
    </div>
  );
}
