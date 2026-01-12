/**
 * ScheduleMonthHeader - Editorial chapter-style month section
 * 
 * Features:
 * - Timeline marker with colored dot
 * - Month + Year as chapter heading
 * - Thin divider line extending right
 * - Event count with editorial separator
 * - Extra spacing for chapter feel
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
        // Extra vertical spacing for chapter breathing room
        "sticky top-12 z-10 bg-background/95 backdrop-blur-sm pt-8 pb-4 mt-6 first:mt-0",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Timeline dot - 10px, primary/orange filled with subtle glow */}
        <div className="relative w-2.5 h-2.5 flex items-center justify-center">
          <div className="absolute w-4 h-4 rounded-full bg-primary/20" />
          <div className="relative w-2.5 h-2.5 rounded-full bg-primary" />
        </div>
        
        {/* Month label with event count - editorial style */}
        <h3 className="text-lg font-semibold text-foreground tracking-tight whitespace-nowrap">
          {monthLabel}
          <span className="text-muted-foreground font-normal ml-2">
            · {eventCount} event{eventCount !== 1 ? 's' : ''}
          </span>
        </h3>
        
        {/* Horizontal line extending to edge - thinner */}
        <div className="flex-1 h-px bg-border/60" />
      </div>
    </div>
  );
}
