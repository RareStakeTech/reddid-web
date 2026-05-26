import type { NextRequest } from 'next/server';
import { getAbuseReports, markReportReviewed } from '@/lib/db';

/**
 * GET  /api/admin/reports          — list all abuse reports (newest first)
 * POST /api/admin/reports          — mark a report as reviewed
 *
 * Sprint 3 / S3-07 (2026-05-26)
 *
 * Authentication: Bearer token via Authorization header.
 * Token must match ADMIN_SECRET environment variable.
 *
 * This is a prototype-grade admin interface — not suitable for multi-admin
 * or high-volume deployments. Replace with a proper admin framework in v0.5.
 *
 * GET response:
 *   { reports: StoredAbuseReport[] }
 *
 * POST body:
 *   { reportId: string; note?: string }
 *
 * Errors:
 *   401 UNAUTHORIZED — missing or incorrect Authorization header
 *   400 BAD_REQUEST  — missing reportId
 *   404 NOT_FOUND    — reportId does not exist
 */

function checkAdminAuth(request: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false; // Admin routes disabled if env var not set

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return token === adminSecret;
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return Response.json(
      { error: 'Unauthorized. Set Authorization: Bearer <ADMIN_SECRET>.' },
      { status: 401 },
    );
  }

  const reports = getAbuseReports();
  return Response.json({ reports, total: reports.length });
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return Response.json(
      { error: 'Unauthorized. Set Authorization: Bearer <ADMIN_SECRET>.' },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const reportId = String(body.reportId ?? '').trim();
  const note     = body.note ? String(body.note).trim().slice(0, 500) : undefined;

  if (!reportId) {
    return Response.json({ error: 'reportId is required.' }, { status: 400 });
  }

  try {
    const updated = markReportReviewed(reportId, note);
    return Response.json({ report: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'REPORT_NOT_FOUND') {
      return Response.json({ error: `Report ${reportId} not found.` }, { status: 404 });
    }
    return Response.json({ error: 'Failed to update report.' }, { status: 500 });
  }
}
