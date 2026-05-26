/**
 * config.ts — Environment-variable backed runtime configuration.
 *
 * All hardcoded URLs and paths in the app should reference these constants
 * rather than inlining strings. This enables Railway / Docker deploys to
 * override values without code changes.
 *
 * Server-only values (DB path, admin secret, etc.) are fine to use in API
 * routes and server components. Client-visible values must use NEXT_PUBLIC_.
 *
 * Usage:
 *   import { DB_PATH, DB_ENGINE, ADMIN_SECRET, BLOCKBOOK_URL, BASE_URL } from '@/lib/config';
 *
 * Required Railway env vars:
 *   REDDID_DB_PATH        — absolute path on persistent volume (e.g. /app/data/db.json)
 *   NEXT_PUBLIC_REDDID_BASE_URL — canonical public URL (e.g. https://redd.love)
 *   ADMIN_SECRET          — Bearer token for /api/admin/reports (generate: openssl rand -hex 32)
 *
 * Optional Railway env vars:
 *   REDDID_DB_ENGINE      — 'json' (default) | 'sqlite' (Sprint 4 S4-01)
 *   REDDID_BLOCKBOOK_URL  — block explorer base URL (server-side fetches)
 *   NEXT_PUBLIC_REDDID_BLOCKBOOK_URL — block explorer base URL (client-side widgets)
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

/**
 * DataStore backend engine selector.
 * 'json'   — JsonFileDataStore (default, current implementation)
 * 'sqlite' — SqliteDataStore (Sprint 4 S4-01 — not yet implemented)
 *
 * Switch with: REDDID_DB_ENGINE=sqlite on Railway after S4-01 is complete.
 */
export const DB_ENGINE: 'json' | 'sqlite' =
  (process.env.REDDID_DB_ENGINE === 'sqlite' ? 'sqlite' : 'json');

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * Secret token for the admin abuse-report API (/api/admin/reports).
 * Required to use the admin report queue. No default — undefined disables auth.
 *
 * Generate: openssl rand -hex 32
 * Must match the Authorization: Bearer <token> header on API calls.
 * Also accepted as ?secret=<token> query param for the /admin/reports page.
 */
export const ADMIN_SECRET: string | undefined = process.env.ADMIN_SECRET;

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
