import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { getIdentityByHandle, publicIdentity } from '@/lib/db';
import { sanitizeHandle, getAddressType } from '@/lib/validation';

// Note: ImageResponse works on Node.js runtime too — edge runtime can't use fs/path from db.ts
export const dynamic = 'force-dynamic';

// Edge runtime can't use Node fs — use a data URL for the font weight fallback
// The OG image renders with system fonts at the edge.

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ handle: string }> }
) {
  const { handle } = await ctx.params;
  const clean = sanitizeHandle(handle);
  const raw = getIdentityByHandle(clean);
  const identity = raw ? publicIdentity(raw) : null;

  const displayName = identity?.displayName ?? (identity ? `@${identity.handle}` : '@unknown');
  const addrType    = identity ? getAddressType(identity.rddAddress) : null;
  const addrBadge   = addrType === 'segwit' ? 'SegWit' : addrType === 'legacy' ? 'Legacy' : null;
  const addrColor   = addrType === 'segwit' ? '#a78bfa' : '#60a5fa';

  const platformLabels: Record<string, string> = {
    twitter: '𝕏', youtube: '▶', reddit: '●', twitch: '⬟', instagram: '◈', tiktok: '♪', github: '⌥',
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#080808',
          padding: '0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top red stripe */}
        <div style={{ height: 8, background: '#E30613', width: '100%', display: 'flex' }} />

        <div style={{ padding: '48px 60px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* REDD badge + ReddID label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              background: '#E30613', color: 'white', fontWeight: 800, fontSize: 14,
              letterSpacing: '0.15em', padding: '4px 10px', borderRadius: 4, textTransform: 'uppercase',
              display: 'flex',
            }}>
              REDD
            </div>
            <span style={{ color: '#555', fontSize: 15, fontWeight: 600, display: 'flex' }}>ID Next</span>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Handle pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(227,6,19,0.12)',
              border: '1.5px solid rgba(227,6,19,0.3)',
              borderRadius: 24,
              padding: '6px 16px',
              alignSelf: 'flex-start',
              marginBottom: 20,
            }}>
              <span style={{ color: '#E30613', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', display: 'flex' }}>
                @{identity?.handle ?? clean}
              </span>
            </div>

            {/* Display name */}
            <div style={{ fontSize: 64, fontWeight: 800, color: '#f0f0f0', lineHeight: 1.1, marginBottom: 20, display: 'flex' }}>
              {displayName}
            </div>

            {/* Bio if present */}
            {identity?.bio && (
              <div style={{ fontSize: 22, color: '#888', lineHeight: 1.5, marginBottom: 28, maxWidth: 780, display: 'flex' }}>
                {identity.bio.slice(0, 120)}{identity.bio.length > 120 ? '…' : ''}
              </div>
            )}

            {/* Address row */}
            {identity?.rddAddress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  background: '#111',
                  border: '1px solid #252525',
                  borderRadius: 8,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span style={{ color: '#888', fontSize: 14, letterSpacing: '0.08em', display: 'flex' }}>Ɍ</span>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 16,
                    color: '#d4d4d4',
                    display: 'flex',
                  }}>
                    {identity.rddAddress.slice(0, 12)}…{identity.rddAddress.slice(-8)}
                  </span>
                  {addrBadge && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: addrColor,
                      background: `${addrColor}18`,
                      border: `1px solid ${addrColor}40`,
                      borderRadius: 3,
                      padding: '1px 6px',
                      display: 'flex',
                    }}>
                      {addrBadge}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Social proofs */}
            {identity && identity.socialProofs.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {identity.socialProofs.map(p => (
                  <div key={p.platform} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #252525',
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontSize: 14,
                    color: '#888',
                  }}>
                    <span style={{ fontSize: 12, display: 'flex' }}>{platformLabels[p.platform] ?? '🔗'}</span>
                    <span style={{ display: 'flex' }}>{p.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid #1a1a1a' }}>
            <span style={{ color: '#444', fontSize: 18, fontWeight: 600, display: 'flex' }}>redd.love</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E30613', display: 'flex' }} />
              <span style={{ color: '#444', fontSize: 16, display: 'flex' }}>Tip with Ɍ RDD</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
