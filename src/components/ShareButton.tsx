'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface Props {
  url: string;
  title?: string;
}

export default function ShareButton({ url, title = 'Tip me with RDD' }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.35)' : 'var(--border)'}`,
        color: copied ? '#4ade80' : 'var(--text-muted)',
        borderRadius: 6,
        padding: '6px 12px',
        fontSize: '0.78rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: "'Rubik', sans-serif",
      }}
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      {copied ? 'Copied link' : 'Share'}
    </button>
  );
}
