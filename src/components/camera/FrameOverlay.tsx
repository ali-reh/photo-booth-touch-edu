'use client';

import React from 'react';

export interface FrameOverlayProps {
  overlayUrl?: string;
  eventName?: string;
}

export function FrameOverlay({ overlayUrl, eventName }: FrameOverlayProps) {
  if (!overlayUrl && !eventName) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {overlayUrl ? (
        <img
          src={overlayUrl}
          alt="Frame overlay"
          className="w-full h-full object-cover select-none"
        />
      ) : eventName ? (
        <div className="w-full h-full p-8 flex flex-col justify-between">
          <div className="w-full h-full rounded-3xl border-2 border-white/30 bg-gradient-to-b from-white/10 via-transparent to-white/15 p-6 flex flex-col justify-end items-center shadow-[inset_0_0_30px_rgba(255,255,255,0.1)]">
            <div className="mb-2 px-6 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-xl">
              <span className="text-white text-xl font-bold tracking-widest uppercase drop-shadow-md">
                {eventName}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default FrameOverlay;
