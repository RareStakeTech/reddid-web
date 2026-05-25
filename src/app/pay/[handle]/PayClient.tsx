'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Wallet } from 'lucide-react';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { buildBip21Uri } from '@/lib/validation';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

interface PayClientProps {
  handle: string;
  displayName: string;
  address: string;
}

export default function PayClient({ handle, displayName, address }: PayClientProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [copied, setCopied] = useState<'addr' | 'uri' | null>(null);

  const bip21 = amount && Number(amount) > 0
    ? buildBip21Uri(address, Number(amount))
    : buildBip21Uri(address);

  function copyText(text: string, key: 'addr' | 'uri') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    }).catch(() => {});
  }

  const CHIP: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontFamily: "'Rubik', sans-serif",
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.12s',
    letterSpacing: '0.02em',
  };

  const CHIP_ACTIVE: React.CSSProperties = {
    ...CHIP,
    background: 'rgba(227,6,19,0.15)',
    border: '1px solid rgba(227,6,19,0.4)',
    color: 'var(--redd-red-light)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Amount picker */}
      <div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: "'Rubik', sans-serif" }}>
          Amount (Ɍ RDD)
        </p>

        {/* Preset chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {PRESET_AMOUNTS.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(amount === n ? '' : n)}
              style={amount === n ? CHIP_ACTIVE : CHIP}
            >
              Ɍ {n.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom amount input */}
        <div style={{ position: 'relative', maxWidth: 220 }}>
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--redd-red-light)',
            fontWeight: 700,
            fontSize: '1rem',
            fontFamily: "'Rubik', sans-serif",
            userSelect: 'none',
          }}>Ɍ</span>
          <input
            type="number"
            min="0.000001"
            step="0.000001"
            value={amount}
            onChange={e => {
              const v = e.target.value;
              setAmount(v === '' ? '' : Math.max(0, Number(v)));
            }}
            placeholder="Custom amount"
            style={{
              width: '100%',
              background: '#0d0d0d',
              border: '1px solid var(--border)',
              borderRadius: 7,
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontFamily: "'Roboto', sans-serif",
              padding: '9px 12px 9px 28px',
            }}
          />
        </div>
      </div>

      {/* QR code */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <QRCodeDisplay value={bip21} size={200} />
        <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', textAlign: 'center', maxWidth: 260 }}>
          {amount && Number(amount) > 0
            ? `Scan to send Ɍ ${Number(amount).toLocaleString()} RDD to @${handle}`
            : `Scan to open @${handle}'s address in your ReddCoin wallet`}
        </p>
      </div>

      {/* Open in wallet */}
      <a
        href={bip21}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'var(--redd-red)',
          color: 'white',
          borderRadius: 8,
          padding: '13px 20px',
          textDecoration: 'none',
          fontFamily: "'Rubik', sans-serif",
          fontWeight: 700,
          fontSize: '0.95rem',
          letterSpacing: '0.01em',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <Wallet size={16} />
        Open in wallet
        {amount && Number(amount) > 0 ? ` · Ɍ ${Number(amount).toLocaleString()}` : ''}
      </a>

      {/* Copy actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {/* Copy address */}
        <button
          type="button"
          onClick={() => copyText(address, 'addr')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            color: copied === 'addr' ? '#4ade80' : 'var(--text-muted)',
            fontSize: '0.82rem',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 500,
            cursor: 'pointer',
            padding: '10px 14px',
            transition: 'color 0.15s',
          }}
        >
          <Copy size={13} />
          {copied === 'addr' ? 'Copied!' : 'Copy address'}
        </button>

        {/* Copy BIP21 URI */}
        <button
          type="button"
          onClick={() => copyText(bip21, 'uri')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            color: copied === 'uri' ? '#4ade80' : 'var(--text-muted)',
            fontSize: '0.82rem',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 500,
            cursor: 'pointer',
            padding: '10px 14px',
            transition: 'color 0.15s',
          }}
        >
          <Copy size={13} />
          {copied === 'uri' ? 'Copied!' : 'Copy Ɍ URI'}
        </button>
      </div>

      {/* Address display */}
      <div
        style={{
          background: '#0a0a0a',
          border: '1px solid var(--border-subtle)',
          borderRadius: 7,
          padding: '12px 14px',
        }}
      >
        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: "'Rubik', sans-serif" }}>
          Recipient address
        </p>
        <code
          style={{
            fontSize: '0.78rem',
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            color: 'var(--text-muted)',
            wordBreak: 'break-all',
            lineHeight: 1.6,
          }}
        >
          {address}
        </code>
      </div>

      {/* Tip page link */}
      <div style={{ textAlign: 'center' }}>
        <a
          href={`/${handle}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--text-dim)',
            fontSize: '0.78rem',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={11} />
          View {displayName}&apos;s full tip page
        </a>
      </div>

    </div>
  );
}
