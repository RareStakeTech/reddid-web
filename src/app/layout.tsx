import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'ReddID Next — Social Identity for ReddCoin',
  description:
    'Register your @handle, link your RDD wallet, and receive Ɍ tips from anyone on the web. Built on ReddCoin — the original social currency.',
  openGraph: {
    title: 'ReddID Next',
    description: 'Social identity and tipping for ReddCoin (RDD · Ɍ)',
    siteName: 'ReddID Next',
  },
  manifest: '/manifest.webmanifest',
  themeColor: '#E30613',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Rubik (UI headings/buttons) + Roboto (body) — brand.reddcoin.com typography spec */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Rubik:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar />
        <main style={{ flex: 1 }}>{children}</main>
        <footer
          style={{
            borderTop: '1px solid var(--border)',
            padding: '20px',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.78rem',
            fontFamily: "'Rubik', sans-serif",
          }}
        >
          <span>ReddID Next v0.3 beta · </span>
          <a
            href="https://www.reddcoin.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-dim)', textDecoration: 'none' }}
          >
            reddcoin.com
          </a>
          <span> · Ɍ Native RDD is always the root · </span>
          <a href="/docs" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            Architecture
          </a>
          <span> · </span>
          <a href="/reserve" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            Reserve Model
          </a>
          <span> · </span>
          <a href="/platforms" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            Platforms
          </a>
          <span> · </span>
          <a href="/bridge" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            ReddBridge
          </a>
          <span> · </span>
          <a href="/staking" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            PoSV Staking
          </a>
        </footer>
      </body>
    </html>
  );
}
