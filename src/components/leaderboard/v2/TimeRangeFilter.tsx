/**
 * TimeRangeFilter - Time-based leaderboard filter dropdown
 * Matches CourseExplorer region/sub-region dropdown style
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';

interface TimeRangeFilterProps {
  value: LeaderboardTimeRange;
  onChange: (value: LeaderboardTimeRange) => void;
  className?: string;
}

const TIME_RANGE_OPTIONS: { value: LeaderboardTimeRange; label: string }[] = [
  { value: 'all_time', label: 'All time' },
  { value: 'this_year', label: 'This year' },
  { value: 'this_month', label: 'This month' },
];

function getTimeRangeLabel(value: LeaderboardTimeRange): string {
  return TIME_RANGE_OPTIONS.find(o => o.value === value)?.label || 'All time';
}

export function TimeRangeFilter({
  value,
  onChange,
  className,
}: TimeRangeFilterProps) {
  const isActive = value !== 'all_time';

  return (
    <Select value={value} onValueChange={(v) => onChange(v as LeaderboardTimeRange)}>
      <SelectTrigger 
        className={cn(
          'h-11 w-full rounded-sq-sm bg-white justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/60 focus-visible:border-slate-300 data-[state=open]:ring-0 transition-all duration-150',
          isActive
            ? 'border-primary/40 ring-1 ring-primary/20 text-foreground'
            : 'border-slate-200',
          className
        )}
        aria-label="Select time range"
      >
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="All time">
            {getTimeRangeLabel(value)}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-white border-slate-200 z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
        {TIME_RANGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
