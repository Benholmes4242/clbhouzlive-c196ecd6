import React from 'react';
import { ChevronDown } from 'lucide-react';

type Top100SortOption = 'official' | 'name_asc' | 'name_desc';

type Top100ResultSummaryBarProps = {
  visibleCount: number;
  totalCount: number;
  currentListName: string;
  sort: Top100SortOption;
  onSortClick: () => void;
};

function getTop100SortLabel(sort: Top100SortOption): string {
  switch (sort) {
    case 'official':
      return 'Official ranking';
    case 'name_asc':
      return 'A to Z';
    case 'name_desc':
      return 'Z to A';
    default:
      return 'Official ranking';
  }
}

export function Top100ResultSummaryBar({
  visibleCount,
  totalCount,
  currentListName,
  sort,
  onSortClick,
}: Top100ResultSummaryBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/30 bg-card px-4 py-3">
      <div className="flex flex-col text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">
            Showing 1–{visibleCount}
          </span>{' '}
          of{' '}
          <span className="font-medium text-foreground">
            {totalCount}
          </span>{' '}
          courses
        </span>
        <span className="text-muted-foreground/80">
          Showing courses in {currentListName}
        </span>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
        onClick={onSortClick}
      >
        <span className="text-muted-foreground">Sort</span>
        <span>{getTop100SortLabel(sort)}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
