'use client';

/**
 * StakingCalculator — interactive PoSV yield estimator for ReddCoin.
 *
 * PoSV simplified model:
 *   annualReward = balance × (apr / 100)
 *   compounded   = balance × ((1 + apr/100/compoundsPerYear)^compoundsPerYear - 1)
 *
 * Coin age effect: coins older than 60 days earn maximum weight.
 * The age multiplier tapers linearly from 7 days (0%) to 60 days (100%).
 */

import { useState, useMemo } from 'react';

const PRESET_BALANCES = [1_000, 10_000, 100_000, 1_000_000];
const DEFAULT_APR = 5;
const DEFAULT_BALANCE = 10_000;
const DEFAULT_COIN_AGE = 30; // days

function fmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(3)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(3)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

function coinAgeMultiplier(ageDays: number): number {
  if (ageDays < 7)  return 0;
  if (ageDays >= 60) return 1;
  return (ageDays - 7) / (60 - 7);
}

export default function StakingCalculator() {
  const [balance,   setBalance]   = useState<number>(DEFAULT_BALANCE);
  const [balanceRaw, setBalanceRaw] = useState<string>(String(DEFAULT_BALANCE));
  const [apr,       setApr]       = useState<number>(DEFAULT_APR);
  const [coinAge,   setCoinAge]   = useState<number>(DEFAULT_COIN_AGE);
  const [compound,  setCompound]  = useState<boolean>(true);

  const ageMulti = useMemo(() => coinAgeMultiplier(coinAge), [coinAge]);
  const effectiveApr = apr * ageMulti;

  const results = useMemo(() => {
    const b = balance;
    const r = effectiveApr / 100;
    const dailyRate = r / 365;

    const annual = compound
      ? b * (Math.pow(1 + r / 12, 12) - 1)
      : b * r;

    return {
      daily:   b * dailyRate,
      weekly:  b * dailyRate * 7,
      monthly: compound ? b * (Math.pow(1 + r / 12, 1) - 1) : b * (r / 12),
      annual,
      afterYear: b + annual,
    };
  }, [balance, effectiveApr, compound]);

  const ageColor = ageMulti === 0 ? '#f87171' : ageMulti < 0.5 ? '#fbbf24' : '#4ade80';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 28,
    }}>
      {/* Inputs */}
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>

          {/* Balance */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Balance (Ɍ RDD)
            </label>
            <input
              type="number"
              value={balanceRaw}
              min={0}
              max={1e12}
              onChange={e => {
                setBalanceRaw(e.target.value);
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v >= 0) setBalance(v);
              }}
              style={{
                width: '100%', background: '#0a0a0a', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text-primary)', fontSize: '1.2rem',
                fontWeight: 700, fontFamily: "'Rubik', sans-serif",
                padding: '10px 14px', outline: 'none', boxSizing: 'border-box',
                caretColor: 'var(--redd-red)',
              }}
            />
            {/* Presets */}
            <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
              {PRESET_BALANCES.map(p => (
                <button
                  key={p}
                  onClick={() => { setBalance(p); setBalanceRaw(String(p)); }}
                  style={{
                    background: balance === p ? 'rgba(227,6,19,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${balance === p ? 'rgba(227,6,19,0.3)' : 'var(--border)'}`,
                    color: balance === p ? 'var(--redd-red)' : 'var(--text-dim)',
                    borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem',
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {fmt(p)}
                </button>
              ))}
            </div>
          </div>

          {/* APR */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Annual APR (%) &nbsp;<span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{apr}%</span>
            </label>
            <input
              type="range"
              min={1} max={20} step={0.5}
              value={apr}
              onChange={e => setApr(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#E30613' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 3 }}>
              <span>1%</span><span style={{ color: 'var(--text-muted)' }}>Est. network range: 2–6%</span><span>20%</span>
            </div>
          </div>

          {/* Coin age */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Coin age (days) &nbsp;<span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{coinAge}d</span>
            </label>
            <input
              type="range"
              min={0} max={90} step={1}
              value={coinAge}
              onChange={e => setCoinAge(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#E30613' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 3 }}>
              <span>0d</span>
              <span style={{ color: ageColor, fontWeight: 600 }}>
                {coinAge < 7 ? '⛔ Too young (min 7d)' : coinAge < 60 ? `⚡ ${Math.round(ageMulti * 100)}% weight` : '✓ Max weight (60d+)'}
              </span>
              <span>90d</span>
            </div>
          </div>

          {/* Compound toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
              Compounding
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([true, false] as const).map(v => (
                <button
                  key={String(v)}
                  onClick={() => setCompound(v)}
                  style={{
                    flex: 1, padding: '8px 0',
                    background: compound === v ? 'rgba(227,6,19,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${compound === v ? 'rgba(227,6,19,0.3)' : 'var(--border)'}`,
                    color: compound === v ? 'var(--redd-red)' : 'var(--text-dim)',
                    borderRadius: 6, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {v ? 'Monthly' : 'Simple'}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Results */}
      <div style={{ padding: '20px 28px' }}>
        {/* Effective APR notice */}
        {ageMulti < 1 && (
          <div style={{
            background: ageMulti === 0 ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)',
            border: `1px solid ${ageMulti === 0 ? 'rgba(248,113,113,0.25)' : 'rgba(251,191,36,0.25)'}`,
            borderRadius: 8, padding: '8px 14px', marginBottom: 16,
            fontSize: '0.78rem',
            color: ageMulti === 0 ? '#f87171' : '#fbbf24',
          }}>
            {ageMulti === 0
              ? '⛔ Coins younger than 7 days cannot stake. Move the coin age slider to 7+ days to see rewards.'
              : `⚡ Coin age applies a ${Math.round(ageMulti * 100)}% weight multiplier. Effective APR: ${effectiveApr.toFixed(2)}%.`}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Daily', value: results.daily },
            { label: 'Weekly', value: results.weekly },
            { label: 'Monthly', value: results.monthly },
            { label: 'Annual', value: results.annual, highlight: true },
          ].map(r => (
            <div key={r.label} style={{
              background: r.highlight ? 'rgba(227,6,19,0.06)' : '#0a0a0a',
              border: `1px solid ${r.highlight ? 'rgba(227,6,19,0.2)' : 'var(--border)'}`,
              borderRadius: 10, padding: '14px 16px',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                {r.label}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: "'Rubik', sans-serif", color: r.highlight ? 'var(--redd-red)' : 'var(--text-primary)' }}>
                {ageMulti === 0 ? '—' : `+${fmt(r.value)} Ɍ`}
              </div>
            </div>
          ))}
        </div>

        {/* After 1 year */}
        {ageMulti > 0 && (
          <div style={{
            marginTop: 14,
            background: '#0a0a0a', border: '1px solid var(--border)',
            borderRadius: 8, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Balance after 1 year ({compound ? 'monthly compounding' : 'simple interest'})
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: "'Rubik', sans-serif" }}>
              {fmt(results.afterYear)} Ɍ
            </span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '10px 28px', borderTop: '1px solid var(--border)', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
        Illustrative only. Actual PoSV rewards depend on network difficulty, total network weight,
        and your wallet&apos;s uptime. Not financial advice.
      </div>
    </div>
  );
}
