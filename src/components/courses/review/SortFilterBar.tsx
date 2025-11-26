import React from 'react';
import { Settings2 } from 'lucide-react';

export type SortOption = 'recent' | 'highest' | 'helpful';

interface SortPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const SortPill: React.FC<SortPillProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-100 ${
      active
        ? 'bg-slate-800 text-white border-slate-800'
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

interface SortFilterBarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onFilterClick?: () => void;
}

export const SortFilterBar: React.FC<SortFilterBarProps> = ({
  sortBy,
  onSortChange,
  onFilterClick,
}) => {
  return (
    <div className="sticky top-0 bg-slate-100 z-10 py-3 px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Settings2 className="w-3.5 h-3.5" />
          <span className="font-medium">Sort</span>
        </div>

        <div className="flex gap-1.5">
          <SortPill
            label="Most recent"
            active={sortBy === 'recent'}
            onClick={() => onSortChange('recent')}
          />
          <SortPill
            label="Highest rated"
            active={sortBy === 'highest'}
            onClick={() => onSortChange('highest')}
          />
          <SortPill
            label="Most helpful"
            active={sortBy === 'helpful'}
            onClick={() => onSortChange('helpful')}
          />
        </div>

        {onFilterClick && (
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
            onClick={onFilterClick}
          >
            Filters
          </button>
        )}
      </div>
    </div>
  );
};
