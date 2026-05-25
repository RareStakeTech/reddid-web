import { NextRequest } from 'next/server';
import { getAllIdentities, publicIdentity } from '@/lib/db';

/**
 * GET /api/search?q=query[&limit=20]
 *
 * Fuzzy search across handle, displayName, bio, and social-proof usernames.
 * Returns results ranked by relevance score, editToken stripped.
 *
 * Scoring:
 *   handle exact match          +100
 *   handle prefix               +60
 *   handle contains             +30
 *   displayName exact           +80
 *   displayName prefix          +50
 *   displayName contains        +25
 *   socialProof username exact  +70
 *   socialProof prefix          +40
 *   socialProof contains        +20
 *   bio contains                +10
 */
export async function GET(request: NextRequest) {
  const raw   = request.nextUrl.searchParams.get('q') ?? '';
  const q     = raw.trim().toLowerCase().replace(/^@/, '');
  const limit = Math.min(
    Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10)),
    50,
  );

  if (!q || q.length < 2) {
    return Response.json({ results: [], query: q, total: 0 });
  }

  const all = getAllIdentities();

  const scored = all
    .map(identity => {
      let score = 0;
      const handle      = identity.handle.toLowerCase();
      const displayName = (identity.displayName ?? '').toLowerCase();
      const bio         = (identity.bio ?? '').toLowerCase();

      // Handle
      if (handle === q)            score += 100;
      else if (handle.startsWith(q)) score += 60;
      else if (handle.includes(q))   score += 30;

      // Display name
      if (displayName) {
        if (displayName === q)            score += 80;
        else if (displayName.startsWith(q)) score += 50;
        else if (displayName.includes(q))   score += 25;
      }

      // Social proof usernames (any platform)
      for (const sp of identity.socialProofs) {
        const u = sp.username.toLowerCase().replace(/^@/, '');
        if (u === q)            { score += 70; break; }
        if (u.startsWith(q))   { score += 40; continue; }
        if (u.includes(q))     { score += 20; continue; }
      }

      // Bio (lowest weight)
      if (bio && bio.includes(q)) score += 10;

      return { identity, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return Response.json({
    results: scored.map(x => publicIdentity(x.identity)),
    query:   q,
    total:   scored.length,
  });
}
