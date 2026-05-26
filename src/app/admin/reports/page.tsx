/**
 * /admin/reports — Abuse report triage queue.
 *
 * Sprint 3 / S3-07 (2026-05-26)
 *
 * Protection: checks ?secret=<ADMIN_SECRET> query param against the
 * ADMIN_SECRET environment variable. This is a prototype-grade auth mechanism
 * only — replace with session auth or IP allowlist before any public deployment.
 *
 * Access: http://localhost:3000/admin/reports?secret=<your-admin-secret>
 * Set ADMIN_SECRET in .env.local — see docs/CREDENTIALS.md.
 */

import type { Metadata } from 'next';
import { getAbuseReports } from '@/lib/db';
import type { StoredAbuseReport } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin — Abuse Reports · ReddID',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ secret?: string }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  impersonation: '#f87171',
  spam:          '#fb923c',
  scam:          '#fbbf24',
  harassment:    '#f87171',
  misinformation:'#a78bfa',
  other:         '#94a3b8',
};

function ReportCard({ report }: { report: StoredAbuseReport }) {
  const catColor = CATEGORY_COLORS[report.category] ?? '#94a3b8';
  const age = Math.round(
    (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60),
  );
  const ageLabel = age < 60 ? `${age}m ago`
    : age < 1440 ? `${Math.round(age / 60)}h ago`
    : `${Math.round(age / 1440)}d ago`;

  return (
    <div
      style={{
        background: report.reviewed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${report.reviewed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 12,
        opacity: report.reviewed ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: catColor,
              background: `${catColor}18`,
              border: `1px solid ${catColor}40`,
              borderRadius: 4,
              padding: '1px 7px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {report.category}
          </span>
          <code style={{ fontSize: '0.8rem', color: '#e11d48', fontWeight: 700 }}>
            @{report.reportedHandle}
          </code>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{ageLabel}</span>
          {report.reviewed && (
            <span style={{ fontSize: '0.65rem', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 4, padding: '1px 7px' }}>
              ✓ reviewed
            </span>
          )}
        </div>
        <code style={{ fontSize: '0.65rem', color: '#64748b' }}>{report.id}</code>
      </div>

      <p style={{ fontSize: '0.83rem', color: '#cbd5e1', margin: '0 0 10px', lineHeight: 1.55 }}>
        {report.description}
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {report.evidenceUrl && (
          <a
            href={report.evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none' }}
          >
            Evidence ↗
          </a>
        )}
        <a
          href={`/@${report.reportedHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'none' }}
        >
          View profile ↗
        </a>
        <span style={{ fontSize: '0.7rem', color: '#475569' }}>
          Reporter hash: <code>{report.reporterIp ?? 'unknown'}</code>
        </span>
      </div>

      {report.reviewNote && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(74,222,128,0.06)', borderRadius: 6, fontSize: '0.78rem', color: '#86efac' }}>
          Note: {report.reviewNote}
        </div>
      )}
    </div>
  );
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const { secret } = await searchParams;
  const adminSecret = process.env.ADMIN_SECRET;

  // Gate: deny access if no ADMIN_SECRET configured, or secret mismatch
  const authorized = adminSecret && secret === adminSecret;

  if (!authorized) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: '1.2rem', color: '#f87171', marginBottom: 10, fontFamily: "'Rubik', sans-serif" }}>
          Admin access required
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
          Access this page with <code>?secret=&lt;ADMIN_SECRET&gt;</code> in the URL.
          <br />
          Set <code>ADMIN_SECRET</code> in your <code>.env.local</code> file.
        </p>
      </div>
    );
  }

  const reports = getAbuseReports();
  const pending  = reports.filter(r => !r.reviewed);
  const reviewed = reports.filter(r =>  r.reviewed);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: '1.4rem' }}>🚨</span>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, fontFamily: "'Rubik', sans-serif", color: '#f1f5f9' }}>
            Abuse Report Queue
          </h1>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: pending.length > 0 ? '#f87171' : '#4ade80',
            background: pending.length > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
            border: `1px solid ${pending.length > 0 ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
            borderRadius: 12,
            padding: '2px 10px',
          }}>
            {pending.length} pending
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
          Sprint 3 / S3-07 · Admin view · {reports.length} total reports
        </p>
      </div>

      {/* API hint */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '10px 16px',
        marginBottom: 28,
        fontSize: '0.78rem',
        color: '#64748b',
        fontFamily: 'monospace',
      }}>
        Mark reviewed via API: <span style={{ color: '#94a3b8' }}>
          POST /api/admin/reports {'{'}reportId, note?{'}'} with Authorization: Bearer {'<ADMIN_SECRET>'}
        </span>
      </div>

      {/* Pending reports */}
      {pending.length > 0 ? (
        <>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', marginBottom: 14, fontFamily: "'Rubik', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pending ({pending.length})
          </h2>
          {pending.map(r => <ReportCard key={r.id} report={r} />)}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#4ade80', fontSize: '0.9rem' }}>
          ✓ No pending reports
        </div>
      )}

      {/* Reviewed reports */}
      {reviewed.length > 0 && (
        <>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', marginTop: 32, marginBottom: 14, fontFamily: "'Rubik', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Reviewed ({reviewed.length})
          </h2>
          {reviewed.map(r => <ReportCard key={r.id} report={r} />)}
        </>
      )}

      {reports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontSize: '0.9rem' }}>
          No abuse reports submitted yet.
        </div>
      )}
    </div>
  );
}
