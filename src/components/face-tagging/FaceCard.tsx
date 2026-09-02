'use client';

import React from 'react';
import type { DetectedFace } from '@/types/kiosk';

export interface FaceCardProps {
  face: DetectedFace;
  isSelected: boolean;
  onSelect: () => void;
  onIgnore: () => void;
}

export function FaceCard({
  face,
  isSelected,
  onSelect,
  onIgnore,
}: FaceCardProps) {
  const isMatched = Boolean(face.matchedVisitor);

  const borderClasses = isSelected
    ? 'border-indigo-500 ring-4 ring-indigo-500/30'
    : isMatched
    ? 'border-green-500'
    : 'border-white/30';

  return (
    <div
      onClick={onSelect}
      className="flex-shrink-0 w-24 flex flex-col items-center gap-1 cursor-pointer select-none group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Thumbnail Container */}
      <div className="relative w-20 h-20">
        {face.thumbnailUrl ? (
          <img
            src={face.thumbnailUrl}
            alt={face.matchedVisitor?.fullName || `Face ${face.index + 1}`}
            className={`w-20 h-20 rounded-full object-cover border-2 transition-all duration-200 ${borderClasses}`}
          />
        ) : (
          <div
            className={`w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-white/40 border-2 transition-all duration-200 ${borderClasses}`}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        {/* Ignore Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIgnore();
          }}
          className="absolute -top-1 -right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors shadow-md z-10"
          aria-label="Ignore face"
          title="Ignore face"
        >
          &times;
        </button>
      </div>

      {/* Badge & Info */}
      {isMatched && face.matchedVisitor ? (
        <div className="flex flex-col items-center w-full px-0.5">
          <span className="px-1.5 py-0.5 text-[10px] font-medium leading-none bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">
            Matched
          </span>
          <span
            className="text-xs text-white/90 truncate w-full text-center mt-0.5"
            title={face.matchedVisitor.fullName}
          >
            {face.matchedVisitor.fullName}
          </span>
        </div>
      ) : (
        <span className="px-2 py-0.5 text-[10px] font-medium leading-none bg-white/10 text-white/70 border border-white/20 rounded-full">
          New
        </span>
      )}
    </div>
  );
}

export default FaceCard;
