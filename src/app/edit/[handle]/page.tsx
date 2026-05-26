'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ handle: string }>;
}

interface IdentityPublic {
  handle: string;
  displayName: string | null;
  bio: string | null;
  website: string | null;
}

export default function EditPage({ params }: PageProps) {
  const { handle } = use(params);

  const [_identity, setIdentity]      = useState<IdentityPublic | null>(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);

  const [editToken, setEditToken]     = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio]                 = useState('');
  const [website, setWebsite]         = useState('');

  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saveError, setSaveError]     = useState('');

  useEffect(() => {
    // Pre-fill editToken from localStorage
    const stored = localStorage.getItem(`reddid_edittoken_${handle}`);
    if (stored) setEditToken(stored);

    // Load current identity
    fetch(`/api/identities/${handle}`)
      .then(r => r.json())
      .then(d => {
        if (d.identity) {
          setIdentity(d.identity);
          setDisplayName(d.identity.displayName ?? '');
          setBio(d.identity.bio ?? '');
          setWebsite(d.identity.website ?? '');
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
    maxWidth: 580,
    margin: '40px auto',
  };
  const cardHead: React.CSSProperties = {
    padding: '24px 32px',
    background: 'linear-gradient(135deg, #1a0808, #110a0a)',
    borderBottom: '1px solid var(--border)',
  };
  const label: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 6,
    fontFamily: "'Rubik', sans-serif",
  };
  const input: React.CSSProperties = {
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

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={card}>
        <div style={cardHead}>
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

        <form onSubmit={handleSubmit} style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Edit token */}
          <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '12px 16px' }}>
            <label style={{ ...label, color: '#fbbf24' }}>Edit token</label>
            <input
              type="password"
              value={editToken}
              onChange={e => setEditToken(e.target.value)}
              placeholder="16-character hex token from registration"
              style={{ ...input, borderColor: 'rgba(251,191,36,0.3)', fontFamily: 'monospace', fontSize: '0.82rem' }}
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
              style={input}
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
              style={{ ...input, resize: 'vertical', lineHeight: 1.5 }}
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
              style={input}
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

          {/* Verify social links */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 8 }}>
              Want to link and verify your social accounts?
            </p>
            <Link
              href={`/verify?handle=${handle}`}
              style={{ fontSize: '0.78rem', color: 'var(--redd-red)', textDecoration: 'none', fontWeight: 600 }}
            >
              Verify social accounts →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
