import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type SortMode = 'rank' | 'rating-high' | 'rating-low' | 'name-asc' | 'name-desc';
export type FilterMode = 'all' | 'played' | 'not-played' | 'shortlisted';
export type ViewMode = 'all' | 'friends' | 'shortlist';

interface Top100ListFiltersProps {
  sortBy: SortMode;
  onSortChange: (value: SortMode) => void;
  courseFilter: FilterMode;
  onFilterChange: (value: FilterMode) => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
  // Pagination props
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Top100ListFilters: React.FC<Top100ListFiltersProps> = ({
  sortBy,
  onSortChange,
  courseFilter,
  onFilterChange,
  view,
  onViewChange,
  currentPage,
  totalPages,
  totalCourses,
  pageSize,
  onPageChange,
}) => {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalCourses);

  return (
    <section className="mt-6 px-4">
      {/* Dropdowns row */}
      <div className="flex gap-2">
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortMode)}>
          <SelectTrigger className="w-[160px] h-9 bg-white border-slate-200 rounded-full text-[13px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rank">Official ranking</SelectItem>
            <SelectItem value="rating-high">Rating (high to low)</SelectItem>
            <SelectItem value="rating-low">Rating (low to high)</SelectItem>
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z–A)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={courseFilter} onValueChange={(v) => onFilterChange(v as FilterMode)}>
          <SelectTrigger className="w-[150px] h-9 bg-white border-slate-200 rounded-full text-[13px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            <SelectItem value="played">Played only</SelectItem>
            <SelectItem value="not-played">Not played yet</SelectItem>
            <SelectItem value="shortlisted">Shortlisted only</SelectItem>
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

      {/* Pagination controls */}
      {totalCourses > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[13px] text-slate-600">
            {startItem}–{endItem} of {totalCourses}
          </span>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
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
