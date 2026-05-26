'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, AtSign } from 'lucide-react';
import { PLATFORM_MAP } from '@/lib/platforms';

interface SearchResult {
  handle: string;
  displayName: string | null;
  bio: string | null;
  socialProofs: { platform: string; username: string; verificationStatus?: string }[];
  createdAt: string;
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim().replace(/^@/, '');
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=20`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run on mount if initial query provided from URL
  useEffect(() => {
    if (initialQ.trim().length >= 2) runSearch(initialQ);
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = val.trim();
      const params = new URLSearchParams();
      if (trimmed) params.set('q', trimmed);
      const qs = params.toString();
      router.replace(`/search${qs ? `?${qs}` : ''}`, { scroll: false });
      runSearch(val);
    }, 350);
  }

  function clearSearch() {
    setQuery('');
    setResults([]);
    setSearched(false);
    router.replace('/search', { scroll: false });
    inputRef.current?.focus();
  }

  const noResults = searched && results.length === 0 && !loading;
  const hasResults = results.length > 0;
  const displayQ = query.trim().replace(/^@/, '');

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Search size={20} style={{ color: 'var(--redd-red)' }} />
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            fontFamily: "'Rubik', sans-serif",
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}>
            Search
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Find handles, display names, and linked social accounts across the ReddID directory.
        </p>
      </div>

      {/* Search input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#0d0d0d',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '0 16px',
        gap: 10,
        marginBottom: 24,
      }}>
        {loading
          ? <Loader2 size={16} style={{ color: 'var(--text-dim)', flexShrink: 0, animation: 'spin 0.8s linear infinite' }} />
          : <Search size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
        }
        <input
          ref={inputRef}
          type="search"
          autoFocus
          placeholder="Search @handle, name, or @social username…"
          value={query}
          onChange={e => handleChange(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            padding: '14px 0',
            caretColor: 'var(--redd-red)',
            fontFamily: "'Rubik', sans-serif",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-dim)',
              padding: '4px 6px',
              lineHeight: 1,
              fontSize: '1.1rem',
              borderRadius: 4,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Result count */}
      {hasResults && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 12 }}>
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{displayQ}&rdquo;
        </p>
      )}

      {/* Results list */}
      {hasResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map(identity => (
            <Link
              key={identity.handle}
              href={`/${identity.handle}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="search-result-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                }}
              >
                {/* Avatar placeholder */}
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 10,
                  background: 'rgba(227,6,19,0.08)',
                  border: '1px solid rgba(227,6,19,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--redd-red)',
                }}>
                  <AtSign size={16} strokeWidth={2} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + handle */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      fontFamily: "'Rubik', sans-serif",
                      color: 'var(--text-primary)',
                    }}>
                      {identity.displayName ?? `@${identity.handle}`}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--redd-red)',
                      letterSpacing: '0.06em',
                    }}>
                      @{identity.handle}
                    </span>
                  </div>

                  {/* Bio snippet */}
                  {identity.bio && (
                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      margin: '0 0 8px',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}>
                      {identity.bio.slice(0, 120)}{identity.bio.length > 120 ? '…' : ''}
                    </p>
                  )}

                  {/* Platform badges */}
                  {identity.socialProofs.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {identity.socialProofs.map(p => (
                        <span
                          key={p.platform}
                          title={`${PLATFORM_MAP[p.platform]?.name ?? p.platform}: @${p.username}`}
                          style={{
                            fontSize: '0.65rem',
                            color: p.verificationStatus === 'verified' ? '#4ade80' : 'var(--text-dim)',
                            background: p.verificationStatus === 'verified'
                              ? 'rgba(74,222,128,0.07)'
                              : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${p.verificationStatus === 'verified'
                              ? 'rgba(74,222,128,0.25)'
                              : 'var(--border)'}`,
                            borderRadius: 3,
                            padding: '1px 6px',
                          }}
                        >
                          {PLATFORM_MAP[p.platform]?.icon ?? '🔗'} {p.username}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No results */}
      {noResults && displayQ.length >= 2 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>🔍</div>
          <p style={{
            color: 'var(--text-muted)',
            fontWeight: 600,
            fontFamily: "'Rubik', sans-serif",
            marginBottom: 6,
          }}>
            No results for &ldquo;{displayQ}&rdquo;
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: 20 }}>
            That handle isn&apos;t registered yet.
          </p>
          <Link
            href={`/register?handle=${encodeURIComponent(displayQ)}`}
            style={{
              color: 'var(--redd-red)',
              textDecoration: 'none',
              fontWeight: 700,
              fontFamily: "'Rubik', sans-serif",
              fontSize: '0.875rem',
            }}
          >
            Register @{displayQ} →
          </Link>
        </div>
      )}

      {/* Empty prompt */}
      {!searched && !loading && !query.trim() && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: 12 }}>
            Start typing to search the ReddID directory — handles, names, and linked social accounts.
          </p>
          <Link
            href="/explore"
            style={{
              color: 'var(--redd-red)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              fontFamily: "'Rubik', sans-serif",
            }}
          >
            Browse all creators →
          </Link>
        </div>
      )}

      <style>{`
        .search-result-card { transition: border-color 0.15s; }
        .search-result-card:hover { border-color: rgba(227,6,19,0.4) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
