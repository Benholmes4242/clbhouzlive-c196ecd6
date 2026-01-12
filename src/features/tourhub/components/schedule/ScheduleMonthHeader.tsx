/**
 * ScheduleMonthHeader - Editorial chapter-style month section with progress
 * 
 * Features:
 * - Timeline marker with colored dot
 * - Current month highlighted brighter
 * - Past months softer, future months brighter
 * - Event count with editorial separator
 * - Extra spacing for chapter feel
 */

import { cn } from '@/lib/utils';

interface ScheduleMonthHeaderProps {
  monthLabel: string;
  eventCount: number;
  timelineStatus?: 'past' | 'current' | 'future';
  className?: string;
}

export function ScheduleMonthHeader({ 
  monthLabel, 
  eventCount,
  timelineStatus = 'current',
  className 
}: ScheduleMonthHeaderProps) {
  const isPast = timelineStatus === 'past';
  const isCurrent = timelineStatus === 'current';
  const isFuture = timelineStatus === 'future';

  return (
    <div 
      className={cn(
        // Extra vertical spacing for chapter breathing room
        "sticky top-12 z-10 bg-background/95 backdrop-blur-sm pt-8 pb-4 mt-6 first:mt-0",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Timeline dot - varies by status */}
        <div className="relative w-2.5 h-2.5 flex items-center justify-center">
          {/* Glow for current month */}
          {isCurrent && (
            <div className="absolute w-5 h-5 rounded-full bg-primary/30 animate-pulse" />
          )}
          <div className={cn(
            "absolute w-4 h-4 rounded-full",
            isCurrent ? "bg-primary/25" : isPast ? "bg-muted-foreground/10" : "bg-primary/15"
          )} />
          <div className={cn(
            "relative w-2.5 h-2.5 rounded-full",
            isCurrent ? "bg-primary" : isPast ? "bg-muted-foreground/50" : "bg-primary/70"
          )} />
        </div>
        
        {/* Month label with event count - editorial style */}
        <h3 className={cn(
          "text-lg font-semibold tracking-tight whitespace-nowrap",
          isCurrent ? "text-foreground" : isPast ? "text-muted-foreground" : "text-foreground"
        )}>
          {monthLabel}
          <span className={cn(
            "font-normal ml-2",
            isPast ? "text-muted-foreground/60" : "text-muted-foreground"
          )}>
            · {eventCount} event{eventCount !== 1 ? 's' : ''}
          </span>
        </h3>
        
        {/* Horizontal line extending to edge */}
        <div className={cn(
          "flex-1 h-px",
          isPast ? "bg-border/40" : "bg-border/60"
        )} />
      </div>
    </div>
  );
}
