import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SortMode = 'official' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc';
export type FilterMode = 'all' | 'played' | 'not-played' | 'shortlisted';

interface Top100ListFiltersProps {
  sortBy: SortMode;
  onSortChange: (value: SortMode) => void;
  courseFilter: FilterMode;
  onFilterChange: (value: FilterMode) => void;
}

export const Top100ListFilters: React.FC<Top100ListFiltersProps> = ({
  sortBy,
  onSortChange,
  courseFilter,
  onFilterChange,
}) => {
  return (
    <section className="mt-6 px-4">
      <div className="flex gap-2">
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortMode)}>
          <SelectTrigger className="w-[160px] h-9 bg-white border-slate-200 rounded-full text-[13px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="official">Official ranking</SelectItem>
            <SelectItem value="rating-desc">Rating (high to low)</SelectItem>
            <SelectItem value="rating-asc">Rating (low to high)</SelectItem>
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z–A)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={courseFilter} onValueChange={(v) => onFilterChange(v as FilterMode)}>
          <SelectTrigger className="w-[160px] h-9 bg-white border-slate-200 rounded-full text-[13px]">
            <SelectValue placeholder="Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            <SelectItem value="played">Played only</SelectItem>
            <SelectItem value="not-played">Not played yet</SelectItem>
            <SelectItem value="shortlisted">Shortlisted only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
};
