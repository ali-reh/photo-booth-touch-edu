'use client';

import React from 'react';

export interface TagPickerProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function TagPicker({
  options,
  selected,
  onChange,
  className = '',
}: TagPickerProps) {
  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => {
        const isSelected = selected.includes(option);

        return (
          <button
            key={option}
            type="button"
            onClick={() => handleToggle(option)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default TagPicker;
