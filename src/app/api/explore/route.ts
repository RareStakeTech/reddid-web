import type { NextRequest } from 'next/server';
import { getAllIdentities, publicIdentity } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/explore
 * Returns all public identities sorted newest-first.
 * Used by the /explore creator directory page.
 * Sensitive fields (editToken, verificationChallenges) are stripped by publicIdentity().
 */
export async function GET(_req: NextRequest) {
  const all = getAllIdentities();

  // Newest first (API contract for the explore page's default sort)
  const sorted = [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return Response.json({
    identities: sorted.map(publicIdentity),
    total: sorted.length,
  });
}
