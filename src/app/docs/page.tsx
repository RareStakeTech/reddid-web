import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Architecture — ReddRails Technical Design',
  description: 'Public technical architecture for ReddRails: the social-payment, identity, and microtransaction infrastructure for ReddCoin.',
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 48 }}>
      <h2
        style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: '1px solid var(--border)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.8, marginBottom: 12 }}>{children}</p>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: '#0d0d0d',
                  color: 'var(--text-dim)',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  border: '1px solid var(--border)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : '#0e0e0e' }}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: '8px 12px',
                    color: j === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: j === 0 ? 600 : 400,
                    border: '1px solid var(--border)',
                    verticalAlign: 'top',
                    lineHeight: 1.5,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      style={{
        background: '#0a0a0a',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '16px 18px',
        overflowX: 'auto',
        fontSize: '0.78rem',
        color: '#a0c8a0',
        lineHeight: 1.6,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        marginBottom: 16,
      }}
    >
      {children}
    </pre>
  );
}

function Tag({ label, color = '#555' }: { label: string; color?: string }) {
  return (
    <span
      style={{
        background: `${color}18`,
        border: `1px solid ${color}44`,
        color,
        fontSize: '0.65rem',
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: 10,
        letterSpacing: '0.05em',
        marginLeft: 6,
      }}
    >
      {label}
    </span>
  );
}

const TOC = [
  { id: 'overview',     label: 'Overview' },
  { id: 'layers',       label: 'System Layers' },
  { id: 'reddid',       label: 'ReddID Next' },
  { id: 'reddbridge',   label: 'ReddBridge' },
  { id: 'reddrail',     label: 'ReddRail + Gajumaru' },
  { id: 'agents',       label: 'AI Agent Model' },
  { id: 'security',     label: 'Security Model' },
  { id: 'assumptions',  label: 'Assumptions & Unknowns' },
  { id: 'glossary',     label: 'Glossary' },
];

