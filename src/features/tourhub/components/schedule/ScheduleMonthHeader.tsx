/**
 * ScheduleMonthHeader - Clean editorial month section header
 * 
 * Features:
 * - Clubhouse text-mark font for month
 * - Black color, no orange
 * - Event count right-aligned
 * - Subtle hairline divider
 */

import { cn } from '@/lib/utils';

interface ScheduleMonthHeaderProps {
  monthLabel: string;
  eventCount: number;
  className?: string;
}

export function ScheduleMonthHeader({ 
  monthLabel, 
  eventCount,
  className 
}: ScheduleMonthHeaderProps) {
  return (
    <div className={cn("py-3", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        {/* Month label - Clubhouse display font */}
        <h3 className="font-display text-sm font-semibold text-black tracking-widest">
          {monthLabel}
        </h3>
        
        {/* Event count - muted, right-aligned */}
        <span className="text-xs font-normal text-muted-foreground">
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Subtle divider */}
      <div className="mt-2 h-px bg-black/10" />
    </div>
  );
}
