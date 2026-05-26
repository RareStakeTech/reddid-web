/**
 * GET /api/badge/[handle]
 *
 * Returns a shields.io-style SVG badge for embedding in READMEs and websites.
 *
 * Canonical embed Markdown:
 *   [![Tip me Ɍ RDD](https://redd.love/api/badge/yourhandle)](https://redd.love/@yourhandle)
 *
 * - Handle not found → 404 JSON
 * - Valid handle → SVG with brand colors + handle text
 *
 * Sprint 2 / S2-02.
 */

import type { NextRequest } from 'next/server';
import { getIdentityByHandle } from '@/lib/db';
import { sanitizeHandle } from '@/lib/validation';

const BADGE_HEIGHT   = 20;
const LABEL          = 'Tip';
const LABEL_WIDTH    = 30;
const VALUE_PADDING  = 10;

/** Approximate text width at the badge font size (Verdana 11px). */
function approxTextWidth(text: string): number {
  return Math.ceil(text.length * 6.5 + VALUE_PADDING * 2);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ handle: string }> }
) {
  const { handle } = await ctx.params;
  const clean = sanitizeHandle(handle);

  const identity = getIdentityByHandle(clean);
  if (!identity) {
    return Response.json({ error: `@${clean} not found.` }, { status: 404 });
  }

  const valueText   = `@${identity.handle} · Ɍ RDD`;
  const valueWidth  = approxTextWidth(valueText);
  const totalWidth  = LABEL_WIDTH + valueWidth;

  // Verified badge if any social proof is verified
  const hasVerified = identity.socialProofs.some(p => p.verificationStatus === 'verified');
  const labelBg     = '#555';
  const valueBg     = '#E30613'; // ReddCoin brand red

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${totalWidth}" height="${BADGE_HEIGHT}" role="img" aria-label="${valueText}">
  <title>${valueText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${BADGE_HEIGHT}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${LABEL_WIDTH}" height="${BADGE_HEIGHT}" fill="${labelBg}"/>
    <rect x="${LABEL_WIDTH}" width="${valueWidth}" height="${BADGE_HEIGHT}" fill="${valueBg}"/>
    <rect width="${totalWidth}" height="${BADGE_HEIGHT}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11" font-weight="bold">
    <text x="${LABEL_WIDTH / 2}" y="15" fill="#010101" fill-opacity=".3">${LABEL}</text>
    <text x="${LABEL_WIDTH / 2}" y="14">${LABEL}</text>
    <text x="${LABEL_WIDTH + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".25">${valueText}</text>
    <text x="${LABEL_WIDTH + valueWidth / 2}" y="14">${valueText}</text>
  </g>
  ${hasVerified ? `<g><!-- verified --><circle cx="${totalWidth - 6}" cy="6" r="4" fill="#4ade80" stroke="#fff" stroke-width="1"/></g>` : ''}
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}
