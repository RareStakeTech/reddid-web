'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';

interface PublicIdentity {
  handle: string;
  displayName: string | null;
  bio: string | null;
  socialProofs: { platform: string; username: string }[];
  createdAt: string;
}

const PLATFORM_ICON: Record<string, string> = {
  twitter: '𝕏', youtube: '▶', reddit: '●', twitch: '⬟', instagram: '◈', tiktok: '♪', github: '⌥',
};

const ALL_PLATFORMS = ['twitter', 'youtube', 'reddit', 'twitch', 'instagram', 'tiktok', 'github'];

export default function ExplorePage() {
  const [identities, setIdentities] = useState<PublicIdentity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState('');
  const [platform, setPlatform]     = useState('');
  const [sort, setSort]             = useState<'newest' | 'alpha'>('newest');

  useEffect(() => {
    fetch('/api/explore')
      .then(r => r.json())
      .then(d => setIdentities(d.identities ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = identities;
    if (query.trim()) {
      const q = query.toLowerCase().trim().replace(/^@/, '');
      list = list.filter(i =>
        i.handle.includes(q) ||
        (i.displayName ?? '').toLowerCase().includes(q) ||
        (i.bio ?? '').toLowerCase().includes(q)
      );
    }
    if (platform) {
      list = list.filter(i => i.socialProofs.some(p => p.platform === platform));
    }
    if (sort === 'alpha') {
      list = [...list].sort((a, b) => a.handle.localeCompare(b.handle));
    }
    // newest first is default from API
    return list;
  }, [identities, query, platform, sort]);

  const dimStyle: React.CSSProperties = { color: 'var(--text-dim)', fontSize: '0.72rem' };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Users size={20} style={{ color: 'var(--redd-red)' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Rubik', sans-serif", letterSpacing: '-0.02em' }}>
            Explore creators
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {loading ? 'Loading…' : `${identities.length} registered handle${identities.length !== 1 ? 's' : ''} — find one and send Ɍ RDD`}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', background: '#0d0d0d', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', gap: 8 }}>
          <Search size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search handles, names…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', padding: '10px 0', caretColor: 'var(--redd-red)' }}
          />
        </div>

        {/* Platform filter */}
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          style={{ background: '#0d0d0d', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem', padding: '10px 12px', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All platforms</option>
          {ALL_PLATFORMS.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'newest' | 'alpha')}
          style={{ background: '#0d0d0d', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem', padding: '10px 12px', cursor: 'pointer', outline: 'none' }}
        >
          <option value="newest">Newest first</option>
          <option value="alpha">A → Z</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>Loading creators…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No creators found{query || platform ? ' for those filters' : ''}.</p>
          {!query && !platform && (
            <Link href="/register" style={{ color: 'var(--redd-red)', textDecoration: 'none', fontWeight: 700, fontFamily: "'Rubik', sans-serif" }}>
              Be the first → Register your @handle
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map(identity => (
            <Link
              key={identity.handle}
              href={`/${identity.handle}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  height: '100%',
                  transition: 'border-color 0.15s, transform 0.15s',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(227,6,19,0.4)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                }}
              >
                {/* Handle */}
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--redd-red)', letterSpacing: '0.08em' }}>
                  @{identity.handle}
                </div>

                {/* Display name */}
                <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif", color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {identity.displayName ?? `@${identity.handle}`}
                </div>

                {/* Bio */}
                {identity.bio && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>
                    {identity.bio.slice(0, 100)}{identity.bio.length > 100 ? '…' : ''}
                  </div>
                )}

                {/* Social proofs + date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {identity.socialProofs.map(p => (
                      <span
                        key={p.platform}
                        title={`${p.platform}: ${p.username}`}
                        style={{ fontSize: '0.68rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 6px' }}
                      >
                        {PLATFORM_ICON[p.platform] ?? '🔗'}
                      </span>
                    ))}
                  </div>
                  <span style={dimStyle}>
                    {new Date(identity.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA */}
      {!loading && identities.length > 0 && (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/register" style={{ color: 'var(--redd-red)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700, fontFamily: "'Rubik', sans-serif" }}>
            Register your @handle and join →
          </Link>
        </div>
      )}
    </div>
  );
}
