'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/** Shows an "Edit profile" link only when the browser holds the editToken for this handle. */
export default function EditLink({ handle }: { handle: string }) {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const key = `reddid_edittoken_${handle}`;
    setHasToken(!!localStorage.getItem(key));
  }, [handle]);

  if (!hasToken) return null;

  return (
    <Link
      href={`/edit/${handle}`}
      style={{
        fontSize: '0.72rem',
        color: 'var(--text-dim)',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        border: '1px solid var(--border)',
        borderRadius: 4,
        transition: 'border-color 0.12s, color 0.12s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--text-dim)';
        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-dim)';
      }}
    >
      ✎ Edit profile
    </Link>
  );
}
