import React from 'react';
import { VideoFilter } from '../types';

type FilterBarProps = {
  active: VideoFilter;
  onChange: (filter: VideoFilter) => void;
};

const filters: VideoFilter[] = ['All', 'Pro Golf', 'Course Vlogs', 'Tips', 'Gear'];

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === filter
              ? 'bg-[#6e9277]/20 text-white'
              : 'bg-gray-800/60 text-gray-300 hover:bg-gray-800'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
