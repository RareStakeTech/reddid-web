'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Plus, Trash2, ChevronDown, ChevronUp, ShieldAlert, Copy, Check } from 'lucide-react';
import { sanitizeHandle, isValidHandle } from '@/lib/validation';
import { LIVE_PLATFORMS } from '@/lib/platforms';

type Field = 'handle' | 'rddAddress' | 'displayName' | 'bio' | 'website';
type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface SocialLink {
  platform: string;
  username: string;
}

interface FormState {
  handle: string;
  rddAddress: string;
  displayName: string;
  bio: string;
  website: string;
}

/** Data shown after successful registration, before redirecting. */
interface RegistrationResult {
  handle: string;
  editToken: string;
  revocationKey: string;
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

// ── Social accounts section ────────────────────────────────────────────────────

function SocialLinksSection({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}) {
  const [open, setOpen] = useState(false);

  function addRow() {
    if (links.length >= 10) return;
    onChange([...links, { platform: LIVE_PLATFORMS[0].id, username: '' }]);
    setOpen(true);
  }

  function removeRow(i: number) {
    onChange(links.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: 'platform' | 'username', value: string) {
    const next = links.map((l, idx) => idx === i ? { ...l, [field]: value } : l);
    onChange(next);
  }

  const hasLinks = links.length > 0;

  return (
    <div>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (!hasLinks && !open) addRow(); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontFamily: "'Rubik', sans-serif",
          fontWeight: 600,
          fontSize: '0.85rem',
        }}
      >
        <span>
          Social Accounts
          <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '0.78rem', marginLeft: 8 }}>
            optional · {links.length > 0 ? `${links.length} added` : 'link X, YouTube, GitHub…'}
          </span>
        </span>
        {open ? <ChevronUp size={16} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-dim)' }} />}
      </button>

      {open && (
        <div style={{ marginTop: 14 }}>
          {links.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 12 }}>
              Linking a social account lets visitors verify it&apos;s really you. You can add proof later via the verify flow.
            </p>
          )}

          {/* Rows */}
          {links.map((link, i) => {
            const def = LIVE_PLATFORMS.find(p => p.id === link.platform);
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr 36px',
                  gap: 8,
                  marginBottom: 10,
                  alignItems: 'center',
                }}
              >
                {/* Platform selector */}
                <select
                  value={link.platform}
                  onChange={e => updateRow(i, 'platform', e.target.value)}
                  style={{
                    ...INPUT_STYLE,
                    padding: '9px 10px',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    paddingRight: 28,
                  }}
                >
                  {LIVE_PLATFORMS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>

                {/* Username input */}
                <input
                  type="text"
                  value={link.username}
                  onChange={e => updateRow(i, 'username', e.target.value)}
                  placeholder={def?.placeholder ?? 'username'}
                  maxLength={100}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  style={INPUT_STYLE}
                />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 7,
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    width: 36,
                    height: 38,
                    padding: 0,
                    flexShrink: 0,
                  }}
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {/* Add row button */}
          {links.length < 10 && (
            <button
              type="button"
              onClick={addRow}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: '1px dashed var(--border)',
                borderRadius: 7,
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontFamily: "'Rubik', sans-serif",
                marginTop: 4,
              }}
            >
              <Plus size={13} />
              Add platform
            </button>
          )}

          <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: 10, lineHeight: 1.5 }}>
            Social links are self-reported at registration. Complete the <strong style={{ color: 'var(--text-muted)' }}>challenge-post flow</strong> after
            registration to record a proof URL.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Recovery key display — shown after successful registration ─────────────────

function RecoveryKeyScreen({
  result,
  onConfirmed,
}: {
  result: RegistrationResult;
  onConfirmed: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function copyKey() {
    navigator.clipboard.writeText(result.revocationKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px' }}>
      <div
        style={{
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.35)',
          borderRadius: 12,
          padding: 28,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <ShieldAlert size={22} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              fontFamily: "'Rubik', sans-serif",
              color: '#fbbf24',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Save your recovery key before continuing
          </h2>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 20 }}>
          <strong style={{ color: 'var(--text-primary)' }}>@{result.handle}</strong> is registered.
          This is your <strong style={{ color: '#fbbf24' }}>recovery key</strong> — the only way to
          reclaim your handle if you ever lose your edit token. Store it securely (password manager,
          printed copy, encrypted note). <strong style={{ color: '#f87171' }}>It will not be shown again.</strong>
        </p>

        {/* Key display */}
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <code
            style={{
              flex: 1,
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              color: '#fbbf24',
              wordBreak: 'break-all',
              lineHeight: 1.7,
              letterSpacing: '0.04em',
            }}
          >
            {result.revocationKey}
          </code>
          <button
            type="button"
            onClick={copyKey}
            title="Copy recovery key"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 6,
              color: copied ? '#4ade80' : '#fbbf24',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              flexShrink: 0,
              transition: 'color 0.2s',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Confirmation checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            cursor: 'pointer',
            marginBottom: 22,
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            style={{ marginTop: 2, flexShrink: 0, accentColor: '#fbbf24' }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            I have saved my recovery key in a secure location. I understand it will not be shown again.
          </span>
        </label>

        {/* CTA */}
        <button
          type="button"
          onClick={onConfirmed}
          disabled={!confirmed}
          style={{
            width: '100%',
            background: confirmed ? '#fbbf24' : 'rgba(251,191,36,0.2)',
            color: confirmed ? '#000' : 'rgba(251,191,36,0.5)',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: confirmed ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          Got it — take me to my tip page →
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 14, lineHeight: 1.6 }}>
        Your edit token has been saved to your browser&apos;s localStorage automatically.
        Your recovery key is separate — it lets you reclaim your handle even from a different device.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    handle: '', rddAddress: '', displayName: '', bio: '', website: '',
  });
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
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

    // Filter out blank social rows before submitting
    const cleanedSocials = socialLinks.filter(l => l.username.trim().length > 0);

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
          socialLinks: cleanedSocials,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Registration failed. Please try again.');
        return;
      }
      // Store editToken in localStorage — it's shown once and never in GET responses
      if (data.editToken) {
        localStorage.setItem(`reddid_edittoken_${form.handle}`, data.editToken);
      }
      // Show recovery key interstitial — user must acknowledge before redirect
      setRegistrationResult({
        handle: form.handle,
        editToken: data.editToken ?? '',
        revocationKey: data.revocationKey ?? '',
      });
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !submitting && !!form.handle && !!form.rddAddress && availability !== 'taken' && availability !== 'checking';

  // Show recovery key screen after registration, before redirect
  if (registrationResult) {
    return (
      <RecoveryKeyScreen
        result={registrationResult}
        onConfirmed={() => router.push(`/${registrationResult.handle}?new=1`)}
      />
    );
  }

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

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

          {/* Social accounts */}
          <SocialLinksSection links={socialLinks} onChange={setSocialLinks} />

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
          By registering you agree to our{' '}
          <a href="/terms" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>Terms of Use</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>Privacy Policy</a>.
          {' '}v0.4 beta · Cryptographic address-ownership verification ships in v0.5.
        </p>
      </form>
    </div>
  );
}
