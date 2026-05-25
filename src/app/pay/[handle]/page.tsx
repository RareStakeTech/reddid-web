import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIdentityByHandle } from '@/lib/db';
import { getAddressType } from '@/lib/validation';
import { primaryRddAddress } from '@/lib/types';
import PayClient from './PayClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const identity = getIdentityByHandle(handle.toLowerCase());
  if (!identity) return { title: 'Not found — ReddID' };

  const name = identity.displayName ?? `@${identity.handle}`;
  return {
    title: `Pay ${name} with Ɍ RDD`,
    description: `Send native ReddCoin (Ɍ RDD) directly to ${name}. Scan the QR code or open in your wallet.`,
  };
}

function AddressTypeBadge({ address }: { address: string }) {
  const type = getAddressType(address);
  if (type === 'unknown') return null;

  const config = {
    legacy:  { label: 'P2PKH Legacy', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)' },
    segwit:  { label: 'bech32 SegWit', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
    testnet: { label: 'Testnet',        color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
  }[type];

  return (
    <span
      style={{
        fontSize: '0.65rem',
        fontWeight: 600,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        padding: '2px 7px',
        borderRadius: 4,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {config.label}
    </span>
  );
}

export default async function PayPage({ params }: Props) {
  const { handle } = await params;
  const identity = getIdentityByHandle(handle.toLowerCase());
  if (!identity) notFound();

  const addr = primaryRddAddress(identity);
  if (!addr) {
    // Identity exists but has no active RDD address — shouldn't happen in practice
    return (
      <div style={{ maxWidth: 440, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          @{identity.handle} has not linked an RDD address yet.
        </p>
      </div>
    );
  }

  const displayName = identity.displayName ?? `@${identity.handle}`;

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '48px 20px 72px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Rubik', sans-serif",
            marginBottom: 10,
          }}
        >
          Payment request
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1
            style={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 700,
              fontSize: '1.7rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Pay {displayName}
          </h1>
          <AddressTypeBadge address={addr} />
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: 6 }}>
          Native Ɍ RDD · non-custodial · direct wallet transfer
        </p>
      </div>

      {/* Main card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '28px',
        }}
      >
        <PayClient
          handle={identity.handle}
          displayName={displayName}
          address={addr}
        />
      </div>

      {/* Footer note */}
      <p
        style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-dim)',
          lineHeight: 1.6,
        }}
      >
        ReddID is a non-custodial directory. We never hold or transmit funds.
        All transactions occur directly on the ReddCoin blockchain.{' '}
        <a href="/privacy" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>
          Privacy
        </a>
      </p>
    </div>
  );
}
