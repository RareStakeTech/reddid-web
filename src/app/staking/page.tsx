import type { Metadata } from 'next';
import Link from 'next/link';
import StakingCalculator from './StakingCalculator';

export const metadata: Metadata = {
  title: 'PoSV Staking Calculator — ReddCoin | ReddID Next',
  description:
    'Estimate your annual Ɍ RDD staking rewards using ReddCoin\'s Proof-of-Stake-Velocity (PoSV) mechanism. Rewards scale with both coin balance and activity.',
};

const FAQ = [
  {
    q: 'What is Proof-of-Stake-Velocity (PoSV)?',
    a: `PoSV is ReddCoin's consensus mechanism, designed to encourage both holding (stake) and network participation (velocity). Unlike pure PoS, PoSV rewards scale not just with how many coins you hold but with how actively you use them — making the network more organic and social-payment oriented.`,
  },
  {
    q: 'How does coin age work?',
    a: `Coin age is the product of coin quantity × days held. When you stake, your accumulated coin age is consumed. Coins younger than 7 days cannot stake. Coins older than 60 days reach maximum weight. The calculator uses the simplified annual percentage model — actual rewards vary block by block.`,
  },
  {
    q: 'What APR should I expect?',
    a: `Historical PoSV yields have ranged from ~2% to ~6% annually, depending on how many other wallets are actively staking. When network participation is lower, individual rewards are proportionally higher. The 5% default in the calculator is a reasonable mid-range estimate.`,
  },
  {
    q: 'Do I need to keep my wallet open?',
    a: `For PoSV staking in ReddCoin Core, yes — your wallet must be unlocked for staking while online. Future ReddRail integrations (v0.4) may enable delegated staking via Gajumaru infrastructure, removing the need for an always-on node.`,
  },
  {
    q: 'Is this official yield data?',
    a: `No — this is an illustrative calculator. Actual rewards depend on network difficulty, your coin age, and total network weight. Always refer to the official ReddCoin documentation or the ReddCoin Core wallet\'s staking UI for current estimates.`,
  },
];

export default function StakingPage() {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px' }}>

      {/* ── Estimate Only banner ── */}
      <div
        style={{
          background: 'rgba(96,165,250,0.06)',
          border: '1px solid rgba(96,165,250,0.25)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.8rem',
          color: '#7eaacc',
        }}
      >
        <span style={{ fontWeight: 700 }}>Estimate Only — Not Connected to Live Staking.</span>
        {' '}All figures are illustrative arithmetic. Actual PoSV rewards depend on live network weight.
      </div>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: '1.8rem' }}>⚡</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Rubik', sans-serif", letterSpacing: '-0.02em' }}>
            PoSV Staking Calculator
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 640 }}>
          Estimate your annual Ɍ RDD staking rewards with ReddCoin&apos;s unique{' '}
          <strong>Proof-of-Stake-Velocity</strong> mechanism — the original algorithm that
          rewards both holding coins and using them socially.
        </p>
      </div>

      {/* Calculator (client component) */}
      <StakingCalculator />

      {/* PoSV explainer */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '28px 32px',
        marginBottom: 28,
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", marginBottom: 20 }}>
          How PoSV works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: '💎', title: 'Stake (quantity)', desc: 'The number of Ɍ RDD coins you hold in a staking wallet. More coins = more weight.' },
            { icon: '⏱', title: 'Velocity (age)', desc: 'How long your coins have been sitting undisturbed. Older coins accumulate more age, increasing reward potential.' },
            { icon: '⚡', title: 'Activity bonus', desc: 'PoSV uniquely rewards social activity. Future v0.4 integration will tie on-chain tips to staking weight.' },
            { icon: '🔄', title: 'Compounding', desc: 'Staking rewards are added to your balance each time you stake a block, automatically compounding over time.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '1.4rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontFamily: "'Rubik', sans-serif", fontSize: '0.88rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* v0.4 teaser */}
      <div style={{
        background: 'rgba(227,6,19,0.04)',
        border: '1px solid rgba(227,6,19,0.18)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 36,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🔮</span>
        <div>
          <div style={{ fontWeight: 700, fontFamily: "'Rubik', sans-serif", fontSize: '0.95rem', color: 'var(--redd-red)', marginBottom: 6 }}>
            ReddRail v0.4 — AI-agent payment policies (roadmap)
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            The v0.4 milestone introduces AI-agent payment policies on top of Gajumaru state channels.
            Staking validators will optionally be able to delegate staking rewards directly into
            ReddRail sessions — enabling autonomous micro-tipping agents that earn PoSV rewards
            proportional to their network activity. This closes the loop between social velocity
            and consensus-layer incentives.
          </div>
          <Link
            href="/roadmap"
            style={{ display: 'inline-block', marginTop: 10, fontSize: '0.82rem', color: 'var(--redd-red)', textDecoration: 'none', fontWeight: 600, fontFamily: "'Rubik', sans-serif" }}
          >
            See full roadmap →
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", marginBottom: 16 }}>
        FAQ
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FAQ.map(item => (
          <div key={item.q} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px 20px',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: "'Rubik', sans-serif", marginBottom: 8 }}>{item.q}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.a}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
        Calculator is illustrative only. Past staking yields do not guarantee future returns.{' '}
        <a href="https://www.reddcoin.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)' }}>reddcoin.com</a>
      </div>
    </div>
  );
}
