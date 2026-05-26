'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck, Clock, ExternalLink, Plus } from 'lucide-react';
import { PLATFORM_MAP, platformProfileUrl } from '@/lib/platforms';

interface PageProps {
  params: Promise<{ handle: string }>;
}

interface SocialProofPublic {
  platform: string;
  username: string;
  proofMethod?: string;
  verificationStatus?: string;
  addedAt: string;
}

interface WalletPublic {
  chain: string;
  address: string;
  primary?: boolean;
}

interface IdentityPublic {
  handle: string;
  displayName: string | null;
  bio: string | null;
  website: string | null;
  wallets: WalletPublic[];
  socialProofs: SocialProofPublic[];
}

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? 'pending';
  const map: Record<string, { label: string; color: string; bg: string; border: string; Icon: typeof ShieldCheck }> = {
    verified: { label: 'Verified ✓', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.25)', Icon: ShieldCheck },
    pending:  { label: 'Self-reported', color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.04)', border: 'var(--border)', Icon: Clock },
    failed:   { label: 'Failed', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', Icon: AlertCircle },
  };
  const cfg = map[s] ?? map.pending;
  const Icon = cfg.Icon;
  return (
    <span
      style={{
        fontSize: '0.68rem',
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 4,
        padding: '2px 7px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// U17 — Profile completion indicator
interface CompletionStep {
  label: string;
  done: boolean;
  hint?: string;
}

function ProfileCompletion({ identity, displayName, bio, website }: {
  identity: IdentityPublic;
  displayName: string;
  bio: string;
  website: string;
}) {
  const hasAddress = identity.wallets.some(w => w.chain === 'rdd' && !!(w.address));
  const hasProof = identity.socialProofs.length > 0;
  const hasVerified = identity.socialProofs.some(p => p.verificationStatus === 'verified');

  const steps: CompletionStep[] = [
    { label: 'Handle', done: true },
    { label: 'RDD address', done: hasAddress, hint: 'Add a wallet via the API or next register' },
    { label: 'Display name', done: !!displayName.trim() },
    { label: 'Bio', done: !!bio.trim() },
    { label: 'Website', done: !!website.trim() },
    { label: 'Social link', done: hasProof, hint: 'Link at least one social account' },
    { label: 'Verified link', done: hasVerified, hint: 'Verify at least one social account' },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;

  return (
    <div style={{
      padding: '14px 32px',
      borderBottom: '1px solid var(--border-subtle)',
      background: allDone ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.01)',
    }}>
      {/* Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', fontFamily: "'Rubik', sans-serif", whiteSpace: 'nowrap' }}>
          Profile {pct}% complete
        </div>
        <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: allDone ? '#4ade80' : 'var(--redd-red)',
            borderRadius: 2,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ fontSize: '0.68rem', color: allDone ? '#4ade80' : 'var(--text-dim)', fontWeight: 600 }}>
          {doneCount}/{steps.length}
        </div>
      </div>

      {/* Step chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {steps.map(s => (
          <span
            key={s.label}
            title={!s.done && s.hint ? s.hint : undefined}
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              fontFamily: "'Rubik', sans-serif",
              padding: '2px 8px',
              borderRadius: 20,
              background: s.done ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.done ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
              color: s.done ? '#4ade80' : 'var(--text-dim)',
              cursor: s.done ? 'default' : 'help',
            }}
          >
            {s.done ? '✓' : '○'} {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function EditPage({ params }: PageProps) {
  const { handle } = use(params);

  const [identity, setIdentity]        = useState<IdentityPublic | null>(null);
  const [loading, setLoading]          = useState(true);
  const [notFound, setNotFound]        = useState(false);

  const [editToken, setEditToken]      = useState('');
  const [displayName, setDisplayName]  = useState('');
  const [bio, setBio]                  = useState('');
  const [website, setWebsite]          = useState('');

  const [saving, setSaving]            = useState(false);
  const [saved, setSaved]              = useState(false);
  const [saveError, setSaveError]      = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(`reddid_edittoken_${handle}`);
    if (stored) setEditToken(stored);

    fetch(`/api/identities/${handle}`)
      .then(r => r.json())
      .then(d => {
        if (d.identity) {
          const id: IdentityPublic = d.identity;
          setIdentity(id);
          setDisplayName(id.displayName ?? '');
          setBio(id.bio ?? '');
          setWebsite(id.website ?? '');
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [handle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editToken.trim()) { setSaveError('Edit token is required.'); return; }

    setSaving(true);
    setSaveError('');
    setSaved(false);

    try {
      const res = await fetch(`/api/identities/${handle}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken: editToken.trim(), displayName, bio, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? 'Update failed.');
      } else {
        setIdentity(data.identity);
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
    maxWidth: 620,
    margin: '40px auto',
  };
  const sectionHead: React.CSSProperties = {
    padding: '16px 28px',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: "'Rubik', sans-serif",
  };
  const label: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 6,
    fontFamily: "'Rubik', sans-serif",
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid var(--border)',
    borderRadius: 7,
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    padding: '9px 12px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
  const hint: React.CSSProperties = {
    fontSize: '0.72rem',
    color: 'var(--text-dim)',
    marginTop: 5,
    lineHeight: 1.5,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
        <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--text-dim)' }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ maxWidth: 580, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>@{handle} not found.</p>
        <Link href="/" style={{ color: 'var(--redd-red)', textDecoration: 'none', fontWeight: 600 }}>← Home</Link>
      </div>
    );
  }

  const proofs = identity?.socialProofs ?? [];
  const verifiedCount = proofs.filter(p => p.verificationStatus === 'verified').length;

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={card}>

        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            background: 'linear-gradient(135deg, #1a0808, #110a0a)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--redd-red)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
            @{handle}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", letterSpacing: '-0.02em' }}>
            Edit profile
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Changes are applied immediately. Your edit token is required to authorise updates.
          </p>
        </div>

        {/* U17 — Profile completion indicator */}
        {identity && (
          <ProfileCompletion
            identity={identity}
            displayName={displayName}
            bio={bio}
            website={website}
          />
        )}

        {/* Profile form */}
        <form onSubmit={handleSubmit}>

          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Edit token */}
            <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '12px 16px' }}>
              <label style={{ ...label, color: '#fbbf24' }}>Edit token</label>
              <input
                type="password"
                value={editToken}
                onChange={e => setEditToken(e.target.value)}
                placeholder="16-character hex token from registration"
                style={{ ...inputStyle, borderColor: 'rgba(251,191,36,0.3)', fontFamily: 'monospace', fontSize: '0.82rem' }}
                autoComplete="off"
                spellCheck={false}
              />
              <p style={{ ...hint, color: 'rgba(251,191,36,0.6)' }}>
                Your secret token was shown once after registration.
                It may be pre-filled if you registered in this browser.
              </p>
            </div>

            {/* Display name */}
            <div>
              <label style={label}>Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value.slice(0, 60))}
                placeholder="Your name or creator alias"
                style={inputStyle}
                maxLength={60}
              />
              <p style={hint}>{displayName.length}/60</p>
            </div>

            {/* Bio */}
            <div>
              <label style={label}>Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 160))}
                placeholder="A short description shown on your tip page"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                maxLength={160}
              />
              <p style={hint}>{bio.length}/160</p>
            </div>

            {/* Website */}
            <div>
              <label style={label}>Website</label>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://yoursite.com"
                style={inputStyle}
              />
            </div>

            {/* Error / success */}
            {saveError && (
              <div style={{ background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.28)', borderRadius: 7, padding: '10px 14px', color: '#f87171', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={15} />
                {saveError}
              </div>
            )}
            {saved && (
              <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.28)', borderRadius: 7, padding: '10px 14px', color: '#4ade80', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                <CheckCircle2 size={15} />
                Profile updated successfully.
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: saving ? '#3a0a0a' : 'var(--redd-red)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 7,
                  padding: '9px 22px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  fontFamily: "'Rubik', sans-serif",
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                {saving && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <Link href={`/${handle}`} style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textDecoration: 'none' }}>
                ← Back to tip page
              </Link>
            </div>
          </div>
        </form>

        {/* ── Social Accounts section (U11) ─────────────────────────────── */}
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div style={sectionHead}>
            Social Accounts
            {proofs.length > 0 && (
              <span style={{ marginLeft: 8, color: verifiedCount > 0 ? '#4ade80' : 'var(--text-dim)', fontWeight: 500 }}>
                · {verifiedCount}/{proofs.length} verified
              </span>
            )}
          </div>

          {proofs.length === 0 ? (
            <div style={{ padding: '20px 32px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              No social accounts linked yet.{' '}
              <Link href={`/verify?handle=${handle}`} style={{ color: 'var(--redd-red)', textDecoration: 'none', fontWeight: 600 }}>
                Add your first account →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {proofs.map((proof) => {
                const platformInfo = PLATFORM_MAP[proof.platform];
                const profileUrl   = platformProfileUrl(proof.platform, proof.username);
                return (
                  <div
                    key={proof.platform}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 32px',
                      borderBottom: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Platform icon + name */}
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{platformInfo?.icon ?? '🔗'}</span>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Rubik', sans-serif" }}>
                        {platformInfo?.name ?? proof.platform}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        @{proof.username}
                      </div>
                    </div>

                    {/* Status badge */}
                    <StatusBadge status={proof.verificationStatus} />

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {proof.verificationStatus !== 'verified' && (
                        <Link
                          href={`/verify?handle=${handle}&platform=${proof.platform}`}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--redd-red)',
                            textDecoration: 'none',
                            fontFamily: "'Rubik', sans-serif",
                            background: 'rgba(227,6,19,0.08)',
                            border: '1px solid rgba(227,6,19,0.2)',
                            borderRadius: 5,
                            padding: '3px 9px',
                          }}
                        >
                          Verify →
                        </Link>
                      )}
                      {profileUrl && (
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}
                          title={`View on ${platformInfo?.name ?? proof.platform}`}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add another */}
              <div style={{ padding: '12px 32px' }}>
                <Link
                  href={`/verify?handle=${handle}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontFamily: "'Rubik', sans-serif",
                  }}
                >
                  <Plus size={13} />
                  Add another account
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
