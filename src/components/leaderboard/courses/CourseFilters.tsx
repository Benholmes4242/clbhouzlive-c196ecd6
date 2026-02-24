import React from 'react';
import { PillToggle } from '@/components/ui/PillToggle';

export type CourseSortType = 'most_played' | 'highest_rated' | 'rising';
export type CourseTimeRange = 'all_time' | 'this_season' | 'this_month';
export type CourseScope = 'global' | 'country';

interface Props {
  sort: CourseSortType;
  onSortChange: (sort: CourseSortType) => void;
  // Keep these in interface for backwards compat but they're no longer rendered
  timeRange?: CourseTimeRange;
  onTimeRangeChange?: (range: CourseTimeRange) => void;
  scope?: CourseScope;
  onScopeChange?: (scope: CourseScope) => void;
}

const sortOptions = [
  { id: 'highest_rated', label: 'Highest Rated' },
  { id: 'most_played', label: 'Most Played' },
  { id: 'rising', label: 'Trending' },
];

export const CourseFilters: React.FC<Props> = ({
  sort,
  onSortChange,
}) => {
  return (
    <div className="flex justify-center">
      <PillToggle
        options={sortOptions}
        selected={sort}
        onSelect={(id) => onSortChange(id as CourseSortType)}
      />
    </div>
  );
};
