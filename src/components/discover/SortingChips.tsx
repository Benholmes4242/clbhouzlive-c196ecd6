import React from 'react';
import { cn } from '@/lib/utils';
import { getDiscoverCategories } from '@/components/post/create-moment/categoryDefinitions';

interface SortingChip {
  id: string;
  label: string;
  keyword: string;
  emoji?: string;
}

interface SortingChipsProps {
  selectedChip: string | null;
  onChipSelect: (chipId: string | null) => void;
}

// Build chips from canonical category definitions
const sortingChips: SortingChip[] = [
  { id: 'all', label: 'All', keyword: '' },
  ...getDiscoverCategories().map((cat) => ({
    id: cat.id,
    label: cat.label,
    emoji: cat.emoji ?? '',
    keyword: cat.id,
  })),
];

const SortingChips: React.FC<SortingChipsProps> = ({ selectedChip, onChipSelect }) => {
  return (
    <div 
      className="px-4 py-2"
      style={{
        background: 'var(--bg-header)',
      }}
    >
      <div className="flex overflow-x-auto scrollbar-hide gap-2">
        {sortingChips.map((chip) => {
          const isSelected = selectedChip === chip.id;
          
          return (
            <button
              key={chip.id}
              onClick={() => onChipSelect(isSelected ? null : chip.id)}
              className={cn(
                "pill",
                isSelected && "pill--active"
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {chip.emoji && <span aria-hidden="true">{chip.emoji}</span>}
                <span>{chip.label}</span>
              </span>
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