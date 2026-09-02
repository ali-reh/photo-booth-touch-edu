'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface QRCodeDisplayProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({
  url,
  size = 200,
  className = '',
}: QRCodeDisplayProps) {
  return (
    <div className={`flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-2xl ${className}`}>
      <QRCodeSVG value={url} size={size} level="H" />
      <p className="text-xs text-gray-500 mt-2 text-center">
        Scan to download your photo
      </p>
    </div>
  );
}

export default QRCodeDisplay;
