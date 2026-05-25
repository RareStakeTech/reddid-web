/**
 * Validation utilities for ReddID Next.
 * v0.1: format validation only. Cryptographic address-ownership
 * proof (wallet signature verification) ships in v0.2.
 *
 * Network params from reddcoinjs-lib / reddcoin-project:
 *   mainnet  pubKeyHash: 0x3d → base58 prefix 'R', P2PKH length 34
 *   mainnet  scriptHash: 0x05 → base58 prefix '3', P2SH length 34
 *   mainnet  bech32 HRP: 'rdd' → SegWit P2WPKH/P2WSH
 *   testnet  pubKeyHash: 0x6f → prefix 'm'/'n'
 */

// Base58 character set — no 0, O, I, l
const BASE58_CHARS = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

// Bech32 charset (lowercase alphanumeric, no 1, b, i, o)
const BECH32_CHARS = /^[ac-hj-np-z02-9]+$/;

export type AddressType = 'legacy' | 'segwit' | 'testnet' | 'unknown';

/**
 * Detect the type of a RDD address without a full checksum verify.
 * Returns 'legacy' for mainnet P2PKH (R…), 'segwit' for bech32 (rdd1…),
 * 'testnet' for testnet P2PKH (m/n…), or 'unknown'.
 */
export function getAddressType(address: string): AddressType {
  if (!address || typeof address !== 'string') return 'unknown';
  const a = address.trim();
  if (a.startsWith('R') && a.length === 34 && BASE58_CHARS.test(a)) return 'legacy';
  // bech32: HRP 'rdd', separator '1', then 6–87 bech32 chars (min total ~12)
  if (a.toLowerCase().startsWith('rdd1') && a.length >= 14 && BECH32_CHARS.test(a.slice(4))) return 'segwit';
  if ((a.startsWith('m') || a.startsWith('n')) && a.length === 34 && BASE58_CHARS.test(a)) return 'testnet';
  return 'unknown';
}

/**
 * Validate a native RDD address (mainnet P2PKH or SegWit bech32).
 */
export function isValidRddAddress(address: string): boolean {
  const t = getAddressType(address);
  return t === 'legacy' || t === 'segwit' || t === 'testnet';
}

/** Build a BIP21 payment URI for RDD. */
export function buildBip21Uri(address: string, amountRdd?: number, label?: string): string {
  const params = new URLSearchParams();
  if (amountRdd !== undefined) params.set('amount', amountRdd.toString());
  if (label) params.set('label', label);
  const qs = params.toString();
  return `reddcoin:${address}${qs ? `?${qs}` : ''}`;
}

/**
 * Validate a ReddID handle.
 * Rules: 3–30 chars, lowercase alphanumeric and hyphens only,
 * cannot start or end with hyphen, no consecutive hyphens.
 */
export function isValidHandle(handle: string): { valid: boolean; error?: string } {
  if (!handle || typeof handle !== 'string') {
    return { valid: false, error: 'Handle is required.' };
  }
  const h = handle.trim().toLowerCase();
  if (h.length < 3) return { valid: false, error: 'Handle must be at least 3 characters.' };
  if (h.length > 30) return { valid: false, error: 'Handle must be 30 characters or fewer.' };
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(h) && !/^[a-z0-9]$/.test(h)) {
    return { valid: false, error: 'Handle may only contain lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.' };
  }
  if (/--/.test(h)) {
    return { valid: false, error: 'Handle cannot contain consecutive hyphens.' };
  }
  // Reserved handles — covers all route paths, brand names, and abuse/system names.
  // Full policy: docs/IDENTITY_MODEL.md § "Handle and Namespace Policy"
  const reserved = new Set([
    // Route paths (every app route segment that exists or is planned)
    'admin', 'api', 'register', 'roadmap', 'reserve', 'docs', 'explore', 'platforms',
    'edit', 'verify', 'card', 'live', 'staking', 'bridge', 'guide', 'privacy', 'terms',
    'search', 'agents', 'agent', 'wallet', 'wallets', 'payments', 'pay',
    // Brand
    'reddcoin', 'redd', 'reddid', 'reddmobile', 'reddweb', 'reddrail', 'reddbridge',
    'reddlove', 'rarestake', 'rarestaketech',
    // App / role
    'support', 'team', 'official', 'me', 'settings', 'help', 'about', 'contact',
    'status', 'tip', 'creator', 'root', 'moderator', 'mod', 'bot', 'ai', 'system',
    // Abuse / system
    'null', 'undefined', 'anonymous', 'superuser',
    // Crypto confusion
    'bitcoin', 'ethereum', 'solana', 'cardano',
  ]);
  if (reserved.has(h)) {
    return { valid: false, error: 'That handle is reserved.' };
  }
  return { valid: true };
}

export function isValidUrl(url: string): boolean {
  if (!url) return true; // optional
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeHandle(handle: string): string {
  return handle.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

export type Platform = 'twitter' | 'github' | 'reddit' | 'youtube' | 'mastodon';

export function isValidPlatformUsername(platform: Platform, username: string): boolean {
  if (!username) return false;
  const u = username.replace(/^@/, '');
  switch (platform) {
    case 'twitter': return /^[a-zA-Z0-9_]{1,15}$/.test(u);
    case 'github':  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(u);
    case 'reddit':  return /^[a-zA-Z0-9_-]{3,20}$/.test(u);
    case 'youtube': return u.length > 0 && u.length <= 100;
    case 'mastodon': return u.length > 0;
    default: return false;
  }
}
