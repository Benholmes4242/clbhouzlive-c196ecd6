/**
 * TimeRangeFilter - Time-based leaderboard filter
 * All-time / This Year / This Month
 */

import React from 'react';
import { Calendar, ChevronDown, Check, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export function TimeRangeFilter({
  value,
  onChange,
  className,
}: TimeRangeFilterProps) {
  const currentLabel = TIME_RANGE_OPTIONS.find(o => o.value === value)?.label || 'All-time';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-1.5 px-0.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Filter by time range"
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
              'bg-muted/40 hover:bg-muted/60 transition-colors',
              'text-xs font-medium text-muted-foreground hover:text-foreground',
              'border border-border/40'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">{currentLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {TIME_RANGE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="w-4 h-4 text-primary ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
