import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 — Page not found · ReddID',
};

export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: '80px 20px',
        textAlign: 'center',
      }}
    >
      {/* Big Ɍ */}
      <div
        style={{
          fontSize: '4rem',
          fontFamily: "'Rubik', sans-serif",
          fontWeight: 700,
          color: 'var(--redd-red)',
          lineHeight: 1,
          marginBottom: 8,
          opacity: 0.6,
        }}
      >
        Ɍ
      </div>

      <h1
        style={{
          fontFamily: "'Rubik', sans-serif",
          fontWeight: 700,
          fontSize: '1.6rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: 10,
        }}
      >
        Handle not found
      </h1>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 32 }}>
        <code
          style={{
            fontFamily: 'monospace',
            color: 'var(--text-dim)',
            fontSize: '0.85em',
          }}
        >
          This @handle isn&apos;t registered on ReddID yet.
        </code>
        <br />
        You can register it, search the directory, or go back home.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
        <Link
          href="/register"
          style={{
            background: 'var(--redd-red)',
            color: 'white',
            textDecoration: 'none',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 700,
            fontSize: '0.9rem',
            padding: '10px 22px',
            borderRadius: 7,
          }}
        >
          Register this handle
        </Link>
        <Link
          href="/explore"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 500,
            fontSize: '0.9rem',
            padding: '10px 22px',
            borderRadius: 7,
          }}
        >
          Browse creators
        </Link>
      </div>

      {/* Quick search hint */}
      <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
        Looking for someone?{' '}
        <Link href="/search" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
          Search the ReddID directory →
        </Link>
      </p>
    </div>
  );
}
