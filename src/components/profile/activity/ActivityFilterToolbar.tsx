import React from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { ActivityFilterType } from '../ActivityFiltersSheet';
import { cn } from '@/lib/utils';

interface ActivityFilterToolbarProps {
  activeFilter: ActivityFilterType;
  onOpenFilters: () => void;
}

const FILTER_LABELS: Record<ActivityFilterType, string> = {
  all: 'All posts',
  videos: 'Videos only',
  photos: 'Photos only',
  courses: 'Courses tagged',
};

/**
 * ActivityFilterToolbar - Dedicated toolbar row for Activity feed filtering
 * Replaces the "wedged" filter icon with a clean, intentional toolbar
 * 
 * Layout:
 * ────────────────────────────────
 *  All posts ▾                Filter
 * ────────────────────────────────
 */
const ActivityFilterToolbar: React.FC<ActivityFilterToolbarProps> = ({
  activeFilter,
  onOpenFilters,
}) => {
  const activeLabel = FILTER_LABELS[activeFilter];

  return (
    <div className="h-11 flex items-center justify-between px-4 border-b border-border/50">
      {/* Left side - Active filter state */}
      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 -ml-2 rounded-lg',
          'text-sm font-medium text-muted-foreground',
          'hover:bg-muted/50 active:bg-muted/70 transition-colors'
        )}
      >
        <span>{activeLabel}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Right side - Filter CTA */}
      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 -mr-2 rounded-lg',
          'text-sm font-medium text-muted-foreground',
          'hover:bg-muted/50 active:bg-muted/70 transition-colors'
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Filter</span>
      </button>
    </div>
  );
};

export default ActivityFilterToolbar;
