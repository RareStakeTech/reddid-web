'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function QuickLookup() {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const handle = value.trim().replace(/^@/, '').toLowerCase();
    if (!handle) return;
    // Single-word lookup → go direct; anything with spaces → search page
    if (handle.includes(' ') || handle.length < 1) {
      router.push(`/search?q=${encodeURIComponent(handle)}`);
    } else {
      router.push(`/${handle}`);
    }
    setValue('');
    inputRef.current?.blur();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: focused ? '#1a1a1a' : '#111',
        border: `1px solid ${focused ? 'rgba(227,6,19,0.4)' : 'var(--border)'}`,
        borderRadius: 6,
        padding: '0 10px',
        gap: 6,
        height: 34,
        transition: 'border-color 0.15s, background 0.15s',
        width: focused ? 180 : 140,
      }}
    >
      <Search size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="@handle"
        aria-label="Look up a ReddID handle"
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: '0.82rem',
          width: '100%',
          caretColor: 'var(--redd-red)',
        }}
      />
    </form>
  );
}
