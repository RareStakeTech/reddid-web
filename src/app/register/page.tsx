'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { sanitizeHandle, isValidHandle } from '@/lib/validation';

type Field = 'handle' | 'rddAddress' | 'displayName' | 'bio' | 'website';
type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface FormState {
  handle: string;
  rddAddress: string;
  displayName: string;
  bio: string;
  website: string;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: '#0d0d0d',
  border: '1px solid var(--border)',
  borderRadius: 7,
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  fontFamily: "'Roboto', sans-serif",
  padding: '10px 12px',
  transition: 'border-color 0.15s',
};

function Label({ text, required }: { text: string; required: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Rubik', sans-serif" }}>{text}</span>
      {required && <span style={{ color: 'var(--redd-red)', fontSize: '0.75rem', fontWeight: 700 }}>*</span>}
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 5, lineHeight: 1.5 }}>{text}</p>;
}

function AvailabilityIndicator({ state, handle }: { state: AvailabilityState; handle: string }) {
  if (state === 'idle' || !handle) return null;

  const config: Record<AvailabilityState, { icon: React.ReactNode; text: string; color: string } | null> = {
    idle:      null,
    checking:  { icon: <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />, text: 'Checking…', color: 'var(--text-dim)' },
    available: { icon: <CheckCircle2 size={13} />, text: `@${handle} is available`, color: '#4ade80' },
    taken:     { icon: <XCircle size={13} />,      text: `@${handle} is taken`,     color: '#f87171' },
    invalid:   { icon: <AlertCircle size={13} />,  text: '',                         color: '#f0c040' },
  };

  const c = config[state];
  if (!c) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, color: c.color, fontSize: '0.75rem' }}>
      {c.icon}
      <span>{c.text}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    handle: '', rddAddress: '', displayName: '', bio: '', website: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced availability check
  useEffect(() => {
    const handle = form.handle;
    if (!handle || handle.length < 3) {
      setAvailability('idle');
      return;
    }

    const validation = isValidHandle(handle);
    if (!validation.valid) {
      setAvailability('invalid');
      return;
    }

    setAvailability('checking');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/identities/${encodeURIComponent(handle)}`);
        setAvailability(res.ok ? 'taken' : 'available');
      } catch {
        setAvailability('idle');
      }
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [form.handle]);

  const handleChange = useCallback((field: Field, value: string) => {
    if (field === 'handle') {
      setForm(f => ({ ...f, handle: sanitizeHandle(value) }));
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
    setError(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || availability === 'taken') return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/identities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle:      form.handle,
          rddAddress:  form.rddAddress.trim(),
          displayName: form.displayName.trim(),
          bio:         form.bio.trim(),
          website:     form.website.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Registration failed. Please try again.');
        return;
      }
      router.push(`/${form.handle}?new=1`);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !submitting && !!form.handle && !!form.rddAddress && availability !== 'taken' && availability !== 'checking';

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontSize: '1.7rem',
            fontWeight: 700,
            fontFamily: "'Rubik', sans-serif",
            color: 'var(--text-primary)',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          Register your @handle
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Claim a permanent @handle and link your Ɍ RDD wallet.
          Your tip page goes live immediately at{' '}
          <span style={{ color: 'var(--redd-red-light)', fontFamily: 'monospace' }}>
            /{form.handle || 'yourhandle'}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >

          {/* Handle field */}
          <div>
            <Label text="Handle" required />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  color: 'var(--redd-red)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  userSelect: 'none',
                  zIndex: 1,
                }}
              >
                @
              </span>
              <input
                type="text"
                value={form.handle}
                onChange={e => handleChange('handle', e.target.value)}
                placeholder="yourname"
                required
                maxLength={30}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                style={{ ...INPUT_STYLE, paddingLeft: 26 }}
              />
            </div>
            <AvailabilityIndicator state={availability} handle={form.handle} />
            {availability !== 'available' && availability !== 'taken' && availability !== 'checking' && (
              <Hint text="3–30 characters · lowercase letters, numbers, hyphens · cannot start or end with a hyphen" />
            )}
          </div>

          {/* RDD Address */}
          <div>
            <Label text="Ɍ RDD Wallet Address" required />
            <input
              type="text"
              value={form.rddAddress}
              onChange={e => handleChange('rddAddress', e.target.value)}
              placeholder="Rxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required
              maxLength={100}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="font-address"
              style={INPUT_STYLE}
            />
            <Hint text="Your native ReddCoin mainnet address (starts with R for legacy, or rdd1… for SegWit). Tips go here." />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

          {/* Display Name */}
          <div>
            <Label text="Display Name" required={false} />
            <input
              type="text"
              value={form.displayName}
              onChange={e => handleChange('displayName', e.target.value)}
              placeholder="Your Name"
              maxLength={60}
              style={INPUT_STYLE}
            />
            <Hint text="Optional. How you appear on your tip page." />
          </div>

          {/* Bio */}
          <div>
            <Label text="Bio" required={false} />
            <div style={{ position: 'relative' }}>
              <textarea
                value={form.bio}
                onChange={e => handleChange('bio', e.target.value)}
                placeholder="What do you create? (optional)"
                maxLength={160}
                rows={3}
                style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 80 }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 10,
                  fontSize: '0.7rem',
                  color: form.bio.length > 140 ? '#f0a040' : 'var(--text-dim)',
                }}
              >
                {form.bio.length}/160
              </span>
            </div>
            <Hint text="Optional · up to 160 characters" />
          </div>

          {/* Website */}
          <div>
            <Label text="Website" required={false} />
            <input
              type="url"
              value={form.website}
              onChange={e => handleChange('website', e.target.value)}
              placeholder="https://yoursite.com"
              maxLength={200}
              style={INPUT_STYLE}
            />
            <Hint text="Optional · your site, blog, or social profile" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 16,
              background: 'rgba(227,6,19,0.08)',
              border: '1px solid rgba(227,6,19,0.3)',
              borderRadius: 8,
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <XCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            marginTop: 20,
            width: '100%',
            background: canSubmit ? 'var(--redd-red)' : 'rgba(227,6,19,0.3)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '13px 24px',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.6,
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {submitting && <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />}
          {submitting ? 'Registering…' : `Register @${form.handle || 'handle'}`}
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: 14, lineHeight: 1.6 }}>
          v0.1 beta · Handle registration is permanent in this version.
          Cryptographic address verification (wallet signature) ships in v0.2.
        </p>
      </form>
    </div>
  );
}
