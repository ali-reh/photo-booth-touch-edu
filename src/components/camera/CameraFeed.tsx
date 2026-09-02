'use client';

import React from 'react';

export interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  className?: string;
}

export function CameraFeed({ videoRef, isReady, className = '' }: CameraFeedProps) {
  return (
    <div className={`relative w-full h-full rounded-none overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover mirror -scale-x-100 [transform:scaleX(-1)]"
        style={{ transform: 'scaleX(-1)' }}
      />
      {!isReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 text-white backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <svg
              className="w-16 h-16 text-white/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
              />
            </svg>
            <span className="text-xl font-medium tracking-wide">Initializing Camera...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraFeed;
