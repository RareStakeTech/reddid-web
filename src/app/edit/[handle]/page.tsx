'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck, Clock, ExternalLink, Plus, CreditCard, Trash2, RefreshCw } from 'lucide-react';
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
  id: string;
  chain: string;
  address: string;
  label?: string | null;
  primary?: boolean;
  revokedAt?: string | null;
}

interface IdentityPublic {
  handle: string;
  displayName: string | null;
  bio: string | null;
  website: string | null;
  wallets: WalletPublic[];
  socialProofs: SocialProofPublic[];
}

function StatusBadge({ status, proofMethod }: { status?: string; proofMethod?: string }) {
  const s = status ?? 'pending';
  const map: Record<string, { label: string; color: string; bg: string; border: string; Icon: typeof ShieldCheck }> = {
    verified:        { label: 'Verified ✓', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.25)', Icon: ShieldCheck },
    'url-verified':  { label: 'URL Verified ✓✓', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', Icon: ShieldCheck },
    pending:         { label: 'Self-reported', color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.04)', border: 'var(--border)', Icon: Clock },
    failed:          { label: 'Failed ✗', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', Icon: AlertCircle },
    expired:         { label: 'Challenge Expired', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', Icon: Clock },
  };
  // Distinguish url-fetch-verified from trust-based verified
  const key = s === 'verified' && proofMethod === 'url-fetch-verified' ? 'url-verified' : s;
  const cfg = map[key] ?? map.pending;
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
    { label: 'RDD address', done: hasAddress, hint: 'Add a wallet in the Wallets section below' },
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

  // Token-expiry recovery state
  const [tokenExpired, setTokenExpired]       = useState(false);
  const [reissuingToken, setReissuingToken]   = useState(false);
  const [reissueError, setReissueError]       = useState('');
  const [reissueSuccess, setReissueSuccess]   = useState(false);

  // Wallet management state
  const [walletAddress, setWalletAddress]     = useState('');
  const [walletLabel, setWalletLabel]         = useState('');
  const [addingWallet, setAddingWallet]       = useState(false);
  const [walletAdded, setWalletAdded]         = useState(false);
  const [walletError, setWalletError]         = useState('');
  const [removingWalletId, setRemovingWalletId]   = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId]   = useState<string | null>(null);

  // Social proof management state
  const [removingSocialPlatform, setRemovingSocialPlatform] = useState<string | null>(null);
  const [socialRemoveError, setSocialRemoveError]           = useState('');

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
        if (res.status === 401 && (data.error ?? '').includes('expired')) {
          setTokenExpired(true);
        } else {
          setSaveError(data.error ?? 'Update failed.');
        }
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

  async function refreshIdentity() {
    try {
      const res = await fetch(`/api/identities/${handle}`);
      const data = await res.json();
      if (data.identity) setIdentity(data.identity);
    } catch { /* silent */ }
  }

  async function handleReissueToken() {
    setReissuingToken(true);
    setReissueError('');
    try {
      const res = await fetch(`/api/identities/${handle}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken: editToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReissueError(data.error ?? 'Failed to reissue token.');
      } else {
        const newToken: string = data.editToken;
        setEditToken(newToken);
        localStorage.setItem(`reddid_edittoken_${handle}`, newToken);
        setTokenExpired(false);
        setSaveError('');
        setWalletError('');
        setReissueSuccess(true);
        setTimeout(() => setReissueSuccess(false), 4000);
      }
    } catch {
      setReissueError('Network error. Please try again.');
    } finally {
      setReissuingToken(false);
    }
  }

  async function handleAddWallet() {
    if (!editToken.trim()) { setWalletError('Edit token is required.'); return; }
    if (!walletAddress.trim()) { setWalletError('Address is required.'); return; }
    setAddingWallet(true);
    setWalletError('');
    setWalletAdded(false);

    const existingRdd = (identity?.wallets ?? []).filter(w => w.chain === 'rdd' && !w.revokedAt);
    try {
      const res = await fetch(`/api/identities/${handle}/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editToken: editToken.trim(),
          chain: 'rdd',
          address: walletAddress.trim(),
          label: walletLabel.trim() || null,
          purpose: 'receive',
          visibility: 'public',
          primary: existingRdd.length === 0, // auto-primary if first RDD wallet
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && (data.error ?? '').includes('expired')) {
          setTokenExpired(true);
        } else {
          setWalletError(data.error ?? 'Failed to add wallet.');
        }
      } else {
        setWalletAdded(true);
        setWalletAddress('');
        setWalletLabel('');
        await refreshIdentity();
        setTimeout(() => setWalletAdded(false), 4000);
      }
    } catch {
      setWalletError('Network error. Please try again.');
    } finally {
      setAddingWallet(false);
    }
  }

  async function handleSetPrimary(walletId: string) {
    if (!editToken.trim()) { setWalletError('Edit token is required.'); return; }
    setSettingPrimaryId(walletId);
    setWalletError('');
    try {
      const res = await fetch(`/api/identities/${handle}/wallets/${walletId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken: editToken.trim(), primary: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401 && (data.error ?? '').includes('expired')) {
          setTokenExpired(true);
        } else {
          setWalletError(data.error ?? 'Failed to set primary wallet.');
        }
      } else {
        await refreshIdentity();
      }
    } catch {
      setWalletError('Network error. Please try again.');
    } finally {
      setSettingPrimaryId(null);
    }
  }

  async function handleRemoveWallet(walletId: string) {
    if (!editToken.trim()) { setWalletError('Edit token is required to remove a wallet.'); return; }
    setRemovingWalletId(walletId);
    setWalletError('');
    try {
      const res = await fetch(`/api/identities/${handle}/wallets/${walletId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken: editToken.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401 && (data.error ?? '').includes('expired')) {
          setTokenExpired(true);
        } else {
          setWalletError(data.error ?? 'Failed to remove wallet.');
        }
      } else {
        await refreshIdentity();
      }
    } catch {
      setWalletError('Network error. Please try again.');
    } finally {
      setRemovingWalletId(null);
    }
  }

  async function handleRemoveSocialProof(platform: string) {
    if (!editToken.trim()) { setSocialRemoveError('Edit token is required.'); return; }
    if (!window.confirm(`Remove your ${platform} social account link? This cannot be undone — you will need to re-verify to restore it.`)) return;
    setRemovingSocialPlatform(platform);
    setSocialRemoveError('');
    try {
      const res = await fetch(`/api/identities/${handle}/socials/${platform}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken: editToken.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401 && (data.error ?? '').includes('expired')) {
          setTokenExpired(true);
        } else {
          setSocialRemoveError(data.error ?? 'Failed to remove social proof.');
        }
      } else {
        await refreshIdentity();
      }
    } catch {
      setSocialRemoveError('Network error. Please try again.');
    } finally {
      setRemovingSocialPlatform(null);
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

        {/* Token-expiry recovery panel */}
        {tokenExpired && (
          <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700 }}>Edit token has expired</span>
              </div>
              <p style={{ color: 'rgba(251,191,36,0.7)', fontSize: '0.78rem', margin: 0, lineHeight: 1.55 }}>
                Tokens expire after 30 days for security. Click below to reissue a fresh token — your browser will be updated automatically.
              </p>
              {reissueError && (
                <p style={{ color: '#f87171', fontSize: '0.75rem', margin: 0 }}>{reissueError}</p>
              )}
              <button
                type="button"
                onClick={handleReissueToken}
                disabled={reissuingToken || !editToken.trim()}
                style={{
                  alignSelf: 'flex-start',
                  background: reissuingToken ? 'rgba(251,191,36,0.4)' : '#fbbf24',
                  color: '#1a0808',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  fontFamily: "'Rubik', sans-serif",
                  cursor: reissuingToken || !editToken.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {reissuingToken
                  ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Reissuing…</>
                  : <><RefreshCw size={13} /> Reissue token</>}
              </button>
            </div>
          </div>
        )}
        {reissueSuccess && (
          <div style={{ padding: '12px 32px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.28)', borderRadius: 7, padding: '10px 14px', color: '#4ade80', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center' }}>
              <CheckCircle2 size={15} />
              Token reissued successfully — your browser is updated. Try saving again.
            </div>
          </div>
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

        {/* ── Wallets section ───────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div style={sectionHead}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <CreditCard size={12} />
              RDD Wallets
              {identity && (identity.wallets ?? []).filter(w => w.chain === 'rdd' && !w.revokedAt).length > 0 && (
                <span style={{ color: '#4ade80', fontWeight: 500 }}>
                  · {(identity.wallets ?? []).filter(w => w.chain === 'rdd' && !w.revokedAt).length} linked
                </span>
              )}
            </span>
          </div>

          <div style={{ padding: '0 32px 20px' }}>
            {/* Existing wallets */}
            {identity && (identity.wallets ?? []).filter(w => !w.revokedAt).length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                {(identity.wallets ?? []).filter(w => !w.revokedAt).map(wallet => (
                  <div
                    key={wallet.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      marginBottom: 6,
                      background: '#0a0a0a',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {wallet.chain.toUpperCase()}
                        </span>
                        {wallet.primary && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(227,6,19,0.1)', border: '1px solid rgba(227,6,19,0.25)', color: 'var(--redd-red)', borderRadius: 4, padding: '1px 6px' }}>
                            Primary
                          </span>
                        )}
                        {wallet.label && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{wallet.label}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                        {wallet.address}
                      </div>
                    </div>
                    {/* Set primary */}
                    {!wallet.primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(wallet.id)}
                        disabled={settingPrimaryId === wallet.id}
                        title="Set as primary wallet"
                        style={{
                          background: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: 5,
                          color: 'var(--text-dim)',
                          cursor: settingPrimaryId === wallet.id ? 'not-allowed' : 'pointer',
                          padding: '4px 9px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          flexShrink: 0,
                          transition: 'all 0.12s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {settingPrimaryId === wallet.id
                          ? <Loader2 size={10} style={{ animation: 'spin 0.8s linear infinite' }} />
                          : null}
                        Set primary
                      </button>
                    )}
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveWallet(wallet.id)}
                      disabled={removingWalletId === wallet.id}
                      title="Remove this wallet"
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: 5,
                        color: 'var(--text-dim)',
                        cursor: removingWalletId === wallet.id ? 'not-allowed' : 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                        flexShrink: 0,
                        transition: 'all 0.12s',
                      }}
                    >
                      {removingWalletId === wallet.id
                        ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <Trash2 size={11} />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: 14, marginTop: 12 }}>
                No wallets linked yet. Add your RDD address below.
              </p>
            )}

            {/* Add wallet form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <div>
                <label style={{ ...label, fontSize: '0.74rem' }}>Add RDD address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={e => setWalletAddress(e.target.value.trim())}
                  placeholder="R… or rdd1… (34 chars)"
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.82rem' }}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={walletLabel}
                  onChange={e => setWalletLabel(e.target.value.slice(0, 60))}
                  placeholder="Label (optional — e.g. Hot wallet)"
                  style={{ ...inputStyle, fontSize: '0.82rem' }}
                  maxLength={60}
                />
              </div>
              {walletError && (
                <div style={{ background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.28)', borderRadius: 7, padding: '8px 12px', color: '#f87171', fontSize: '0.78rem', display: 'flex', gap: 7, alignItems: 'center' }}>
                  <AlertCircle size={13} />
                  {walletError}
                </div>
              )}
              {walletAdded && (
                <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.28)', borderRadius: 7, padding: '8px 12px', color: '#4ade80', fontSize: '0.78rem', display: 'flex', gap: 7, alignItems: 'center' }}>
                  <CheckCircle2 size={13} />
                  Wallet added successfully.
                </div>
              )}
              <button
                type="button"
                onClick={handleAddWallet}
                disabled={addingWallet || !walletAddress.trim()}
                style={{
                  alignSelf: 'flex-start',
                  background: addingWallet || !walletAddress.trim() ? '#1a1a1a' : 'var(--redd-red)',
                  color: addingWallet || !walletAddress.trim() ? 'var(--text-dim)' : 'white',
                  border: 'none',
                  borderRadius: 7,
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  fontFamily: "'Rubik', sans-serif",
                  cursor: addingWallet || !walletAddress.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.12s',
                }}
              >
                {addingWallet
                  ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Adding…</>
                  : <><Plus size={13} /> Add wallet</>}
              </button>
            </div>
          </div>
        </div>

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
                    <StatusBadge status={proof.verificationStatus} proofMethod={proof.proofMethod} />

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {proof.verificationStatus !== 'verified' && (
                        <Link
                          href={`/verify?handle=${handle}&platform=${proof.platform}&username=${encodeURIComponent(proof.username)}`}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: (proof.verificationStatus === 'expired' || proof.verificationStatus === 'failed')
                              ? '#fb923c'
                              : 'var(--redd-red)',
                            textDecoration: 'none',
                            fontFamily: "'Rubik', sans-serif",
                            background: (proof.verificationStatus === 'expired' || proof.verificationStatus === 'failed')
                              ? 'rgba(251,146,60,0.08)'
                              : 'rgba(227,6,19,0.08)',
                            border: `1px solid ${(proof.verificationStatus === 'expired' || proof.verificationStatus === 'failed')
                              ? 'rgba(251,146,60,0.25)'
                              : 'rgba(227,6,19,0.2)'}`,
                            borderRadius: 5,
                            padding: '3px 9px',
                          }}
                        >
                          {(proof.verificationStatus === 'expired' || proof.verificationStatus === 'failed')
                            ? 'Re-verify →'
                            : 'Verify →'}
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
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialProof(proof.platform)}
                        disabled={removingSocialPlatform === proof.platform}
                        title="Remove this social account"
                        style={{
                          background: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: 5,
                          color: 'var(--text-dim)',
                          cursor: removingSocialPlatform === proof.platform ? 'not-allowed' : 'pointer',
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.72rem',
                          flexShrink: 0,
                          transition: 'all 0.12s',
                        }}
                      >
                        {removingSocialPlatform === proof.platform
                          ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                          : <Trash2 size={11} />}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Social remove error */}
              {socialRemoveError && (
                <div style={{ margin: '0 32px 8px', background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.28)', borderRadius: 7, padding: '8px 12px', color: '#f87171', fontSize: '0.78rem', display: 'flex', gap: 7, alignItems: 'center' }}>
                  <AlertCircle size={13} />
                  {socialRemoveError}
                </div>
              )}

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
