import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SortMode = 'rank' | 'name' | 'country' | 'rating';
export type FilterMode = 'all' | 'played' | 'not-played';
export type ViewMode = 'all' | 'friends' | 'shortlist';

interface Top100ListFiltersProps {
  sortBy: SortMode;
  onSortChange: (value: SortMode) => void;
  courseFilter: FilterMode;
  onFilterChange: (value: FilterMode) => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
}

export const Top100ListFilters: React.FC<Top100ListFiltersProps> = ({
  sortBy,
  onSortChange,
  courseFilter,
  onFilterChange,
  view,
  onViewChange,
}) => {
  return (
    <section className="mt-6 px-4">
      {/* Dropdowns row */}
      <div className="flex gap-2">
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortMode)}>
          <SelectTrigger className="w-[140px] h-9 bg-white border-slate-200 rounded-full text-[13px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rank">Rank</SelectItem>
            <SelectItem value="name">A → Z</SelectItem>
            <SelectItem value="country">Country</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>

        <Select value={courseFilter} onValueChange={(v) => onFilterChange(v as FilterMode)}>
          <SelectTrigger className="w-[140px] h-9 bg-white border-slate-200 rounded-full text-[13px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            <SelectItem value="played">Played</SelectItem>
            <SelectItem value="not-played">Not played</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Segmented control */}
      <div className="mt-3 inline-flex rounded-full bg-slate-100 p-1 text-[12px]">
        <SegmentedButton active={view === 'all'} onClick={() => onViewChange('all')}>
          All
        </SegmentedButton>
        <SegmentedButton active={view === 'friends'} onClick={() => onViewChange('friends')}>
          Friends
        </SegmentedButton>
        <SegmentedButton active={view === 'shortlist'} onClick={() => onViewChange('shortlist')}>
          Shortlist
        </SegmentedButton>
      </div>
    </section>
  );
};

interface SegmentedButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const SegmentedButton: React.FC<SegmentedButtonProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full font-medium transition-all ${
      active
        ? 'bg-white text-slate-900 shadow-sm'
        : 'text-slate-600 hover:text-slate-900'
    }`}
  >
    {children}
  </button>
);
