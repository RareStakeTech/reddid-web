import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — ReddID',
  description: 'What ReddID collects, what it does not, and how your data is handled.',
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

export default function PrivacyPage() {
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
          Privacy Policy
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
          <h2 style={H2}>1. What ReddID is</h2>
          <p style={P}>
            ReddID is a social identity registry for ReddCoin (Ɍ RDD). It lets creators register
            a public @handle, link their native RDD wallet address, and receive tips from
            anyone on the web — with no intermediary, no custodianship, and no private key
            ever touching our servers.
          </p>
          <p style={P}>
            The ReddID browser extension ("Love Button") integrates with 13 social platforms to surface
            tip buttons next to creator profiles. The extension communicates only with the
            configured ReddID API endpoint and Blockbook block explorer.
          </p>
        </div>

        {/* 2 */}
        <div style={SECTION}>
          <h2 style={H2}>2. Information you provide at registration</h2>
          <p style={P}>When you register a handle, you submit:</p>
          <ul style={UL}>
            <li>Your chosen <strong style={{ color: 'var(--text-primary)' }}>@handle</strong> (permanent, public)</li>
            <li>A <strong style={{ color: 'var(--text-primary)' }}>native RDD wallet address</strong> — a public blockchain address, not a private key</li>
            <li>Optional: display name, bio (max 160 chars), website URL</li>
            <li>Optional: social account links (platform + username) used to prove identity</li>
          </ul>
          <p style={P}>
            All of this data is <strong style={{ color: 'var(--text-primary)' }}>public by design</strong> — the purpose of ReddID is to make your RDD wallet
            discoverable by people who want to tip you. Do not register with information you
            wish to keep private.
          </p>
        </div>

        {/* 3 */}
        <div style={SECTION}>
          <h2 style={H2}>3. What we do NOT collect</h2>
          <ul style={UL}>
            <li>Private keys, seed phrases, or wallet credentials of any kind</li>
            <li>Passwords (ReddID uses token-based edit access, not passwords)</li>
            <li>Payment card numbers or banking information</li>
            <li>Government ID, full legal name, or date of birth</li>
            <li>Analytics, telemetry, or third-party tracking scripts</li>
            <li>Browser fingerprints, device identifiers, or advertising IDs</li>
            <li>Email addresses (unless you contact us directly)</li>
          </ul>
        </div>

        {/* 4 */}
        <div style={SECTION}>
          <h2 style={H2}>4. Server logs and IP addresses</h2>
          <p style={P}>
            Like all web servers, our hosting infrastructure records standard HTTP access logs
            including IP addresses, request paths, timestamps, and user-agent strings. These
            logs are retained for up to 30 days for abuse detection and are not shared with
            third parties.
          </p>
          <p style={P}>
            If an abuse report is filed, the reporter's IP is hashed (SHA-256) before storage.
            Raw IPs from abuse reports are never retained beyond the hashing step.
          </p>
        </div>

        {/* 5 */}
        <div style={SECTION}>
          <h2 style={H2}>5. Social proof and verification</h2>
          <p style={P}>
            When you link a social account, you provide a platform name and username.
            If you complete the challenge-post flow, we record that you submitted a code —
            we do not independently fetch your social profile or verify the proof URL in
            real time (platform API verification is planned for a future release).
          </p>
          <p style={P}>
            Social links marked as "Proof URL on record" indicate that you declared a URL
            during the challenge flow. They do not indicate independent verification by ReddID.
          </p>
        </div>

        {/* 6 */}
        <div style={SECTION}>
          <h2 style={H2}>6. Third-party services the extension contacts</h2>
          <p style={P}>The Love Button browser extension makes network requests only to:</p>
          <ul style={UL}>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>redd.love</strong> (default) — the ReddID identity API. Queries contain
              only the @handle or platform+username being looked up.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>blockbook.reddcoin.com</strong> (default) — the ReddCoin block explorer.
              Queries contain only the RDD wallet address displayed in the popup.
            </li>
          </ul>
          <p style={P}>
            Both endpoints are configurable in the extension's settings. No data is sent to
            any other third party. The extension contains no analytics, no ad networks, and
            no tracking pixels.
          </p>
        </div>

        {/* 7 */}
        <div style={SECTION}>
          <h2 style={H2}>7. Browser extension local storage</h2>
          <p style={P}>
            The extension stores the following data in <code style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'var(--redd-red-light)' }}>chrome.storage.local</code> on your device only:
          </p>
          <ul style={UL}>
            <li>Cached identity lookups — expire after 5 minutes, keyed by handle or social username</li>
            <li>Your last 20 popup lookups (local history)</li>
            <li>Custom API base URL and block explorer URL (if you changed the defaults)</li>
          </ul>
          <p style={P}>
            This data never leaves your device and is cleared when you use the "Clear cache"
            button in Settings or uninstall the extension.
          </p>
        </div>

        {/* 8 */}
        <div style={SECTION}>
          <h2 style={H2}>8. Data deletion and handle revocation</h2>
          <p style={P}>
            ReddID does not yet offer self-service account deletion through the web interface.
            To request removal of your handle and associated data, contact us at{' '}
            <a
              href="mailto:rarestaketech@gmail.com"
              style={{ color: 'var(--redd-red-light)', textDecoration: 'none' }}
            >
              rarestaketech@gmail.com
            </a>
            . Include your @handle and a brief confirmation that you are the registrant.
          </p>
          <p style={P}>
            Note that your <strong style={{ color: 'var(--text-primary)' }}>RDD wallet address</strong> is recorded on the public ReddCoin blockchain
            independently of ReddID. Removing your handle from our registry does not remove
            any on-chain transaction history.
          </p>
        </div>

        {/* 9 */}
        <div style={SECTION}>
          <h2 style={H2}>9. Children's privacy</h2>
          <p style={P}>
            ReddID is not directed at children under the age of 13. We do not knowingly
            collect personal information from children. If you believe a child has registered
            without parental consent, contact us and we will remove the record promptly.
          </p>
        </div>

        {/* 10 */}
        <div style={{ ...SECTION, marginBottom: 0 }}>
          <h2 style={H2}>10. Changes to this policy</h2>
          <p style={P}>
            We may update this policy as ReddID evolves. Material changes will be noted
            with a new effective date at the top of this page. Continued use of ReddID
            after a change constitutes acceptance of the updated policy.
          </p>
          <p style={{ ...P, marginBottom: 0 }}>
            Questions?{' '}
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
        <a href="/terms" style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textDecoration: 'none' }}>
          Terms of Use
        </a>
        <span style={{ color: 'var(--border)' }}>·</span>
        <a href="/" style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textDecoration: 'none' }}>
          Back to ReddID
        </a>
      </div>
    </div>
  );
}
