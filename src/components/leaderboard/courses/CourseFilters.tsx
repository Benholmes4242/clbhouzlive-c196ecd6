import React from 'react';
import { cn } from '@/lib/utils';
import { PillToggle } from '@/components/ui/PillToggle';

export type CourseSortType = 'most_played' | 'highest_rated' | 'rising';
export type CourseTimeRange = 'all_time' | 'this_season' | 'this_month';
export type CourseScope = 'global' | 'country';

interface Props {
  sort: CourseSortType;
  onSortChange: (sort: CourseSortType) => void;
  timeRange: CourseTimeRange;
  onTimeRangeChange: (range: CourseTimeRange) => void;
  scope: CourseScope;
  onScopeChange: (scope: CourseScope) => void;
}

const sortOptions: { value: CourseSortType; label: string }[] = [
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'most_played', label: 'Most Played' },
  { value: 'rising', label: 'Trending' },
];

const timeOptions = [
  { id: 'all_time', label: 'All-Time' },
  { id: 'this_season', label: 'This Season' },
  { id: 'this_month', label: 'This Month' },
];

const scopeOptions = [
  { id: 'global', label: 'Global' },
  { id: 'country', label: 'Country' },
];

export const CourseFilters: React.FC<Props> = ({
  sort,
  onSortChange,
  timeRange,
  onTimeRangeChange,
  scope,
  onScopeChange,
}) => {

  return (
    <div className="px-4 py-4 space-y-3">
      {/* PRIMARY: Sort tabs - Matching main leaderboard tab style */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-xl bg-[#e2e8f0]">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap',
                sort === option.value 
                  ? 'm-0.5 bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]' 
                  : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECONDARY: Time Frame - Pill toggle */}
      <div className="flex justify-center">
        <PillToggle 
          options={timeOptions} 
          selected={timeRange} 
          onSelect={(id) => onTimeRangeChange(id as CourseTimeRange)}
        />
      </div>

      {/* TERTIARY: Scope - Pill toggle (smaller) */}
      <div className="flex justify-center">
        <PillToggle 
          options={scopeOptions} 
          selected={scope} 
          onSelect={(id) => onScopeChange(id as CourseScope)}
          size="small"
        />
      </div>
    </div>
  );
};
