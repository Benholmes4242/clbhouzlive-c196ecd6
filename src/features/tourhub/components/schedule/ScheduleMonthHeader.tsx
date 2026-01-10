/**
 * ScheduleMonthHeader - Premium month section header for timeline
 * Refined visual weight and alignment
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
    <div 
      className={cn(
        "sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-1 px-1 mb-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Timeline dot - aligned with event dots */}
        <div className="relative w-2.5 h-2.5 flex items-center justify-center ml-[1px]">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/40 ring-4 ring-background" />
        </div>
        
        {/* Month label - reduced weight */}
        <h3 className="text-base font-medium text-foreground tracking-tight">
          {monthLabel}
        </h3>
        
        {/* Divider line */}
        <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
        
        {/* Event count - lighter still */}
        <span className="text-sm text-muted-foreground/70 font-normal">
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
