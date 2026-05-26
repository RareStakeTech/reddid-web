import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Search · ReddID',
  description: 'Search for ReddCoin handles, display names, and linked social accounts on the ReddID directory.',
};

function SearchFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 20px', gap: 10, color: 'var(--text-dim)' }}>
      <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '0.875rem' }}>Loading search…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient />
    </Suspense>
  );
}
