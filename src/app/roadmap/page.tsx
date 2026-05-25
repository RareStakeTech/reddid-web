import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap — ReddRails',
  description: 'Milestone-driven build plan for ReddRails: the social-payment, identity, and AI-agent infrastructure for ReddCoin.',
};

type Status = 'done' | 'active' | 'planned' | 'future';

interface Milestone {
  id: string;
  phase: string;
  title: string;
  target: string;
  status: Status;
  owner: string;
  items: string[];
  note?: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'm0',
    phase: 'Phase 0',
    title: 'Core Chain Mainnet',
    target: 'Q3 2026',
    status: 'active',
    owner: 'CryptoGnasher / Core team',
    items: [
      'ReddCoin Core 4.22.10 mainnet release',
      'Taproot and SegWit activation on mainnet',
      'HD wallet / BIP44 derivation confirmed for bridge use',
      'Full sync in minutes (4.22 performance improvements)',
      'BIP9 soft-fork signaling operational',
    ],
    note: 'Everything above Layer 0 depends on this release. Target: firm date to be published.',
  },
  {
    id: 'm1',
    phase: 'Phase 1',
    title: 'ReddID Next v0.1 — Handle Registration',
    target: 'Q3 2026',
    status: 'active',
    owner: 'ReddRails team',
    items: [
      '@handle registry (unique, format-validated, permanent)',
      'RDD wallet address linkage',
      'Public tip page at /@handle with QR code and copy button',
      'Display name, bio, website support',
      'Basic API for handle lookup',
      'Registration open to community',
    ],
    note: 'Live now as v0.1 beta. Cryptographic address-ownership proof (wallet signature verification) ships in v0.2.',
  },
  {
    id: 'm2',
    phase: 'Phase 1',
    title: 'Reserve Dashboard — Design & Explainer',
    target: 'Q3 2026',
    status: 'active',
    owner: 'ReddRails team',
    items: [
      'Public explainer of the reserve model',
      'Formula documentation: backing ratio calculation',
      'What will be auditable and how',
      'Placeholder live dashboard (activates when bridge deploys)',
      'Trust disclosure language published',
    ],
  },
  {
    id: 'm3',
    phase: 'Phase 1',
    title: 'Love Button v2 — Browser Extension',
    target: 'Q3 2026',
    status: 'active',
    owner: 'ReddRails team',
    items: [
      'Full rewrite to Manifest V3 (required for modern Chrome/Firefox)',
      'ReddID Next API integration for @handle lookup',
      'Twitter/X, Reddit, YouTube content scripts',
      'Popup: search @handle, view address, copy address',
      'Injected tip button on detected social profiles',
      'Submitted to Chrome Web Store and Firefox Add-ons',
    ],
  },
  {
    id: 'm4',
    phase: 'Phase 2',
    title: 'ReddID Next v0.2 — Social Proofs',
    target: 'Q4 2026',
    status: 'planned',
    owner: 'ReddRails team',
    items: [
      'Cryptographic address-ownership proof (wallet signature verification)',
      'Social proof linking: Twitter, GitHub, Reddit (signed message)',
      'Reverse lookup: find ReddID from social platform username',
      'Proof attestation storage (hashes, not raw data)',
      'Handle update flow (new address linking with proof)',
    ],
  },
  {
    id: 'm5',
    phase: 'Phase 2',
    title: 'Gajumaru Partnership & ReddRail Design',
    target: 'Q4 2026',
    status: 'planned',
    owner: 'TechAdept / QPQ (trusted partner)',
    items: [
      'Formal technical working agreement with QPQ',
      'ReddRail Associate Chain design finalized',
      'RDD-represented asset model confirmed',
      'State channel flow for social tipping designed',
      'Generalised Account delegation policy designed',
      'GRIDS signing integration design completed',
      'Testnet access established',
    ],
    note: 'Gajumaru is a confirmed strategic partner. Timeline dependent on QPQ Associate Chain tooling release (expected Q3/Q4 2026).',
  },
  {
    id: 'm6',
    phase: 'Phase 3',
    title: 'ReddBridge v1 — Reserve System',
    target: 'Q4 2026 – Q1 2027',
    status: 'planned',
    owner: 'ReddRails team',
    items: [
      'Native RDD reserve wallets (3-of-5 multisig, hardware wallets)',
      'Bridge indexer: RDD chain deposit monitoring',
      'Mint/burn accounting (native RDD ↔ Gajumaru representation)',
      'Reserve dashboard live (real-time backing ratio)',
      'Legal review completed before any launch',
      'Trust disclosures published',
      'Emergency pause mechanism',
      'Public reserve audit trail (all mint/burn events)',
    ],
    note: 'No bridge launches without legal review. No bridge launches without independent audit of the bridge service.',
  },
  {
    id: 'm7',
    phase: 'Phase 3',
    title: 'ReddRail v1 — Social Payment Channels',
    target: 'Q1 2027',
    status: 'planned',
    owner: 'ReddRails team + QPQ',
    items: [
      'ReddRail Associate Chain on Gajumaru testnet',
      'State channels for RDD-denominated social tips',
      'Near-real-time tip flow (sub-second channel updates)',
      'No mandatory fees within channels',
      'Creator redemption: channel balance → native RDD',
      'Integration with ReddID Next tip pages',
      'Public PoC: 3 identities, 25 tips, settlement confirmed',
    ],
  },
  {
    id: 'm8',
    phase: 'Phase 4',
    title: 'ReddID Next v0.3 — Agent Delegation',
    target: 'Q1–Q2 2027',
    status: 'future',
    owner: 'ReddRails team',
    items: [
      'Parent → child identity delegation',
      'AI agent identity type (mandatory public disclosure)',
      'Spending limits: per-transaction, daily, monthly',
      'Allowed-recipient whitelisting',
      'Instant revocation registry',
      'Agent activity log (auditable)',
      'Parent approval threshold above configurable amount',
    ],
  },
  {
    id: 'm9',
    phase: 'Phase 4',
    title: 'Creator Dashboard & Agent Console',
    target: 'Q2 2027',
    status: 'future',
    owner: 'ReddRails team',
    items: [
      'Creator: live balance, tip history, redemption initiation',
      'Creator: social proof management',
      'Agent console: create, configure, monitor, revoke agents',
      'Parent: full agent activity audit',
      'Mobile-responsive design',
    ],
  },
  {
    id: 'm10',
    phase: 'Phase 5',
    title: 'Base / x402 AI-Agent Layer',
    target: '2027+',
    status: 'future',
    owner: 'TBD',
    items: [
      'wRDD on Base (ERC-20, post-Gajumaru proof of concept)',
      'x402-compatible ReddRail endpoint for AI agent payments',
      'USDC ↔ RDD facilitation layer',
      'Creator tools on Base/Coinbase ecosystem',
      'Smart Wallet onboarding (passkey-based, frictionless)',
    ],
    note: 'Base deployment only after Gajumaru ReddRail is live and proven. No second funding token at any stage.',
  },
];

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; dot: string }> = {
  done:    { label: 'Complete',    color: '#4ade80', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  dot: '#4ade80' },
  active:  { label: 'In Progress', color: '#f0c040', bg: 'rgba(240,192,64,0.08)', border: 'rgba(240,192,64,0.3)',  dot: '#f0c040' },
  planned: { label: 'Planned',     color: '#60a5fa', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.2)',  dot: '#60a5fa' },
  future:  { label: 'Future',      color: '#888',    bg: 'rgba(136,136,136,0.05)', border: 'rgba(136,136,136,0.15)', dot: '#555' },
};

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: '0.7rem',
        fontWeight: 600,
        padding: '2px 9px',
        borderRadius: 20,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

