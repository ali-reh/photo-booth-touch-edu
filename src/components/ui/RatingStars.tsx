'use client';

import React from 'react';

export type RatingStarsSize = 'sm' | 'md' | 'lg';

export interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: RatingStarsSize;
  className?: string;
}

const sizeStyles: Record<RatingStarsSize, string> = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

export function RatingStars({
  value,
  onChange,
  size = 'md',
  className = '',
}: RatingStarsProps) {
  const starSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2, 3, 4].map((index) => {
        const starValue = index + 1;
        const isFilled = index < value;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onChange?.(starValue)}
            aria-label={`Rate ${starValue} out of 5 stars`}
            className={`transition-colors focus:outline-none ${
              isFilled ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-300'
            }`}
          >
            <svg
              className={starSize}
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default RatingStars;
