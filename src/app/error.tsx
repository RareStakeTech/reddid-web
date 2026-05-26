'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in dev; swap for Sentry or similar in production
    console.error('[ReddID Error]', error);
  }, [error]);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '80px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '2.4rem',
          fontFamily: "'Rubik', sans-serif",
          fontWeight: 700,
          color: 'var(--redd-red)',
          marginBottom: 8,
          opacity: 0.5,
        }}
      >
        ⚠
      </div>

      <h2
        style={{
          fontFamily: "'Rubik', sans-serif",
          fontWeight: 700,
          fontSize: '1.4rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: 10,
        }}
      >
        Something went wrong
      </h2>

      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          lineHeight: 1.7,
          marginBottom: 28,
        }}
      >
        An unexpected error occurred. No funds or data have been affected —
        ReddID is a non-custodial directory.
        {error.digest && (
          <span style={{ display: 'block', marginTop: 8, fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            Error ref: {error.digest}
          </span>
        )}
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={reset}
          style={{
            background: 'var(--redd-red)',
            color: 'white',
            border: 'none',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 700,
            fontSize: '0.9rem',
            padding: '10px 22px',
            borderRadius: 7,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/"
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
          Go home
        </a>
      </div>
    </div>
  );
}
