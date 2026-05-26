'use client';

import { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download, Printer } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import CopyButton from '@/components/CopyButton';

interface Props {
  handle: string;
  addr: string;
  pageUrl: string;
  bip21: string;
}

export default function CardClientButtons({ handle, addr, pageUrl, bip21 }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  // U20 — export the card QR as a 512×512 PNG download
  async function downloadQR() {
    const wrapper = qrRef.current;
    if (!wrapper) return;
    const svg = wrapper.querySelector('svg');
    if (!svg) return;

    const size = 512;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = `reddid-${handle}-card-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }

  const btnBase: React.CSSProperties = {
    background: '#1a1a1a',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    fontFamily: "'Rubik', sans-serif",
    fontWeight: 600,
    fontSize: '0.82rem',
    padding: '9px 18px',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'border-color 0.15s',
  };

  return (
    <>
      {/* Hidden QR for PNG export — positioned off-screen, not visible */}
      <div
        ref={qrRef}
        aria-hidden
        style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}
      >
        <QRCode value={bip21} size={512} level="M" bgColor="#ffffff" fgColor="#000000" />
      </div>

      {/* Action buttons (hidden on print via .no-print in card page's <style>) */}
      <div
        className="no-print"
        style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <button type="button" style={btnBase} onClick={() => window.print()}>
          <Printer size={14} />
          Print / Save PDF
        </button>

        <button type="button" style={btnBase} onClick={downloadQR}>
          <Download size={14} />
          Save QR as PNG
        </button>

        <ShareButton url={pageUrl} title={`Tip @${handle} with Ɍ RDD`} />
        <CopyButton text={addr} label="Copy address" />
      </div>
    </>
  );
}
