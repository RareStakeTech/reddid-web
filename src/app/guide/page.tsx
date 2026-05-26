import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, UserPlus, Link2, Share2, Zap, Shield, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Getting Started · ReddID',
  description:
    'Learn how to register your ReddCoin handle, link social accounts, install the Love Button extension, and start receiving Ɍ RDD tips.',
};

interface StepProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Step({ number, icon, title, children }: StepProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        padding: '28px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Step number + icon */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            background: 'var(--redd-red)',
            color: 'white',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 700,
            fontSize: '0.75rem',
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {number}
        </div>
        <div style={{ color: 'var(--redd-red)', opacity: 0.7 }}>{icon}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 700,
            fontSize: '1.1rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: 10,
          }}
        >
          {title}
        </h2>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.75 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(227,6,19,0.05)',
        border: '1px solid rgba(227,6,19,0.18)',
        borderRadius: 8,
        padding: '12px 16px',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        lineHeight: 1.65,
        marginTop: 12,
      }}
    >
      {children}
    </div>
  );
}

export default function GuidePage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <BookOpen size={22} style={{ color: 'var(--redd-red)' }} />
          <h1
            style={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 800,
              fontSize: '2rem',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Getting started with ReddID
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
          ReddID is a non-custodial social identity directory for ReddCoin (Ɍ RDD). In four steps
          you&apos;ll have a public tip page, verified social accounts, and the Love Button extension
          active on every creator platform you visit.
        </p>
      </div>

      {/* Steps */}
      <div>

        {/* Step 1 */}
        <Step number="1" icon={<UserPlus size={18} />} title="Register your @handle">
          <p>
            Choose a unique handle that represents you across all platforms — your ReddID is your
            permanent on-chain identity. Handles are lowercase, 3–24 characters, letters and numbers
            only.
          </p>
          <ol style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Go to <Link href="/register" style={{ color: 'var(--redd-red)', textDecoration: 'none', fontWeight: 600 }}>/register</Link></li>
            <li>Enter your handle, display name, RDD address, and optional bio / website</li>
            <li>Add social accounts in the &ldquo;Social Accounts&rdquo; section (optional — you can add them later via <Link href="/verify" style={{ color: 'var(--redd-red)', textDecoration: 'none' }}>/verify</Link>)</li>
            <li>Submit — you&apos;ll receive an <strong>edit token</strong> shown once. Save it securely; it&apos;s the only way to update your profile.</li>
          </ol>
          <Callout>
            <strong>Non-custodial:</strong> ReddID never holds your private keys or funds. Your RDD
            address is stored publicly so fans can send tips directly to your wallet — no
            intermediary, no wrapping.
          </Callout>
        </Step>

        {/* Step 2 */}
        <Step number="2" icon={<Link2 size={18} />} title="Verify your social accounts">
          <p>
            Verified accounts earn a ✓ badge on your tip page, increasing trust with fans.
            Verification is done by posting a short challenge code to your profile — ReddID reads it
            to confirm you control the account.
          </p>
          <ol style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Go to <Link href="/verify" style={{ color: 'var(--redd-red)', textDecoration: 'none', fontWeight: 600 }}>/verify</Link></li>
            <li>Enter your handle and select the platform you want to verify</li>
            <li>Copy the generated challenge code (e.g. <code style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>reddid:verify:abc123</code>)</li>
            <li>Paste it into your bio, pinned post, or &ldquo;about&rdquo; field on that platform</li>
            <li>Return to /verify and click <strong>Confirm</strong> — ReddID checks the page and flips your badge to ✓</li>
          </ol>
          <Callout>
            Supported platforms: 𝕏 (Twitter), YouTube, Reddit, Instagram, Twitch, TikTok, Bluesky,
            Mastodon, Rumble, Truth Social, Odysee, Kick, and GitHub. More coming — see{' '}
            <Link href="/platforms" style={{ color: 'var(--redd-red)', textDecoration: 'none' }}>/platforms</Link>.
          </Callout>
        </Step>

        {/* Step 3 */}
        <Step number="3" icon={<Share2 size={18} />} title="Share your tip page">
          <p>
            Your public tip page lives at <code style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>redd.love/@yourhandle</code>.
            Share it anywhere — in bios, video descriptions, stream overlays, email footers, or
            Discord servers.
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>
              <strong>QR code</strong> — scan-to-tip QR is shown at the top of your page (BIP21 URI
              format; opens your fan&apos;s RDD wallet pre-filled with your address)
            </li>
            <li>
              <strong>Tip card</strong> — printable branded card at{' '}
              <code style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>/card/@yourhandle</code> — ideal for
              streaming overlays and video thumbnails
            </li>
            <li>
              <strong>Ɍ Pay button</strong> — focused payment UI with preset amounts (10 / 25 / 50 /
              100 / 250 / 500 RDD) at <code style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>/pay/@yourhandle</code>
            </li>
            <li>
              <strong>Copy URL button</strong> — one-click copy of your tip page URL from the card footer
            </li>
          </ul>
        </Step>

        {/* Step 4 */}
        <Step number="4" icon={<Zap size={18} />} title="Install the Love Button extension">
          <p>
            The <strong>Love Button</strong> browser extension adds a Ɍ tip button to every supported
            creator platform. When you&apos;re watching a YouTube video or reading a Twitter thread,
            the extension finds that creator&apos;s ReddID and shows their address and balance inline.
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Download from the Chrome Web Store or Firefox Add-ons (links below once live)</li>
            <li>The popup lets you look up any @handle and copy their BIP21 payment URI</li>
            <li>History tab keeps your last 20 looked-up creators for quick re-access</li>
            <li>Works on: YouTube, Twitter/𝕏, Reddit, Twitch, Instagram, TikTok, Bluesky, Mastodon, Rumble, Odysee, Kick, GitHub, Truth Social</li>
          </ul>
          <Callout>
            <strong>Non-custodial extension:</strong> the Love Button never requests wallet access or
            private keys. It only reads the public ReddID directory. Tips are sent from your own wallet app.
          </Callout>
        </Step>

        {/* Step 5 — bonus */}
        <Step number="5" icon={<Shield size={18} />} title="Keep your profile current">
          <p>
            Your edit token lets you update your display name, bio, website, and RDD address at any
            time. Store it in a password manager or secure note — there is no account recovery.
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Go to <code style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>redd.love/edit/@yourhandle</code> and enter your edit token</li>
            <li>If you rotate your RDD address, update it here so tips always reach your current wallet</li>
            <li>Lost your edit token? <a href="mailto:rarestaketech@gmail.com" style={{ color: 'var(--redd-red)', textDecoration: 'none' }}>Contact support</a> — handle ownership is verified by social proof</li>
          </ul>
        </Step>

      </div>

      {/* FAQ */}
      <div style={{ marginTop: 48 }}>
        <h2
          style={{
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 700,
            fontSize: '1.2rem',
            color: 'var(--text-primary)',
            marginBottom: 20,
            letterSpacing: '-0.01em',
          }}
        >
          Frequently asked questions
        </h2>

        {[
          {
            q: 'Is there a fee to register?',
            a: 'No. Registration is free. ReddID is a directory service — we don\'t charge for handles or verification. Tips go directly from fan wallet to creator wallet; only the standard ReddCoin network fee (a few fractions of RDD) applies.',
          },
          {
            q: 'Can I have multiple RDD addresses?',
            a: 'Yes. The ReddID v2 identity model supports multiple wallet links with labels (e.g. "main wallet", "hardware wallet"). Add them on your edit page. The primary address shown on your tip page is the first non-revoked entry.',
          },
          {
            q: 'What happens if I lose my edit token?',
            a: 'The edit token is the only credential for your handle. There is no password-reset flow. If you lose it, contact support with verified social proof of ownership — we can issue a replacement after verification.',
          },
          {
            q: 'Does ReddID store my private keys?',
            a: 'Never. ReddID stores only your public RDD address, handle, and social proof records. Private keys never leave your wallet. ReddID is a read-only directory from the wallet\'s perspective.',
          },
          {
            q: 'When will ReddRail state channel payments be available?',
            a: 'ReddRail is planned for Q3/Q4 2026, dependent on Gajumaru Associate Chain infrastructure. See the roadmap for current status. All existing base-layer RDD tip flows work today.',
          },
        ].map(({ q, a }) => (
          <div
            key={q}
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                marginBottom: 6,
              }}
            >
              {q}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.7 }}>
              {a}
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div
        style={{
          marginTop: 48,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/register"
          style={{
            background: 'var(--redd-red)',
            color: 'white',
            textDecoration: 'none',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 700,
            fontSize: '0.9rem',
            padding: '11px 24px',
            borderRadius: 8,
          }}
        >
          Register your @handle →
        </Link>
        <Link
          href="/explore"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 500,
            fontSize: '0.9rem',
            padding: '11px 24px',
            borderRadius: 8,
          }}
        >
          Browse creators
        </Link>
        <a
          href="https://www.reddcoin.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 500,
            fontSize: '0.9rem',
            padding: '11px 24px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ExternalLink size={14} />
          reddcoin.com
        </a>
      </div>

    </div>
  );
}
