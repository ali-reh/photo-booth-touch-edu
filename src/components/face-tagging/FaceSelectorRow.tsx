'use client';

import React from 'react';
import type { DetectedFace } from '@/types/kiosk';
import FaceCard from './FaceCard';

export interface FaceSelectorRowProps {
  faces: DetectedFace[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onIgnore?: (index: number) => void;
}

export function FaceSelectorRow({
  faces,
  selectedIndex,
  onSelect,
  onIgnore,
}: FaceSelectorRowProps) {
  const activeFaces = faces.filter((face) => !face.isIgnored);
  const activeCount = activeFaces.length;

  return (
    <div className="w-full">
      <div className="text-sm text-white/60 mb-2">
        {activeCount} face(s) detected
      </div>
      <div className="flex gap-3 overflow-x-auto p-4 bg-black/40 backdrop-blur-md rounded-2xl">
        {activeFaces.map((face) => (
          <FaceCard
            key={face.index}
            face={face}
            isSelected={face.index === selectedIndex}
            onSelect={() => onSelect(face.index)}
            onIgnore={() => onIgnore?.(face.index)}
          />
        ))}
      </div>
    </div>
  );
}

export default FaceSelectorRow;
