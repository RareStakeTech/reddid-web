/**
 * config.ts — Environment-variable backed runtime configuration.
 *
 * All hardcoded URLs and paths in the app should reference these constants
 * rather than inlining strings. This enables Railway / Docker deploys to
 * override values without code changes.
 *
 * Server-only values (DB path, etc.) are fine to use in API routes and
 * server components. Client-visible values must use NEXT_PUBLIC_ prefix.
 *
 * Usage:
 *   import { DB_PATH, BLOCKBOOK_URL, BASE_URL } from '@/lib/config';
 */

import path from 'path';

// ── Database ──────────────────────────────────────────────────────────────────

/**
 * Absolute path to the JSON database file.
 * Override with REDDID_DB_PATH for Railway persistent-volume mounts.
 *
 * Example Railway value: /app/data/db.json
 */
export const DB_PATH: string = process.env.REDDID_DB_PATH
  ?? path.join(process.cwd(), 'data', 'db.json');

// ── External services ─────────────────────────────────────────────────────────

/**
 * ReddCoin block explorer (Blockbook v2 API).
 * Used for: live address balance, recent transaction list.
 * Override with REDDID_BLOCKBOOK_URL to point at a local or testnet node.
 */
export const BLOCKBOOK_URL: string =
  process.env.REDDID_BLOCKBOOK_URL ?? 'https://blockbook.reddcoin.com';

// ── Public base URL ───────────────────────────────────────────────────────────

/**
 * Canonical public URL of this deployment — used in sitemap, OG tags, etc.
 * Defaults to the production domain. Override for staging or self-hosted.
 *
 * Note: uses NEXT_PUBLIC_ so it's also available in client components.
 */
export const BASE_URL: string =
  process.env.NEXT_PUBLIC_REDDID_BASE_URL ?? 'https://redd.love';
