/**
 * ScheduleMonthHeader - Premium month section header for timeline
 * Sticky on scroll with subtle backdrop blur
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
        {/* Timeline dot */}
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-primary/30 ring-4 ring-background" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
        
        {/* Month label */}
        <h3 className="text-lg font-semibold text-foreground tracking-tight">
          {monthLabel}
        </h3>
        
        {/* Divider line */}
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        
        {/* Event count */}
        <span className="text-sm text-muted-foreground font-medium">
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
