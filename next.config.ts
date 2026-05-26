import type { NextConfig } from "next";

// ── HTTPS redirect target ─────────────────────────────────────────────────────
// Derived from the canonical base URL env var so staging deploys redirect
// to the correct hostname rather than hardcoded redd.love.
const BASE_URL = process.env.NEXT_PUBLIC_REDDID_BASE_URL ?? 'https://redd.love';
const hostname = (() => {
  try {
    return new URL(BASE_URL).hostname; // 'redd.love'
  } catch {
    return 'redd.love'; // fallback if env var is malformed
  }
})();

// ── Content Security Policy ───────────────────────────────────────────────────
// External origins that need allowlisting:
//   fonts.googleapis.com / fonts.gstatic.com — Google Fonts (CSS + font files)
//   blockbook.reddcoin.com — Blockbook v2 API (LiveBalance widget, RecentTips)
//   api.coingecko.com      — CoinGecko price ticker (MarketTicker widget)
//
// NOTE: 'unsafe-inline' on script-src is required by Next.js App Router — the
// framework injects inline hydration scripts that cannot be nonce-attributed
// at the next.config.ts header level. 'unsafe-eval' supports HMR in dev.
// Hardening path: implement nonce-based CSP via Next.js middleware in v0.5.
// See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Next.js requires unsafe-inline; unsafe-eval needed for dev HMR
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Next.js uses inline styles; Google Fonts CSS loaded from googleapis.com
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Google Fonts files loaded from gstatic.com
  "font-src 'self' https://fonts.gstatic.com",
  // QR codes are rendered as data: URIs (canvas/SVG); no external images used
  "img-src 'self' data:",
  // Fetch targets: Blockbook API (balance/txns) + CoinGecko (price ticker)
  "connect-src 'self' https://blockbook.reddcoin.com https://api.coingecko.com",
  // No iframes, no Flash/Java objects, no base-tag injection, only self-posted forms
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// ── Security headers ──────────────────────────────────────────────────────────
const SECURITY_HEADERS = [
  // HTTPS only — 2 years, include subdomains, eligible for preload list
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Clickjacking protection — no iframes allowed
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send full referrer to same origin; only the origin to cross-origin requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not used by this app
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Content Security Policy (constructed above)
  { key: 'Content-Security-Policy', value: CSP_DIRECTIVES },
];

// ── Next.js config ────────────────────────────────────────────────────────────
const nextConfig: NextConfig = {
  /**
   * Security headers applied to every response.
   * The source pattern '/(.*)'  covers all routes including the root.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ];
  },

  /**
   * HTTPS enforcement redirect.
   *
   * Fires only when a proxy (Railway load balancer, nginx, etc.) sets the
   * x-forwarded-proto: http header, which signals the original request was
   * plain HTTP. In production on Railway, all HTTPS termination happens at
   * the load balancer before Node.js, so this is a belt-and-suspenders guard
   * for direct HTTP access to the raw service URL.
   *
   * Redirects to the same path on the canonical hostname (derived from
   * NEXT_PUBLIC_REDDID_BASE_URL so staging deploys stay on their own domain).
   */
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: `https://${hostname}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
