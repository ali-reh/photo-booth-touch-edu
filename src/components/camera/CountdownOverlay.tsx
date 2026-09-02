'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface CountdownOverlayProps {
  count: number | null;
  onComplete: () => void;
}

export function CountdownOverlay({ count, onComplete }: CountdownOverlayProps) {
  const [currentCount, setCurrentCount] = useState<number | null>(count);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setCurrentCount(count);
  }, [count]);

  useEffect(() => {
    if (currentCount === null) {
      return;
    }

    if (currentCount > 0) {
      const timer = setInterval(() => {
        setCurrentCount((prev) => {
          if (prev === null) return null;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    if (currentCount === 0) {
      const flashTimer = setTimeout(() => {
        onCompleteRef.current();
      }, 500);
      return () => clearTimeout(flashTimer);
    }
  }, [currentCount]);

  if (count === null || currentCount === null) {
    return null;
  }

  const isFlash = currentCount === 0;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center pointer-events-none transition-colors duration-200 ${
        isFlash ? 'bg-white' : 'bg-black/60'
      }`}
    >
      {isFlash ? (
        <div className="flex flex-col items-center justify-center animate-pulse">
          <span className="text-8xl mb-2 select-none">📸</span>
          <span className="text-7xl font-black tracking-widest text-black uppercase select-none">
            FLASH!
          </span>
        </div>
      ) : (
        <div
          key={currentCount}
          className="text-[200px] font-bold text-white leading-none select-none drop-shadow-2xl animate-pulse scale-100 transition-transform"
          style={{
            animation: 'countdownScaleFade 1s ease-out forwards',
          }}
        >
          {currentCount}
        </div>
      )}

      <style jsx global>{`
        @keyframes countdownScaleFade {
          0% {
            transform: scale(1.5);
            opacity: 0.2;
          }
          30% {
            transform: scale(1);
            opacity: 1;
          }
          80% {
            transform: scale(0.95);
            opacity: 0.9;
          }
          100% {
            transform: scale(0.85);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default CountdownOverlay;
