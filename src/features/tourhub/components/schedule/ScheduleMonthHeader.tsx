/**
 * ScheduleMonthHeader - Clean editorial month section header
 * 
 * Features:
 * - 10px orange dot
 * - Prominent month/year text
 * - Horizontal line extending to edge
 * - Event count right-aligned
 * - Equal spacing above and below (py-6) for centered feel between cards
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
        "sticky top-12 z-10 bg-background/95 backdrop-blur-sm py-4 mt-4 first:mt-0",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Timeline dot - 10px, primary/orange filled */}
        <div className="relative w-2.5 h-2.5 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        </div>
        
        {/* Month label - prominent */}
        <h3 className="text-lg font-semibold text-foreground tracking-tight whitespace-nowrap">
          {monthLabel}
        </h3>
        
        {/* Horizontal line extending to edge */}
        <div className="flex-1 h-px bg-border" />
        
        {/* Event count - muted, right-aligned */}
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
