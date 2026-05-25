import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftRight, Clock, Zap, Shield, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ReddBridge — Gaju ↔ RDD Exchange | ReddID Next',
  description:
    'The ReddBridge reserve protocol enables native RDD to flow onto the Gajumaru network and back. Coming Q3/Q4 2026.',
};

const STEPS = [
  {
    num: '1',
    title: 'Lock native RDD',
    desc: 'Send RDD to the ReddBridge reserve address on the ReddCoin mainnet. The bridge watches for the confirmed deposit.',
  },
  {
    num: '2',
    title: 'Mint wRDD on Gajumaru',
    desc: 'Once confirmed, the bridge contract mints an equivalent amount of wRDD on the Gajumaru EVM — 1:1, no fees beyond base network costs.',
  },
  {
    num: '3',
    title: 'Use wRDD in DeFi / ReddRail',
    desc: 'Spend wRDD inside Gajumaru dApps or open a ReddRail state-channel session for streaming micro-payments back to the ReddCoin layer.',
  },
  {
    num: '4',
    title: 'Burn wRDD → release native RDD',
    desc: 'Burn wRDD on Gajumaru to unlock the original RDD from the reserve. Native RDD is returned to any RDD address you specify.',
  },
];

const STATS = [
  { label: 'Gajumaru mainnet launch', value: 'Oct 2024' },
  { label: 'Groot TPS', value: '300+' },
  { label: 'Micro-block settlement', value: '~2 s' },
  { label: 'Associate Chains ETA', value: 'Q3/Q4 2026' },
];

export default function BridgePage() {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px' }}>

      {/* ── Concept Only banner — mandatory label per PRODUCT_SPEC mock/demo table ── */}
      <div style={{
        background: 'rgba(251,191,36,0.06)',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: 10,
        padding: '12px 20px',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <Clock size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: '#d4a017' }}>
          <strong>Concept Only — Bridge Not Active.</strong>{' '}
          ReddBridge is a design preview. No funds can be deposited or bridged.
          Gajumaru Associate Chain support (required) is expected Q3/Q4 2026.
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(227,6,19,0.1)',
            border: '1px solid rgba(227,6,19,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ArrowLeftRight size={20} style={{ color: 'var(--redd-red)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Rubik', sans-serif", letterSpacing: '-0.02em', lineHeight: 1 }}>
              ReddBridge
            </h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Native RDD ↔ Gajumaru wRDD · Reserve-backed · 1:1
            </div>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 640 }}>
          ReddBridge is the reserve protocol connecting the ReddCoin mainnet to the Gajumaru
          high-performance network. Lock native Ɍ RDD → receive wRDD on Gajumaru → use it in
          DeFi or ReddRail payment sessions → burn to reclaim native RDD. No middlemen,
          no speculative second token — wRDD is pure infrastructure plumbing.
        </p>
      </div>

      {/* Exchange UI placeholder */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px',
        marginBottom: 36,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Disabled overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(8,8,8,0.6)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)',
          borderRadius: 16,
          zIndex: 10,
        }}>
          <div style={{
            background: '#111',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '24px 32px',
            textAlign: 'center',
            maxWidth: 320,
          }}>
            <Clock size={28} style={{ color: '#fbbf24', marginBottom: 12 }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", marginBottom: 8 }}>
              Bridge not yet live
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Associate Chains — the Gajumaru primitive powering ReddBridge — are expected
              Q3/Q4 2026. Sign up for updates below.
            </div>
          </div>
        </div>

        {/* Faux exchange form (behind overlay) */}
        <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
            {/* From */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
                From
              </div>
              <div style={{ background: '#0d0d0d', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>0.00</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(227,6,19,0.1)', border: '1px solid rgba(227,6,19,0.2)', borderRadius: 20, padding: '4px 10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Ɍ RDD</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>ReddCoin mainnet</div>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <ArrowLeftRight size={20} style={{ color: 'var(--redd-red)' }} />
            </div>

            {/* To */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
                To
              </div>
              <div style={{ background: '#0d0d0d', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>0.00</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 20, padding: '4px 10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#a78bfa' }}>wRDD</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Gajumaru EVM</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, background: '#0d0d0d', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Rate: 1 RDD = 1 wRDD · Reserve ratio: 100% · Bridge fee: 0%
          </div>
          <button style={{ marginTop: 16, width: '100%', background: 'var(--redd-red)', border: 'none', borderRadius: 10, padding: '14px', fontSize: '1rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", color: 'white', cursor: 'not-allowed' }}>
            Bridge RDD →
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 36 }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: "'Rubik', sans-serif", color: 'var(--text-primary)', marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", marginBottom: 20 }}>
          How ReddBridge works
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map(step => (
            <div key={step.num} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}>
              <div style={{
                background: 'rgba(227,6,19,0.1)',
                border: '1px solid rgba(227,6,19,0.2)',
                color: 'var(--redd-red)',
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 800,
                fontSize: '0.9rem',
                borderRadius: 8,
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {step.num}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontFamily: "'Rubik', sans-serif", fontSize: '0.9rem', marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature callouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 36 }}>
        {[
          { icon: <Shield size={16} />, title: '100% reserve-backed', desc: 'Every wRDD in circulation is backed 1:1 by native RDD in the bridge reserve. No fractional reserve.' },
          { icon: <Zap size={16} />, title: 'ReddRail integration', desc: 'Open Gajumaru state-channel sessions denominated in wRDD for high-frequency micro-payments back to the RDD layer.' },
          { icon: <ArrowLeftRight size={16} />, title: 'Permissionless exit', desc: 'Burn wRDD any time to unlock native RDD. No withdrawal limits, no approval process, no custodian.' },
        ].map(f => (
          <div key={f.title} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '18px 20px',
          }}>
            <div style={{ color: 'var(--redd-red)', marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontFamily: "'Rubik', sans-serif", fontSize: '0.9rem', marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link
          href="/roadmap"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--redd-red)', color: 'white',
            fontFamily: "'Rubik', sans-serif", fontWeight: 700, fontSize: '0.875rem',
            padding: '10px 20px', borderRadius: 8, textDecoration: 'none',
          }}
        >
          See full roadmap <ChevronRight size={14} />
        </Link>
        <a
          href="mailto:rarestaketech@gmail.com?subject=ReddBridge%20interest"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            border: '1px solid var(--border)', color: 'var(--text-muted)',
            fontFamily: "'Rubik', sans-serif", fontWeight: 600, fontSize: '0.875rem',
            padding: '10px 20px', borderRadius: 8, textDecoration: 'none',
          }}
        >
          Notify me when live
        </a>
        <Link
          href="/design"
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-dim)',
            textDecoration: 'none',
          }}
        >
          Technical design doc →
        </Link>
      </div>
    </div>
  );
}
