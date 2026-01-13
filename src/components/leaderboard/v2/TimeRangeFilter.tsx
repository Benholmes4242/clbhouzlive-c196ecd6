/**
 * TimeRangeFilter - Time-based leaderboard filter
 * Matches ExploreFiltersSheet pill style
 */

import React from 'react';
import { Calendar, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';

interface TimeRangeFilterProps {
  value: LeaderboardTimeRange;
  onChange: (value: LeaderboardTimeRange) => void;
  className?: string;
}

const TIME_RANGE_OPTIONS: { value: LeaderboardTimeRange; label: string }[] = [
  { value: 'all_time', label: 'All-time' },
  { value: 'this_year', label: 'This year' },
  { value: 'this_month', label: 'This month' },
];

// Filter pill style matching ExploreFiltersSheet
const FilterPill: React.FC<{
  label: string;
  selected: boolean;
  onClick: () => void;
}> = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
      selected
        ? "bg-foreground text-background"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    )}
  >
    {label}
  </button>
);

export function TimeRangeFilter({
  value,
  onChange,
  className,
}: TimeRangeFilterProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Label row */}
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Time Range
        </p>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-center">
              <p className="text-xs text-muted-foreground">
                Rankings are based on courses played within the selected time period. Lifetime progress is always preserved.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Pills row - full width flex wrap */}
      <div className="flex flex-wrap gap-2">
        {TIME_RANGE_OPTIONS.map((option) => (
          <FilterPill
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
