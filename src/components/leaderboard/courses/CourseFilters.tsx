import React from 'react';
import { cn } from '@/lib/utils';

export type CourseSortType = 'most_played' | 'highest_rated' | 'rising' | 'friends';
export type CourseTimeRange = 'all_time' | 'this_season' | 'this_month';

interface Props {
  sort: CourseSortType;
  onSortChange: (sort: CourseSortType) => void;
  timeRange: CourseTimeRange;
  onTimeRangeChange: (range: CourseTimeRange) => void;
}

const sortOptions: { value: CourseSortType; label: string; helper: string }[] = [
  { value: 'most_played', label: 'Most Played', helper: 'Total rounds logged' },
  { value: 'highest_rated', label: 'Highest Rated', helper: 'Minimum 5 ratings' },
  { value: 'rising', label: 'Trending', helper: 'Based on momentum' },
  { value: 'friends', label: 'Friends', helper: 'Your circle only' },
];

const timeOptions: { value: CourseTimeRange; label: string }[] = [
  { value: 'all_time', label: 'All-Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_month', label: 'This Month' },
];

export const CourseFilters: React.FC<Props> = ({
  sort,
  onSortChange,
  timeRange,
  onTimeRangeChange,
}) => {
  const activeSort = sortOptions.find(s => s.value === sort);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Time range toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 rounded-full p-1">
          {timeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onTimeRangeChange(option.value)}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-full transition-all',
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

      {/* Sort tabs - Match Championship tab segmented control style */}
      <div className="flex p-1 bg-[#e2e8f0] rounded-xl">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-lg transition-all',
              sort === option.value
                ? 'bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                : 'text-[#64748b] hover:text-[#1e293b]'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Helper text */}
      {activeSort && (
        <p className="text-center text-[10px] text-slate-500">
          {activeSort.helper}
        </p>
      )}
    </div>
  );
};
