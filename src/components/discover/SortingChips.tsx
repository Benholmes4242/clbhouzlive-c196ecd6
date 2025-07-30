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
                "hover:scale-105",
                isSelected
                  ? "bg-emerald-50 border border-emerald-300 text-emerald-700"
                  : "bg-muted/70 hover:bg-muted text-foreground/80 hover:text-foreground"
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