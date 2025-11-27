import React from 'react';
import { ChevronDown } from 'lucide-react';

type ExploreSortOption = 'popular' | 'rating_desc' | 'rating_asc' | 'name_asc' | 'name_desc';

type ExploreResultSummaryBarProps = {
  visibleCount: number;
  totalCount: number;
  sort: ExploreSortOption;
  onSortClick: () => void;
};

function getExploreSortLabel(sort: ExploreSortOption): string {
  switch (sort) {
    case 'popular':
      return 'Most popular';
    case 'rating_desc':
      return 'Highest rated';
    case 'rating_asc':
      return 'Lowest rated';
    case 'name_asc':
      return 'A to Z';
    case 'name_desc':
      return 'Z to A';
    default:
      return 'Most popular';
  }
}

export function ExploreResultSummaryBar({
  visibleCount,
  totalCount,
  sort,
  onSortClick,
}: ExploreResultSummaryBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/30 bg-card px-4 py-3">
      {/* Left: metadata */}
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          Showing 1–{visibleCount}
        </span>{' '}
        of{' '}
        <span className="font-medium text-foreground">
          {totalCount.toLocaleString()}
        </span>{' '}
        courses
      </div>

      {/* Right: sort control */}
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
        onClick={onSortClick}
      >
        <span className="text-muted-foreground">Sort</span>
        <span>{getExploreSortLabel(sort)}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
