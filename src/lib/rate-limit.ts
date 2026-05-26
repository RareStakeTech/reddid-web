/**
 * rate-limit.ts — rate limiter for server-side API routes.
 *
 * Automatically selects the appropriate backend based on REDDID_DB_ENGINE:
 *   'sqlite' → SqliteDataStore.checkRateLimit() — persists across restarts (S4-06)
 *   'json'   → in-memory Map — resets on server restart (acceptable for local dev)
 *
 * All callers use the same checkRateLimit() function — no changes at call sites.
 *
 * Future: for multi-instance Railway deployments, swap for Redis/Upstash:
 *   https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *
 * Usage:
 *   const result = checkRateLimit(ip, 'register', RATE_LIMITS.register);
 *   if (!result.ok) return Response.json({ error: 'Too many requests.' }, { status: 429 });
 */

import { DB_ENGINE } from './config';
import { getStore, SqliteDataStore } from './store';

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

// ── In-memory fallback (used when REDDID_DB_ENGINE=json) ─────────────────────

interface Bucket {
  count: number;
  windowStart: number;
}

const _memStore = new Map<string, Bucket>();

function checkRateLimitMemory(
  identifier: string,
  action: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const key = `${identifier}:${action}`;
  const now = Date.now();

  let bucket = _memStore.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 0, windowStart: now };
  }
  bucket.count += 1;
  _memStore.set(key, bucket);

  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.windowStart + windowMs,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check and increment a rate limit counter.
 * Delegates to SQLite (persistent) or in-memory Map depending on REDDID_DB_ENGINE.
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
  const { limit, windowMs } = options;

  if (DB_ENGINE === 'sqlite') {
    // SQLite-backed: persists across restarts. S4-06.
    const sqliteStore = getStore() as SqliteDataStore;
    return sqliteStore.checkRateLimit(identifier, action, limit, windowMs);
  }

  // In-memory fallback
  return checkRateLimitMemory(identifier, action, limit, windowMs);
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
  /** Handle recovery via revocationKey — max 5 per IP per hour (defence-in-depth; key has 256-bit entropy) */
  recover: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitOptions>;
