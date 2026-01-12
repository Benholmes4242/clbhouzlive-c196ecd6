/**
 * ScheduleMonthHeader - Enhanced month section header for timeline
 * Features: larger dot, prominent month name, subtle line, event count pill
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
        "sticky top-12 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-1 px-1 mb-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Timeline dot - 8px, orange/primary filled */}
        <div className="relative w-2 h-2 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
        </div>
        
        {/* Month label - more prominent */}
        <h3 className="text-lg font-semibold text-foreground tracking-tight">
          {monthLabel}
        </h3>
        
        {/* Horizontal line extending to edge */}
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        
        {/* Event count as subtle pill */}
        <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full font-medium">
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
