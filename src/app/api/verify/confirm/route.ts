import type { NextRequest } from 'next/server';
import { confirmSocialProof, getIdentityByHandle, publicIdentity } from '@/lib/db';
import { sanitizeHandle, isValidUrl } from '@/lib/validation';
import { fetchProofUrl } from '@/lib/proof-fetcher';

/**
 * POST /api/verify/confirm
 * Body: { handle, platform, username, proofUrl, editToken }
 *
 * Records a social proof after the user claims to have posted the challenge code.
 *
 * S3-01 (2026-05-26): Server now fetches proofUrl and confirms the challenge
 * code appears in the response before marking the proof as verified.
 *
 * Flow when proofUrl is provided:
 *   1. Read the identity to extract the pending challenge code.
 *   2. Fetch proofUrl (5s timeout, 512KB cap).
 *   3a. If code found in response → proofMethod: 'url-fetch-verified' (stronger trust level).
 *   3b. If code NOT found → return 422 with "code not found at URL" guidance.
 *   3c. If URL unreachable → return 503 with "could not fetch URL" + retry suggestion.
 *   4. Call confirmSocialProof() with the resolved proofMethod.
 *
 * Flow when proofUrl is absent (empty string):
 *   - Falls back to trust-based: proofMethod: 'challenge-post'.
 *   - User sees 'Post Verified' badge instead of 'URL Verified'.
 *
 * Error codes:
 *   400 BAD_REQUEST          — missing required field
 *   404 NOT_FOUND            — handle not registered
 *   401 UNAUTHORIZED         — editToken wrong; TOKEN_EXPIRED with reissue hint
 *   410 CHALLENGE_EXPIRED    — challenge code has expired (8h TTL); call /challenge again
 *   422 CODE_NOT_FOUND       — URL fetched but challenge code not present (user guidance)
 *   429 CHALLENGE_RATE_LIMITED — too many failed attempts
 *   503 FETCH_FAILED         — proofUrl unreachable; user can retry or submit without URL
 *   500                      — unexpected server error
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const handle    = sanitizeHandle(String(body.handle    ?? ''));
  const platform  = String(body.platform  ?? '').trim().toLowerCase();
  const username  = String(body.username  ?? '').trim();
  const proofUrl  = String(body.proofUrl  ?? '').trim();
  const editToken = String(body.editToken ?? '').trim();

  if (!handle)    return Response.json({ error: 'handle is required.'    }, { status: 400 });
  if (!platform)  return Response.json({ error: 'platform is required.'  }, { status: 400 });
  if (!username)  return Response.json({ error: 'username is required.'  }, { status: 400 });
  if (!editToken) return Response.json({ error: 'editToken is required.' }, { status: 401 });

  if (proofUrl && !isValidUrl(proofUrl)) {
    return Response.json({ error: 'proofUrl must be a valid https:// URL.' }, { status: 422 });
  }

  // ── S3-01: Server-side URL verification ──────────────────────────────────────
  let proofMethod: 'challenge-post' | 'url-fetch-verified' = 'challenge-post';

  if (proofUrl) {
    // Read the identity to get the pending challenge code BEFORE confirming.
    // confirmSocialProof() clears the challenge on success, so we need the
    // code now for the fetch step.
    const identity = getIdentityByHandle(handle);
    if (!identity) {
      return Response.json({ error: `@${handle} not found.` }, { status: 404 });
    }

    const challenge = identity.verificationChallenges?.[platform.toLowerCase()];
    const challengeCode = challenge && typeof challenge === 'object'
      ? (challenge as { code?: string }).code
      : undefined;

    if (challengeCode) {
      const fetchResult = await fetchProofUrl(proofUrl, challengeCode);

      if (!fetchResult.reachable) {
        // URL could not be fetched — let the user know and suggest retrying or
        // submitting without a URL (trust-based fallback).
        return Response.json(
          {
            error: `Could not reach the URL you provided. ${fetchResult.error ?? ''}`.trim(),
            hint: 'Check the URL is publicly accessible, or submit without a proofUrl to use trust-based verification.',
            code: 'FETCH_FAILED',
          },
          { status: 503 },
        );
      }

      if (!fetchResult.found) {
        // URL was reachable but challenge code not present.
        return Response.json(
          {
            error: `Your challenge code was not found at the provided URL. Make sure it appears exactly as shown (case-insensitive).`,
            hint: 'Post the code to your profile, wait a moment for the page to update, then try again.',
            code: 'CODE_NOT_FOUND',
          },
          { status: 422 },
        );
      }

      // Code confirmed — upgrade trust level
      proofMethod = 'url-fetch-verified';
    }
    // If no challenge found (e.g., already expired at this point),
    // confirmSocialProof() below will throw CHALLENGE_EXPIRED as normal.
  }
  // ─────────────────────────────────────────────────────────────────────────────

  try {
    const identity = confirmSocialProof(handle, platform, username, proofUrl, editToken, proofMethod);
    return Response.json({
      identity: publicIdentity(identity),
      proofMethod,   // let the client know which trust level was achieved
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')              return Response.json({ error: `@${handle} not found.` },                          { status: 404 });
    if (msg === 'UNAUTHORIZED')           return Response.json({ error: 'Edit token incorrect.' },                          { status: 401 });
    if (msg === 'TOKEN_EXPIRED')          return Response.json({ error: 'TOKEN_EXPIRED', hint: `POST /api/identities/${handle}/token` }, { status: 401 });
    if (msg === 'CHALLENGE_EXPIRED')      return Response.json({ error: 'Challenge has expired. Request a new one.' },      { status: 410 });
    if (msg === 'CHALLENGE_RATE_LIMITED') return Response.json({ error: 'Too many attempts. Request a new challenge.' },    { status: 429 });
    return Response.json({ error: 'Failed to confirm proof.' }, { status: 500 });
  }
}