export default function DocsPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px', display: 'flex', gap: 40, alignItems: 'flex-start' }}>

      {/* Sidebar TOC — hidden on small screens via inline media query workaround */}
      <aside
        style={{
          width: 200,
          flexShrink: 0,
          position: 'sticky',
          top: 72,
          alignSelf: 'flex-start',
        }}
        className="docs-sidebar"
      >
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Contents
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TOC.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '0.78rem',
                padding: '5px 8px',
                borderRadius: 5,
                borderLeft: '2px solid transparent',
                transition: 'all 0.1s',
              }}
            >
              {label}
            </a>
          ))}
        </div>
        <style>{`
          @media (max-width: 700px) { .docs-sidebar { display: none; } }
        `}</style>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Technical Architecture
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 10 }}>
              v0.1 · public
            </span>
          </div>
          <P>
            ReddRails is the social-payment, identity, wrapped-liquidity, and AI-agent
            microtransaction system being built on top of ReddCoin (RDD). This document is the
            public-facing architectural overview. It is honest about what is confirmed, what is
            planned, and what depends on external partners.
          </P>
          <P>
            <Strong>Core principle:</Strong> native RDD is always the root asset. Every other
            layer represents, routes, or extends RDD — it does not replace it.
          </P>
        </div>

        {/* Overview */}
        <Section id="overview" title="Overview">
          <P>
            ReddCoin (RDD) was built for social payments: tipping, creator rewards, micro-rewards,
            and small-value human-scale value transfer. The problem it has always faced is that
            social interaction happens faster and at smaller scale than UTXO blockchain settlement
            was designed to serve.
          </P>
          <P>
            ReddRails addresses this with a layered architecture: the native chain stays unchanged,
            a transparent reserve bridge enables RDD to be represented elsewhere, and a high-throughput
            social-payment rail (powered by Gajumaru infrastructure) enables near-real-time tips
            at near-zero cost.
          </P>
        </Section>

        {/* System Layers */}
        <Section id="layers" title="System Layers">
          <CodeBlock>{`┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: Applications                                      │
│  Tip links · Creator pages · Agent console · Browser ext.  │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: Identity & Policy — ReddID Next                   │
│  @handle registry · Wallet links · Social proofs            │
│  Delegation · Agent permissioning · Revocation              │
│  ← BUILD NOW. Independent of chain decisions. →            │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: ReddRail (Gajumaru Associate Chain)               │
│  State channels · Generalised Accounts · GRIDS signing      │
│  ← DESIGN NOW. Integrate when QPQ releases tooling. →      │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: ReddBridge (Native ↔ Gajumaru)                   │
│  Reserve wallets · Mint/burn accounting · Dashboard         │
│  ← DESIGN + DASHBOARD NOW. Full deploy with Layer 2. →     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 0: Native RDD                                        │
│  ReddCoin Core (PoSV) · UTXO chain · Staking               │
│  ← FINISH 4.22.10 MAINNET FIRST. →                        │
└─────────────────────────────────────────────────────────────┘`}</CodeBlock>
          <Table
            headers={['Layer', 'Component', 'Status', 'Dependency']}
            rows={[
              ['0', 'Native RDD / ReddCoin Core', 'Active (4.22.x beta)', 'None'],
              ['1', 'ReddBridge reserve accounting', 'Design phase', 'Layer 0 mainnet'],
              ['1', 'Reserve dashboard', 'In development', 'None (launches as explainer)'],
              ['2', 'ReddRail / Gajumaru Associate Chain', 'Design phase', 'QPQ Associate Chain release'],
              ['2', 'State channels (social tipping)', 'Planned', 'ReddRail deployment'],
              ['2', 'Generalised Accounts (agent policy)', 'Planned', 'ReddRail deployment'],
              ['3', 'ReddID Next — handle registry', 'v0.1 live (beta)', 'None'],
              ['3', 'Delegation registry', 'Planned v0.3', 'ReddID v0.2'],
              ['4', 'Social tipping UI / Love Button', 'In development', 'ReddID v0.1'],
              ['4', 'Creator dashboard', 'Planned', 'ReddRail v1'],
            ]}
          />
        </Section>

        {/* ReddID Next */}
        <Section id="reddid" title="ReddID Next">
          <P>
            ReddID Next is the identity layer. It maps human-readable <Strong>@handles</Strong> to
            RDD wallet addresses and, in later versions, supports social proofs, parent-child
            delegation, and AI agent permissioning.
          </P>
          <P>
            <Strong>v0.1 (live):</Strong> @handle registration, RDD address linkage, public tip page.
            Format validation only — cryptographic address-ownership proof ships in v0.2.
          </P>
          <P>
            <Strong>v0.2 (planned Q4 2026):</Strong> Wallet signature verification, social proofs
            (Twitter, GitHub, Reddit), reverse lookup from platform username.
          </P>
          <P>
            <Strong>v0.3 (planned Q1-Q2 2027):</Strong> Parent-child delegation, AI agent
            identity type, spending limits, revocation registry.
          </P>
          <CodeBlock>{`Identity record (v0.1):
{
  handle:       "@techadept"       // unique, permanent
  displayName:  "TechAdept"        // optional
  rddAddress:   "Rxxxxxxxxxx..."   // mainnet P2PKH, 34 chars
  bio:          "..."              // 160 chars max
  website:      "https://..."      // optional
  socialProofs: []                 // v0.2
  createdAt:    "2026-05-25T..."
}

Child agent record (v0.3):
{
  handle:     "@techadept.tip-agent"
  type:       "ai-agent"           // mandatory disclosure
  parent:     "@techadept"
  purpose:    "Tip helpful community members"
  limits: {
    perTx:    10,    // RDD
    daily:    100,
    monthly:  500
  }
  revocationKey: "0x..."           // parent can revoke instantly
}`}</CodeBlock>
        </Section>

        {/* ReddBridge */}
        <Section id="reddbridge" title="ReddBridge">
          <P>
            ReddBridge is the reserve, accounting, and redemption system. It is <Strong>not trustless</Strong> in
            its initial form — it is a transparent, custodial reserve with public auditability.
          </P>
          <P>
            Native RDD is locked in a 3-of-5 multisig reserve wallet. Represented RDD is issued
            on the Gajumaru Associate Chain (and potentially Base later). The backing ratio must
            remain ≥ 1.00 at all times. See the <Link href="/reserve" style={{ color: 'var(--redd-red)' }}>Reserve page</Link> for the full formula.
          </P>
          <Table
            headers={['Property', 'Value']}
            rows={[
              ['Reserve custody', '3-of-5 multisig, hardware wallets required'],
              ['Confirmation count', '10+ confirmations before minting (~10 min)'],
              ['Decimal alignment', '8 decimals — matches native RDD'],
              ['Initial cap', 'TBD — requires legal review before launch'],
              ['Emergency pause', 'Any 2-of-5 can pause; 3-of-5 to resume'],
              ['Redemption SLA', 'Within 4 hours under normal conditions'],
              ['Audit trail', 'Every mint/burn event logged publicly with tx hashes'],
            ]}
          />
          <P>
            <Strong>What is NOT claimed:</Strong> trustlessness, guaranteed uptime,
            insurance, or instant redemption. All claims are bounded by what is technically true.
          </P>
        </Section>

        {/* ReddRail + Gajumaru */}
        <Section id="reddrail" title="ReddRail + Gajumaru">
          <P>
            ReddRail is the high-throughput social-payment channel layer. Its architecture
            is built on <Strong>Gajumaru</Strong> infrastructure by <Strong>QPQ AG</Strong> —
            a trusted strategic partner. Capabilities described below reflect QPQ's stated
            architecture; timeline depends on their Associate Chain tooling release.
          </P>
          <Table
            headers={['Gajumaru Component', 'Role in ReddRail', 'Status']}
            rows={[
              ['Groot (base chain)', 'Settlement and finality layer', 'Live (Oct 2024)'],
              ['Associate Chain', 'Sovereign ReddRail chain for RDD representation', 'Launching 2026 (LTIN first)'],
              ['State Channels', '43B tx/day/node, no mandatory fees, 1-to-1 off-chain', 'Confirmed capability'],
              ['Generalised Accounts', 'Policy-based delegation, spending limits, revocation', 'Confirmed capability'],
              ['GRIDS signing', 'Air-gapped payment authorization for users and agents', 'Level 1 operational'],
              ['GajuPay / GajuMobile', 'Payment and mobile tooling', 'Launching 2026'],
            ]}
          />
          <P>
            The ReddRail PoC target: one user, one creator, one delegated AI agent. Many tiny
            near-real-time tips. Spending limits enforced. Revocation working in &lt;5 seconds.
            Reserve ratio stable. All in public with a live dashboard.
          </P>
          <CodeBlock>{`Value flow:
Native RDD → [10+ confirmations] → ReddBridge →
  → RDD represented on Gajumaru Associate Chain →
    → State channels (instant, zero-fee tips) →
      → Channel settlement → Associate Chain balance →
        → Burn → ReddBridge → Release native RDD`}</CodeBlock>
        </Section>

        {/* AI Agent Model */}
        <Section id="agents" title="AI Agent Model">
          <P>
            AI agents using ReddRail are a first-class identity type. Every agent must be:
            explicitly declared as automated, linked to a parent human identity, limited in scope
            and spending, and revocable instantly by the parent.
          </P>
          <P>
            <Strong>No agent may:</Strong> operate without disclosing it is automated, exceed
            its declared spending limits, send to recipients outside its allowed class, or
            continue operating after revocation.
          </P>
          <CodeBlock>{`@techadept (parent)
  └── @techadept.tip-agent
        type:        ai-agent
        purpose:     "Tip helpful Discord members"
        perTx:       5 RDD
        daily:       50 RDD
        monthly:     200 RDD
        recipients:  reddid_verified only
        disclosure:  redd.love/agents/tip-agent
        revoke:      parent signs revocation → effective immediately`}</CodeBlock>
        </Section>

        {/* Security */}
        <Section id="security" title="Security Model">
          <Table
            headers={['Attack', 'Mitigation']}
            rows={[
              ['Reserve wallet compromise', '3-of-5 hardware-wallet multisig, geographic key distribution, no single operator can drain'],
              ['Bridge minting exploit', 'Multisig-only mint authority, mint cap, per-day rate limit, pause on anomaly'],
              ['Smart contract bug', 'Audit before deploy, non-upgradeable v1, OpenZeppelin base'],
              ['Identity spoofing', 'Unique handle enforcement, v0.2 wallet signature proof'],
              ['Agent key compromise', 'Per-tx caps limit damage, parent revocation is instant, small balance caps on agents'],
              ['State channel fraud', 'Dispute window enforced on-chain, watchtower service, checkpoint logging'],
              ['Dashboard mismatch', 'Dashboard computed from blockchain directly, not internal DB; public verification guide'],
              ['Insider risk', 'Multisig prevents single-actor action, all operations logged and public'],
              ['Reorg exploit', '10+ confirmation requirement before any mint'],
              ['Phishing via payment requests', 'GRIDS shows explicit amount/recipient before signing; warnings for unknown recipients'],
            ]}
          />
        </Section>

        {/* Assumptions */}
        <Section id="assumptions" title="Assumptions & Unknowns">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Confirmed <Tag label="HIGH CONFIDENCE" color="#4ade80" />
            </div>
            {[
              'Gajumaru Groot mainnet is live (since October 2024)',
              'State channels support 43B tx/day/node with no mandatory fees',
              'Gajumaru testnet is accessible (groot.testnet.gajumaru.io)',
              'LTIN will be the first Associate Chain (Q3/Q4 2026)',
              'Gajumaru is a trusted strategic partner committed to the stated roadmap',
              'ReddCoin Core 4.22 includes Taproot, SegWit, and BIP9 — enabling bridge infrastructure',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', padding: '4px 0', alignItems: 'flex-start' }}>
                <span style={{ color: '#4ade80' }}>✓</span>{item}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Pending Confirmation <Tag label="TIMING DEPENDENT" color="#f0c040" />
            </div>
            {[
              'Associate Chain custom asset support (non-GAJU denomination) — awaiting QPQ confirmation',
              'State channel support for RDD-denominated balances — awaiting QPQ confirmation',
              'External Associate Chain deployment cost and process — awaiting QPQ',
              'GRIDS third-party integration API — awaiting QPQ',
              'Generalised Account policy parameterization for RDD-denominated limits — awaiting QPQ',
              'ReddCoin Core 4.22.10 mainnet release date — coordinate with CryptoGnasher',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', padding: '4px 0', alignItems: 'flex-start' }}>
                <span style={{ color: '#f0c040' }}>◌</span>{item}
              </div>
            ))}
          </div>
        </Section>

        {/* Glossary */}
        <Section id="glossary" title="Glossary">
          <Table
            headers={['Term', 'Definition']}
            rows={[
              ['RDD', 'Native ReddCoin — the original UTXO blockchain asset (2014)'],
              ['wRDD', 'Wrapped RDD — an EVM token representing native RDD in reserve (future, not primary focus)'],
              ['rRDD', 'Internal shorthand for RDD-represented asset on Gajumaru (avoid public use)'],
              ['ReddBridge', 'Reserve, mint/burn, and redemption system for native ↔ represented RDD'],
              ['ReddID Next', 'Identity layer: @handles, wallet links, delegation, agent permissioning'],
              ['ReddRail', 'High-throughput social-payment channel layer — powered by Gajumaru'],
              ['Groot', 'Gajumaru proof-of-work base chain; operational since October 2024'],
              ['GAJU', 'Native currency of Gajumaru; used for resource-layer fees'],
              ['Associate Chain', 'Sovereign chain connected to Groot; ReddRail will run on one'],
              ['State Channel', 'Off-chain 1-to-1 payment session; many tx without base-layer cost'],
              ['GRIDS', 'Gajumaru air-gapped signing system; keys never touch connected devices'],
              ['Generalised Accounts', 'Gajumaru policy-based account model; supports delegation and limits'],
              ['Backing Ratio', '(Reserve − Pending Redemptions) / Total Represented. Must be ≥ 1.00'],
              ['PoSV', 'Proof-of-Stake-Velocity — ReddCoin\'s consensus mechanism'],
              ['Accountable pseudonymity', 'Identity where participants are pseudonymous but actions are attributable'],
              ['x402', 'HTTP 402 Payment Required protocol for AI agent payments (Base/USDC-centric)'],
            ]}
          />
        </Section>

        {/* Footer nav */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <Link href="/reserve" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem', padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>→ Reserve Model</Link>
          <Link href="/roadmap" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem', padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>→ Roadmap</Link>
          <Link href="/register" style={{ color: 'var(--redd-red)', textDecoration: 'none', fontSize: '0.82rem', padding: '8px 14px', background: 'rgba(204,17,17,0.08)', border: '1px solid rgba(204,17,17,0.2)', borderRadius: 6 }}>→ Register @handle</Link>
        </div>
      </div>
    </div>
  );
}
