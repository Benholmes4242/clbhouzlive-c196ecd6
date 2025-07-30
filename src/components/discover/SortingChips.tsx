import React from 'react';
import { cn } from '@/lib/utils';

interface SortingChip {
  id: string;
  label: string;
  keyword: string;
}

interface SortingChipsProps {
  selectedChip: string | null;
  onChipSelect: (chipId: string | null) => void;
}

const sortingChips: SortingChip[] = [
  { id: 'all', label: 'All', keyword: '' },
  { id: 'funny', label: 'Funny Golf Moments', keyword: 'funny' },
  { id: 'tips', label: 'Tips & Lessons', keyword: 'tips' },
  { id: 'shots', label: 'Best Shots', keyword: 'shot' },
  { id: 'courses', label: 'Top Courses', keyword: 'course' },
  { id: 'reactions', label: 'Player Reactions', keyword: 'reaction' },
];

const SortingChips: React.FC<SortingChipsProps> = ({ selectedChip, onChipSelect }) => {
  return (
    <div className="px-4 pt-3 pb-2">
      <div className="flex overflow-x-auto scrollbar-hide gap-2">
        {sortingChips.map((chip) => {
          const isSelected = selectedChip === chip.id;
          
          return (
            <button
              key={chip.id}
              onClick={() => onChipSelect(isSelected ? null : chip.id)}
              className={cn(
                "flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                "bg-gradient-to-b border",
                isSelected
                  ? "from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200"
                  : "from-white to-gray-50 border-gray-200 text-gray-700 hover:from-gray-50 hover:to-gray-100 active:from-gray-100 active:to-gray-200"
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SortingChips;
export { sortingChips };
export type { SortingChip };