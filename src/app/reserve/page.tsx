import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reserve Model — ReddRails',
  description: 'How the ReddRails reserve-backed bridge works: native RDD reserves, backing ratios, and transparency.',
};

function FormulaLine({ lhs, op, rhs, highlight }: { lhs: string; op: string; rhs: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 0',
        borderBottom: highlight ? '1px solid rgba(204,17,17,0.2)' : '1px solid var(--border-subtle)',
      }}
    >
      <span style={{ color: highlight ? 'var(--redd-red-light)' : 'var(--text-muted)', fontFamily: 'monospace', minWidth: 24 }}>{op}</span>
      <span
        className="font-address"
        style={{
          flex: 1,
          color: highlight ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '0.88rem',
          fontWeight: highlight ? 700 : 400,
        }}
      >
        {lhs}
      </span>
      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{rhs}</span>
    </div>
  );
}

function MetricCard({
  label, value, sub, live = false,
}: { label: string; value: string; sub: string; live?: boolean }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '20px 22px',
        flex: '1 1 180px',
      }}
    >
      <div
        style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--text-dim)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {label}
        {live && (
          <span
            style={{
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80',
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: '0.6rem',
              letterSpacing: '0.06em',
            }}
          >
            LIVE
          </span>
        )}
        {!live && (
          <span
            style={{
              background: 'rgba(136,136,136,0.1)',
              border: '1px solid rgba(136,136,136,0.2)',
              color: '#666',
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: '0.6rem',
              letterSpacing: '0.06em',
            }}
          >
            PENDING
          </span>
        )}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#555', fontFamily: 'monospace' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>
        {sub}
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div
        style={{
          background: 'rgba(204,17,17,0.1)',
          border: '1px solid rgba(204,17,17,0.2)',
          borderRadius: 8,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--redd-red)',
          fontWeight: 800,
          fontSize: '0.9rem',
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div style={{ paddingTop: 6 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function ReservePage() {
  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '48px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Reserve Model
          </h1>
          <span
            style={{
              background: 'rgba(136,136,136,0.1)',
              border: '1px solid rgba(136,136,136,0.2)',
              color: '#777',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 20,
              letterSpacing: '0.06em',
            }}
          >
            BRIDGE NOT YET LIVE
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.75, maxWidth: 620 }}>
          When ReddRail launches, every represented RDD will be backed by native RDD held in
          publicly verifiable reserve wallets. This page explains the model and will display
          live reserve data once the bridge is operational.
        </p>
      </div>

      {/* Live metrics (placeholder) */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-dim)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Reserve Dashboard — Live when bridge launches
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <MetricCard label="Native RDD Reserve"    value="—"    sub="Total RDD locked in multisig reserve wallets" />
          <MetricCard label="Total Represented"     value="—"    sub="RDD represented across all rails (ReddRail + future)" />
          <MetricCard label="Pending Redemptions"   value="—"    sub="Queued burns awaiting native RDD release" />
          <MetricCard label="Backing Ratio"         value="—"    sub="Target: ≥ 1.00 at all times" />
        </div>
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            background: 'rgba(136,136,136,0.05)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            lineHeight: 1.6,
          }}
        >
          These values will update in real-time once the bridge is live. All data will be
          independently verifiable against the ReddCoin blockchain and Gajumaru Associate Chain
          explorer. The dashboard is a convenience — the blockchain is the authority.
        </div>
      </div>

      {/* The formula */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 32px',
          marginBottom: 40,
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 6 }}>
          The Reserve Formula
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          These three identities must hold at all times. Anyone can verify them independently
          by reading the public blockchains.
        </p>

        {/* Formula 1 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--redd-red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Backing Available
          </div>
          <div style={{ background: '#0a0a0a', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px' }}>
            <FormulaLine lhs="Native RDD Reserve" op=" " rhs="Total RDD in reserve wallet(s)" />
            <FormulaLine lhs="Pending Redemptions" op="−" rhs="Burns queued, not yet released" />
            <FormulaLine lhs="Backing Available" op="=" rhs="Net RDD that can cover representations" highlight />
          </div>
        </div>

        {/* Formula 2 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Total Represented Liability
          </div>
          <div style={{ background: '#0a0a0a', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px' }}>
            <FormulaLine lhs="RDD on ReddRail (Gajumaru)" op=" " rhs="Primary social-payment rail" />
            <FormulaLine lhs="wRDD on Base (future)" op="+" rhs="Creator / AI-agent layer, later stage" />
            <FormulaLine lhs="Total Represented" op="=" rhs="Sum of all representations" highlight />
          </div>
        </div>

        {/* Formula 3 */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Backing Ratio
          </div>
          <div style={{ background: '#0a0a0a', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px' }}>
            <FormulaLine lhs="Backing Available ÷ Total Represented" op="=" rhs="Must be ≥ 1.00 at all times" highlight />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
            If the backing ratio drops below 1.00, bridge operations pause automatically and all multisig
            operators are alerted immediately. No new representations are issued until the ratio is restored.
          </p>
        </div>
      </div>

      {/* Mint flow */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 32px',
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 20 }}>
          Deposit → Represent (how native RDD becomes ReddRail balance)
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Step n="1" title="Send native RDD to your deposit address" desc="Each user session gets a unique deposit address derived from the bridge's HD wallet. The address is valid for 72 hours." />
          <Step n="2" title="Bridge indexer detects the deposit" desc="A monitoring service watches the RDD blockchain. Your deposit is detected after 10 confirmations (~10 minutes at current block time) for standard amounts." />
          <Step n="3" title="Multisig operators review and sign" desc="Three of five keyholders (all using hardware wallets) must sign the mint transaction. No single operator can mint alone." />
          <Step n="4" title="Represented RDD credited to your ReddRail balance" desc="Your account on the ReddRail Associate Chain (Gajumaru) is credited. You can now send instant social tips through state channels." />
          <Step n="5" title="All events logged publicly" desc="Every deposit, mint, and balance update is recorded. The reserve dashboard reflects the new state within minutes." />
        </div>
      </div>

      {/* Redeem flow */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 32px',
          marginBottom: 40,
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 20 }}>
          Redeem → Withdraw (how ReddRail balance becomes native RDD)
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Step n="1" title="Initiate redemption from your creator dashboard" desc="Specify the amount and your native RDD destination address. Your ReddRail balance is locked immediately." />
          <Step n="2" title="Representation burned on Associate Chain" desc="The burn event is recorded publicly on Gajumaru. This decreases the Total Represented supply." />
          <Step n="3" title="Multisig operators release native RDD" desc="Operators process redemption queue at least daily (target: within 4 hours). They sign the release transaction from the reserve wallet." />
          <Step n="4" title="Native RDD arrives in your wallet" desc="Standard transaction on the RDD blockchain. You receive the native asset directly, no intermediaries." />
        </div>
      </div>

      {/* Trust model */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 32px',
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 16 }}>
          Trust model — what you are relying on
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
          This bridge is <strong style={{ color: 'var(--text-primary)' }}>custodial and trust-based</strong> in its initial form.
          We are not claiming it is trustless. Here is exactly what you are trusting:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Reserve wallets', 'A 3-of-5 multisig holds native RDD. No single operator can steal funds. Addresses are public.'],
            ['Honest accounting', 'The reserve dashboard is computed directly from blockchain data, not from an internal database. Anyone can verify it.'],
            ['Redemption processing', 'Operators commit to processing redemptions within 4 hours under normal conditions. This is a service-level commitment, not a smart contract guarantee.'],
            ['Emergency pause', 'Any 2-of-5 multisig signers can pause the bridge immediately if something looks wrong. Resumption requires 3-of-5.'],
            ['No hidden minting', 'The wRDD/rRDD total supply is publicly queryable on the relevant chain. There is no hidden mint authority.'],
            ['Incident disclosure', 'If something goes wrong, we will tell you what happened before we claim to have fixed it.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--redd-red)', fontSize: '0.65rem', marginTop: 4, flexShrink: 0 }}>●</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclosures */}
      <div
        style={{
          border: '1px solid rgba(234,179,8,0.25)',
          background: 'rgba(234,179,8,0.04)',
          borderRadius: 10,
          padding: '20px 24px',
        }}
      >
        <div style={{ fontWeight: 700, color: '#c4a030', fontSize: '0.82rem', marginBottom: 10 }}>
          ⚠ Required Disclosures
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            'The bridge is not yet live. No funds are held. This page is a design preview.',
            'When live, represented RDD is NOT native RDD. It is a representation backed by reserved native RDD.',
            'This bridge is custodial. Reserve operators hold real native RDD on your behalf.',
            'Redemption is subject to operator availability and processing queue. It is not instant.',
            'This is experimental software. Do not deposit amounts you cannot afford to lose.',
            'No legal advice is provided. Consult your own counsel before using the bridge for large amounts.',
            'This system will be independently audited before launch. The audit report will be published.',
          ].map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: '#a08030' }}>
              <span>·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Navigation */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/roadmap" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem', padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
          → View Roadmap
        </Link>
        <Link href="/docs" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem', padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
          → Technical Architecture
        </Link>
      </div>
    </div>
  );
}
