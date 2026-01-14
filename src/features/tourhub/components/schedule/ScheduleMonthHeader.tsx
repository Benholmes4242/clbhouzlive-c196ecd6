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
        <h3 className="font-display text-sm font-semibold text-slate-800 tracking-widest">
          {monthLabel}
        </h3>
        
        {/* Event count - muted, right-aligned */}
        <span className="text-xs font-normal text-slate-800">
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Subtle divider - exact match to Schedule title divider */}
      <div className="flex justify-center mt-4 mb-2">
        <div className="w-[80vw] h-px bg-slate-800/20" />
      </div>
    </div>
  );
}
