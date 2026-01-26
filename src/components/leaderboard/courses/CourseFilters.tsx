import React from 'react';
import { cn } from '@/lib/utils';

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

const timeOptions: { value: CourseTimeRange; label: string }[] = [
  { value: 'all_time', label: 'All-Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_month', label: 'This Month' },
];

const scopeOptions: { value: CourseScope; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'country', label: 'Country' },
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
      {/* Sort tabs FIRST - Match Championship tab segmented control style */}
      <div className="flex p-1.5 bg-[#e2e8f0] rounded-xl">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={cn(
              'flex-1 py-2.5 min-h-[44px] text-sm font-medium rounded-lg transition-all flex items-center justify-center',
              sort === option.value
                ? 'bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                : 'text-[#64748b] hover:text-[#1e293b]'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Time range toggle SECOND */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 rounded-xl p-1.5">
          {timeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onTimeRangeChange(option.value)}
              className={cn(
                'px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg transition-all flex items-center justify-center',
                timeRange === option.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scope selector THIRD - Global / Country */}
      <div className="flex p-1.5 bg-[#e2e8f0] rounded-xl">
        {scopeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onScopeChange(option.value)}
            className={cn(
              'flex-1 py-2.5 min-h-[44px] text-sm font-medium rounded-lg transition-all flex items-center justify-center',
              scope === option.value
                ? 'bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                : 'text-[#64748b] hover:text-[#1e293b]'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
