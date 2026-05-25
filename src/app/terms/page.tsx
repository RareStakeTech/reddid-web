import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use — ReddID',
  description: 'Terms governing your use of ReddID and the ReddID Love Button browser extension.',
};

const SECTION: React.CSSProperties = {
  marginBottom: 36,
};

const H2: React.CSSProperties = {
  fontFamily: "'Rubik', sans-serif",
  fontWeight: 700,
  fontSize: '1.1rem',
  color: 'var(--text-primary)',
  marginBottom: 12,
  letterSpacing: '-0.01em',
};

const P: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '0.9rem',
  lineHeight: 1.75,
  marginBottom: 10,
};

const UL: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '0.9rem',
  lineHeight: 1.75,
  paddingLeft: 20,
  marginBottom: 10,
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 20px 72px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ color: 'var(--redd-red-light)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          Legal
        </p>
        <h1
          style={{
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 700,
            fontSize: '2rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}
        >
          Terms of Use
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
          Effective date: 25 May 2026 · Operator: Rare Stake Technology LLC
        </p>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '36px 40px',
        }}
      >

        {/* 1 */}
        <div style={SECTION}>
          <h2 style={H2}>1. Acceptance</h2>
          <p style={P}>
            By registering a handle on ReddID, using the ReddID website (redd.love), or
            installing the ReddID Love Button browser extension, you agree to these Terms of Use.
            If you do not agree, do not use the service.
          </p>
        </div>

        {/* 2 */}
        <div style={SECTION}>
          <h2 style={H2}>2. What ReddID provides</h2>
          <p style={P}>
            ReddID is a non-custodial social identity registry. We provide:
          </p>
          <ul style={UL}>
            <li>A directory that maps @handles to public RDD wallet addresses</li>
            <li>Public tip pages at <code style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'var(--redd-red-light)' }}>redd.love/@handle</code></li>
            <li>A browser extension that surfaces tip buttons on supported social platforms</li>
            <li>A social proof system that lets creators link their social accounts</li>
          </ul>
          <p style={P}>
            ReddID does <strong style={{ color: 'var(--text-primary)' }}>not</strong> hold, transmit, or control any cryptocurrency.
            All RDD transfers happen directly between wallets on the ReddCoin blockchain.
            We have no ability to reverse, cancel, or intervene in any on-chain transaction.
          </p>
        </div>

        {/* 3 */}
        <div style={SECTION}>
          <h2 style={H2}>3. Handle registration</h2>
          <p style={P}>
            Handles are allocated on a first-come, first-served basis. By registering a handle you represent that:
          </p>
          <ul style={UL}>
            <li>You are at least 13 years of age</li>
            <li>The handle does not impersonate another person, project, or brand</li>
            <li>The RDD address you register belongs to a wallet you control</li>
            <li>The information you submit is truthful to the best of your knowledge</li>
          </ul>
          <p style={P}>
            Handle registration is permanent in v0.1 beta. Handles may not be transferred to other parties.
            We reserve the right to revoke handles used for impersonation, scams, or abuse.
          </p>
        </div>

        {/* 4 */}
        <div style={SECTION}>
          <h2 style={H2}>4. Social proof and verification</h2>
          <p style={P}>
            The social proof system is provided as a convenience for creators who wish to demonstrate
            their social presence. Completing the challenge-post flow records that you declared a
            proof at a given platform. It does not constitute independent verification by ReddID,
            and it does not constitute an endorsement.
          </p>
          <p style={P}>
            You must not submit social proof claims for accounts you do not control.
          </p>
        </div>

        {/* 5 */}
        <div style={SECTION}>
          <h2 style={H2}>5. Acceptable use</h2>
          <p style={P}>You agree not to use ReddID to:</p>
          <ul style={UL}>
            <li>Impersonate any person, project, company, or government entity</li>
            <li>Solicit payments for fraudulent purposes</li>
            <li>Register handles in bulk for squatting or resale</li>
            <li>Scrape or harvest identity data for commercial purposes without permission</li>
            <li>Attempt to circumvent rate limits, abuse protection, or security controls</li>
            <li>Transmit malicious content via any field (bio, handle, social username, etc.)</li>
          </ul>
        </div>

        {/* 6 */}
        <div style={SECTION}>
          <h2 style={H2}>6. Beta disclaimer</h2>
          <p style={P}>
            ReddID is currently in <strong style={{ color: 'var(--text-primary)' }}>v0.3 public beta</strong>. The service is provided as-is,
            without warranty of any kind. Data persistence, uptime, and API stability are not
            guaranteed during the beta period. We may modify or discontinue features without notice.
          </p>
          <p style={P}>
            Cryptographic address ownership verification (wallet signature) is not yet implemented.
            The RDD address you submit is trusted on a self-reported basis until v0.5.
          </p>
        </div>

        {/* 7 */}
        <div style={SECTION}>
          <h2 style={H2}>7. Limitation of liability</h2>
          <p style={P}>
            To the maximum extent permitted by applicable law, Rare Stake Technology LLC and its
            operators shall not be liable for any direct, indirect, incidental, or consequential
            damages arising from your use of ReddID, including but not limited to loss of
            cryptocurrency, loss of data, or inability to receive tips.
          </p>
          <p style={P}>
            ReddID is a directory service only. We are not a money transmitter, custodian,
            wallet provider, or financial institution. No tips or payments flow through our servers.
          </p>
        </div>

        {/* 8 */}
        <div style={SECTION}>
          <h2 style={H2}>8. Intellectual property</h2>
          <p style={P}>
            The ReddID codebase is open source (MIT license). The ReddCoin name and logo are
            property of the ReddCoin project. Rare Stake Technology LLC operates ReddID under
            license from and in support of the ReddCoin project.
          </p>
        </div>

        {/* 9 */}
        <div style={SECTION}>
          <h2 style={H2}>9. Governing law</h2>
          <p style={P}>
            These terms are governed by the laws of the state of incorporation of Rare Stake
            Technology LLC, without regard to conflict of law principles. Any disputes shall be
            resolved through binding arbitration or in courts of competent jurisdiction.
          </p>
        </div>

        {/* 10 */}
        <div style={{ ...SECTION, marginBottom: 0 }}>
          <h2 style={H2}>10. Contact</h2>
          <p style={{ ...P, marginBottom: 0 }}>
            Questions about these terms?{' '}
            <a
              href="mailto:rarestaketech@gmail.com"
              style={{ color: 'var(--redd-red-light)', textDecoration: 'none' }}
            >
              rarestaketech@gmail.com
            </a>
          </p>
        </div>
      </div>

      {/* Footer links */}
      <div style={{ display: 'flex', gap: 20, marginTop: 28, justifyContent: 'center' }}>
        <a href="/privacy" style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textDecoration: 'none' }}>
          Privacy Policy
        </a>
        <span style={{ color: 'var(--border)' }}>·</span>
        <a href="/" style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textDecoration: 'none' }}>
          Back to ReddID
        </a>
      </div>
    </div>
  );
}