export default function RoadmapPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}
        >
          Build Roadmap
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 580 }}>
          ReddRails is the social-payment, identity, wrapped-liquidity, and AI-agent microtransaction
          infrastructure for ReddCoin. This is a milestone-driven plan — not aspirational slides.
          Milestones update when things change.
        </p>
        <div
          style={{
            marginTop: 20,
            padding: '12px 16px',
            background: 'rgba(240,192,64,0.06)',
            border: '1px solid rgba(240,192,64,0.2)',
            borderRadius: 8,
            fontSize: '0.78rem',
            color: '#c4a030',
            lineHeight: 1.6,
          }}
        >
          <strong>Honest note:</strong> ReddCoin has moved slower than intended in previous years.
          This plan has specific milestones and real owners. We will update this page when things
          slip, not pretend they didn't. Native RDD is always the root. No second funding token. Ever.
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
        {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([status, cfg]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MILESTONES.map((m, idx) => {
          const cfg = STATUS_CONFIG[m.status];
          const isFirstOfPhase = idx === 0 || MILESTONES[idx - 1].phase !== m.phase;
          return (
            <div key={m.id}>
              {isFirstOfPhase && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                    marginTop: idx > 0 ? 24 : 0,
                    paddingLeft: 4,
                  }}
                >
                  {m.phase}
                </div>
              )}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${cfg.border}`,
                  borderLeft: `3px solid ${cfg.dot}`,
                  borderRadius: 10,
                  padding: '20px 24px',
                }}
              >
                {/* Milestone header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        marginBottom: 4,
                      }}
                    >
                      {m.title}
                    </h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        🗓 {m.target}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {m.owner}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                {/* Items */}
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {m.items.map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: cfg.dot, fontSize: '0.65rem', marginTop: 4, flexShrink: 0 }}>◆</span>
                      <span style={{ fontSize: '0.82rem', color: m.status === 'future' ? 'var(--text-dim)' : 'var(--text-muted)', lineHeight: 1.5 }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Note */}
                {m.note && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      color: 'var(--text-dim)',
                      lineHeight: 1.6,
                      borderLeft: '2px solid var(--border)',
                    }}
                  >
                    {m.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer principles */}
      <div
        style={{
          marginTop: 48,
          padding: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Non-negotiable constraints
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Native RDD is always the root asset. No migration away from the native chain.',
            'No second speculative funding token. Not now, not later.',
            'No ICO framing. No investment promises. No "number go up" marketing.',
            'Any bridge is clearly disclosed as custodial until it is cryptographically trustless.',
            'Transparency over speed on trust assumptions.',
            'Gajumaru is a trusted partner — their stated capabilities are assumed, timed to their releases.',
            'BSC/wRDD is infrastructure plumbing, not the product story.',
            'Identity must support accountable pseudonymity, not surveillance.',
            'AI agents must be explicitly identified, disclosed, limited, and revocable.',
          ].map((principle, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--redd-red)', fontSize: '0.7rem', marginTop: 3, flexShrink: 0 }}>●</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{principle}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
