import type { NextRequest } from 'next/server';
import { getIdentityBySocial, publicIdentity } from '@/lib/db';

/**
 * GET /api/identities/by-social?platform=twitter&username=alice
 *
 * Used by the Love Button browser extension to auto-detect creator handles
 * without the user knowing the ReddID handle in advance.
 *
 * Resolution order:
 * 1. socialProofs array match (explicit platform + username link)
 * 2. handle === username fallback (creators who registered with their social username)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = (searchParams.get('platform') ?? '').trim().toLowerCase();
  const username  = (searchParams.get('username')  ?? '').trim();

  if (!platform || !username) {
    return Response.json(
      { error: 'Both platform and username query params are required.' },
      { status: 400 }
    );
  }

  const identity = getIdentityBySocial(platform, username);
  if (!identity) {
    return Response.json({ error: 'No ReddID found for this social account.' }, { status: 404 });
  }

  return Response.json({ identity: publicIdentity(identity) });
}
