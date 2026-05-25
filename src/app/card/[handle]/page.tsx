import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIdentityByHandle } from '@/lib/db';
import { buildBip21Uri, getAddressType } from '@/lib/validation';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ShareButton from '@/components/ShareButton';
import CopyButton from '@/components/CopyButton';

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const identity = getIdentityByHandle(handle);
  if (!identity) return { title: 'Not found' };
  const name = identity.displayName ?? `@${identity.handle}`;
  return {
    title: `Tip card — ${name} | ReddID Next`,
    description: `Scan to tip ${name} with Ɍ RDD`,
  };
}

const PLATFORM_ICONS: Record<string, string> = {
  twitter: '𝕏', youtube: '▶', reddit: '●', twitch: '⬟', instagram: '◈', tiktok: '♪', github: '⌥',
};

export default async function CardPage({ params }: Props) {
  const { handle } = await params;
  const identity = getIdentityByHandle(handle.toLowerCase());
  if (!identity) notFound();

  const displayName = identity.displayName ?? `@${identity.handle}`;
  const bip21 = buildBip21Uri(identity.rddAddress);
  const addrType = getAddressType(identity.rddAddress);
  const typeBadge = addrType === 'segwit' ? 'SegWit' : addrType === 'legacy' ? 'Legacy' : null;
  const typeBadgeColor = addrType === 'segwit' ? '#a78bfa' : '#60a5fa';
  const pageUrl = `https://redd.love/@${identity.handle}`;

  return (
    <>
      {/* Print / share stylesheet */}
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { background: white !important; }
          .card-root { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--bg-primary)' }}>

        {/* The printable card */}
        <div
          className="card-root"
          style={{
            width: '100%',
            maxWidth: 480,
            background: '#0d0d0d',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Top stripe */}
          <div style={{ height: 6, background: 'linear-gradient(90deg, #E30613 0%, #B80510 100%)' }} />

          {/* Card body */}
          <div style={{ padding: '32px 36px 28px' }}>
            {/* Brand chip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: '#E30613', color: 'white', fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.18em', padding: '3px 8px', borderRadius: 4 }}>
                  REDD
                </div>
                <span style={{ color: '#555', fontSize: '0.72rem', fontWeight: 600 }}>ID Next</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#555' }}>redd.love</span>
            </div>

            {/* Handle + name */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#E30613', letterSpacing: '0.1em', marginBottom: 6 }}>
                @{identity.handle}
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: "'Rubik', sans-serif", color: '#f0f0f0', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {displayName}
              </div>
              {identity.bio && (
                <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.6, marginTop: 8, maxWidth: 340 }}>
                  {identity.bio.slice(0, 100)}{identity.bio.length > 100 ? '…' : ''}
                </div>
              )}
            </div>

            {/* QR code + address */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: 8, flexShrink: 0 }}>
                <QRCodeDisplay value={bip21} size={140} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Ɍ RDD Address
                </div>
                <div style={{
                  background: '#080808',
                  border: '1px solid #1e1e1e',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 8,
                }}>
                  <code style={{ fontSize: '0.68rem', color: '#d4d4d4', wordBreak: 'break-all', lineHeight: 1.6 }}>
                    {identity.rddAddress}
                  </code>
                </div>
                {typeBadge && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: typeBadgeColor, background: `${typeBadgeColor}18`, border: `1px solid ${typeBadgeColor}40`, borderRadius: 3, padding: '1px 7px' }}>
                    {typeBadge}
                  </span>
                )}
                <div style={{ marginTop: 12, fontSize: '0.7rem', color: '#555', lineHeight: 1.6 }}>
                  Scan the QR code or copy the address into any ReddCoin-compatible wallet to send Ɍ RDD.
                </div>
              </div>
            </div>

            {/* Social proofs */}
            {identity.socialProofs.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {identity.socialProofs.map(p => (
                  <span key={p.platform} style={{ fontSize: '0.68rem', color: '#666', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e1e', borderRadius: 4, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {PLATFORM_ICONS[p.platform] ?? '🔗'} {p.username}
                  </span>
                ))}
              </div>
            )}

            {/* Footer strip */}
            <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.7rem', color: '#444' }}>
                Powered by ReddID Next · redd.love
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E30613' }} />
                <span style={{ fontSize: '0.68rem', color: '#444' }}>Native Ɍ RDD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons (no-print) */}
        <div className="no-print" style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.print()}
            style={{
              background: '#1a1a1a', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontFamily: "'Rubik', sans-serif",
              fontWeight: 600, fontSize: '0.82rem',
              padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
            }}
          >
            🖨 Print / Save PDF
          </button>
          <ShareButton url={pageUrl} title={`Tip @${identity.handle} with Ɍ RDD`} />
          <CopyButton text={identity.rddAddress} label="Copy address" />
        </div>

        <div className="no-print" style={{ marginTop: 20, fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          <a href={`/${identity.handle}`} style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            ← Back to tip page
          </a>
        </div>
      </div>
    </>
  );
}
