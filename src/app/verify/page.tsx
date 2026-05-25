'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
import { Suspense } from 'react';

const PLATFORMS: Record<string, { label: string; instruction: string; urlHint: string }> = {
  twitter:   { label: 'Twitter / X',  instruction: 'Add this code to your Twitter bio, or post it in a tweet.',          urlHint: 'https://twitter.com/yourhandle or tweet URL' },
  youtube:   { label: 'YouTube',      instruction: 'Add this code to your YouTube channel About section.',                 urlHint: 'https://youtube.com/@yourchannel' },
  reddit:    { label: 'Reddit',       instruction: 'Add this code to your Reddit profile bio.',                            urlHint: 'https://reddit.com/u/yourname' },
  instagram: { label: 'Instagram',    instruction: 'Add this code to your Instagram bio.',                                 urlHint: 'https://instagram.com/yourhandle' },
  twitch:    { label: 'Twitch',       instruction: 'Add this code to your Twitch About / Bio section.',                    urlHint: 'https://twitch.tv/yourhandle' },
  tiktok:    { label: 'TikTok',       instruction: 'Add this code to your TikTok bio.',                                    urlHint: 'https://tiktok.com/@yourhandle' },
  github:    { label: 'GitHub',       instruction: 'Add this code to your GitHub profile bio.',                            urlHint: 'https://github.com/yourhandle' },
};

function VerifyForm() {
  const searchParams = useSearchParams();

  const [handle, setHandle]       = useState(searchParams.get('handle') ?? '');
  const [platform, setPlatform]   = useState(searchParams.get('platform') ?? '');
  const [editToken, setEditToken] = useState('');
  const [username, setUsername]   = useState('');
  const [proofUrl, setProofUrl]   = useState('');

  const [step, setStep]           = useState<'form' | 'challenge' | 'confirm' | 'done'>('form');
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    if (handle) {
      const stored = localStorage.getItem(`reddid_edittoken_${handle}`);
      if (stored) setEditToken(stored);
    }
  }, [handle]);

  async function requestChallenge() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, platform, editToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed.'); return; }
      setChallenge(data.challenge);
      setStep('challenge');
    } catch { setError('Network error.'); }
    finally   { setLoading(false); }
  }

  async function confirmProof() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, platform, username, proofUrl, editToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed.'); return; }
      setStep('done');
    } catch { setError('Network error.'); }
    finally   { setLoading(false); }
  }

  async function copyChallenge() {
    await navigator.clipboard.writeText(challenge);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
    maxWidth: 560,
    margin: '40px auto',
  };
  const inp: React.CSSProperties = {
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
  const lbl: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 5,
    fontFamily: "'Rubik', sans-serif",
  };

  const platformInfo = PLATFORMS[platform] ?? null;

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={card}>
        <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #1a0808, #110a0a)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--redd-red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Social proof verification
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", letterSpacing: '-0.02em' }}>
            Link your account
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.6 }}>
            Prove you control a social account to link it with your ReddID.
            Your followers will see a Ɍ tip button when they view your profile.
          </p>
        </div>

        <div style={{ padding: '24px 32px' }}>

          {/* ── Step: Form ── */}
          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Your ReddID handle</label>
                <input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="handle" style={inp} />
              </div>
              <div>
                <label style={lbl}>Edit token</label>
                <input
                  type="password"
                  value={editToken}
                  onChange={e => setEditToken(e.target.value)}
                  placeholder="Your secret token from registration"
                  style={{ ...inp, fontFamily: 'monospace' }}
                  autoComplete="off"
                />
              </div>
              <div>
                <label style={lbl}>Platform</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  <option value="">— Select platform —</option>
                  {Object.entries(PLATFORMS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              {error && (
                <div style={{ background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.28)', borderRadius: 7, padding: '9px 12px', color: '#f87171', fontSize: '0.82rem', display: 'flex', gap: 7, alignItems: 'center' }}>
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <button
                onClick={requestChallenge}
                disabled={loading || !handle || !platform || !editToken}
                style={{ background: 'var(--redd-red)', color: 'white', border: 'none', borderRadius: 7, padding: '10px 22px', fontSize: '0.875rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start' }}
              >
                {loading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
                Get challenge code →
              </button>
            </div>
          )}

          {/* ── Step: Challenge ── */}
          {step === 'challenge' && platformInfo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.65 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Step 1:</strong>{' '}
                  {platformInfo.instruction}
                </p>
                <div style={{ background: '#0a0a0a', border: '1px solid rgba(227,6,19,0.3)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <code style={{ fontFamily: 'monospace', fontSize: '1.4rem', letterSpacing: '0.2em', fontWeight: 700, color: 'var(--redd-red)' }}>
                    {challenge}
                  </code>
                  <button onClick={copyChallenge} style={{ background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`, color: copied ? '#4ade80' : 'var(--text-dim)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 8 }}>
                  Post this code publicly on your {platformInfo.label} profile. You can remove it after verification.
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Step 2:</strong>{' '}
                  Enter your username and the URL where you posted the code.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={lbl}>Your {platformInfo.label} username</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username (without @)" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>URL where you posted the code</label>
                    <input type="url" value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder={platformInfo.urlHint} style={inp} />
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.28)', borderRadius: 7, padding: '9px 12px', color: '#f87171', fontSize: '0.82rem', display: 'flex', gap: 7, alignItems: 'center' }}>
                  <AlertCircle size={14} />{error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={confirmProof}
                  disabled={loading || !username}
                  style={{ background: 'var(--redd-red)', color: 'white', border: 'none', borderRadius: 7, padding: '10px 22px', fontSize: '0.875rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
                >
                  {loading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  Submit verification
                </button>
                <button onClick={() => { setStep('form'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer' }}>
                  ← Back
                </button>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                <strong>v0.1 note:</strong> We trust you posted the code — no automated check is run yet.
                Platform API verification ships in v0.2.
              </p>
            </div>
          )}

          {/* ── Step: Done ── */}
          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 16, textAlign: 'center' }}>
              <CheckCircle2 size={40} style={{ color: '#4ade80' }} />
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", marginBottom: 6 }}>Account linked!</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Your {platformInfo?.label ?? platform} account is now linked to @{handle}.
                  The Love Button extension will now show a tip button on your profile.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Link href={`/${handle}`} style={{ background: 'var(--redd-red)', color: 'white', textDecoration: 'none', borderRadius: 7, padding: '8px 18px', fontSize: '0.82rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif" }}>
                  View tip page
                </Link>
                <button onClick={() => { setStep('form'); setPlatform(''); setUsername(''); setProofUrl(''); setChallenge(''); }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 7, padding: '8px 18px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  Link another account
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}><Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--text-dim)' }} /></div>}>
      <VerifyForm />
    </Suspense>
  );
}
