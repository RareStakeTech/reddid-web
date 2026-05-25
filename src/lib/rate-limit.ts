/**
 * rate-limit.ts — in-memory rate limiter for server-side API routes.
 *
 * This is a single-process, in-memory implementation. It is NOT safe for
 * multi-process deployments (multiple Next.js workers, serverless, etc.).
 *
 * Swap for Redis/Upstash rate limiting in production:
 *   - https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *   - Replace the `_store` Map with Redis INCR + EXPIRE calls
 *   - Drop-in replacement: same check() signature
 *
 * Usage:
 *   const result = rateLimiter.check(ip, 'register', { limit: 5, windowMs: 60_000 });
 *   if (!result.ok) return Response.json({ error: 'Too many requests.' }, { status: 429 });
 */

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** true if the request is within the rate limit */
  ok: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
}

interface Bucket {
  count: number;
  windowStart: number;
}

// In-memory store: keyed by `${ip}:${action}`
const _store = new Map<string, Bucket>();

/**
 * Check and increment a rate limit counter.
 *
 * @param identifier  Client identifier — typically IP address or handle
 * @param action      Namespaced action key (e.g. 'register', 'verify-challenge')
 * @param options     limit + windowMs configuration
 */
export function checkRateLimit(
  identifier: string,
  action: string,
  options: RateLimitOptions,
): RateLimitResult {
  const key = `${identifier}:${action}`;
  const now = Date.now();
  const { limit, windowMs } = options;

  let bucket = _store.get(key);

  // If bucket doesn't exist or window has expired, start fresh
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 0, windowStart: now };
  }

  bucket.count += 1;
  _store.set(key, bucket);

  const resetAt = bucket.windowStart + windowMs;
  const remaining = Math.max(0, limit - bucket.count);

  return {
    ok: bucket.count <= limit,
    remaining,
    resetAt,
  };
}

// ── Preset rate limits ────────────────────────────────────────────────────────
// These are intentionally loose for MVP (single dev environment).
// Tighten in production and/or move to Redis with Upstash.

export const RATE_LIMITS = {
  /** New handle registration — max 3 per IP per hour */
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** Verification challenge generation — max 10 per IP per 10 minutes */
  verifyChallenge: { limit: 10, windowMs: 10 * 60 * 1000 },
  /** Proof confirmation — max 20 per IP per 10 minutes */
  verifyConfirm: { limit: 20, windowMs: 10 * 60 * 1000 },
  /** Abuse report submission — max 5 per IP per hour */
  report: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Payment intent creation — max 30 per IP per hour */
  paymentCreate: { limit: 30, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitOptions>;
