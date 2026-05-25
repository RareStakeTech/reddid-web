'use client';

import QRCode from 'react-qr-code';

interface Props {
  /** The value to encode — pass a BIP21 URI (reddcoin:Raddress) for wallet compatibility. */
  value: string;
  size?: number;
}

export default function QRCodeDisplay({ value, size = 180 }: Props) {
  return (
    <div className="qr-wrapper" style={{ lineHeight: 0 }}>
      <QRCode
        value={value}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}
