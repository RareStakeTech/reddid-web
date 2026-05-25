import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getIdentityByHandle } from '@/lib/db';
import { sanitizeHandle, isValidUrl } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { AbuseReportCategory } from '@/lib/types';

/**
 * POST /api/report
 * Body: { reportedHandle, category, description, evidenceUrl? }
 *
 * Submits an abuse report. Reports are logged server-side.
 *
 * v0.4: Reports are logged to console only. No persistence yet.
 * v0.5: Persist to db.json abuseReports[] or a dedicated reports service.
 *
 * Rate limit: 5 per IP per hour to prevent report spam.
 * IP is hashed with SHA-256 before any logging — raw IPs are never stored.
 */

const VALID_CATEGORIES: AbuseReportCategory[] = [
  'impersonation', 'spam', 'scam', 'harassment', 'misinformation', 'other',
];

export async function POST(request: NextRequest) {
  // Rate limit first — before reading body
  const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = checkRateLimit(rawIp, 'report', RATE_LIMITS.report);
  if (!rl.ok) {
    return Response.json(
      { error: 'Too many reports submitted. Please wait before submitting again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const reportedHandle = sanitizeHandle(String(body.reportedHandle ?? ''));
  const category       = String(body.category    ?? '').trim() as AbuseReportCategory;
  const description    = String(body.description ?? '').trim().slice(0, 500);
  const evidenceUrl    = body.evidenceUrl ? String(body.evidenceUrl).trim() : null;

  if (!reportedHandle) return Response.json({ error: 'reportedHandle is required.' }, { status: 400 });
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return Response.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 422 },
    );
  }
  if (!description) return Response.json({ error: 'description is required.' }, { status: 400 });
  if (evidenceUrl && !isValidUrl(evidenceUrl)) {
    return Response.json({ error: 'evidenceUrl must be a valid https:// URL.' }, { status: 422 });
  }

  // Verify the reported handle exists
  const target = getIdentityByHandle(reportedHandle);
  if (!target) {
    return Response.json({ error: `@${reportedHandle} not found.` }, { status: 404 });
  }

  // Hash IP for privacy — never store raw IP
  const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex').slice(0, 16);

  const report = {
    id: crypto.randomBytes(6).toString('hex'),
    reportedHandle,
    reporterIpHash: ipHash,
    category,
    description,
    evidenceUrl,
    createdAt: new Date().toISOString(),
  };

  // v0.4: log to server console. v0.5: persist to db.json abuseReports[].
  console.log('[AbuseReport]', JSON.stringify(report));

  return Response.json({ ok: true, reportId: report.id }, { status: 201 });
}
