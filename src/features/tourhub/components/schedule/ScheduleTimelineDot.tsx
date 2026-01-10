/**
 * ScheduleTimelineDot - Visual dot indicator for timeline entries
 * States: completed (grey), upcoming (primary hollow), live (green pulse)
 */

import { cn } from '@/lib/utils';

interface ScheduleTimelineDotProps {
  status: 'live' | 'upcoming' | 'completed';
  className?: string;
}

export function ScheduleTimelineDot({ status, className }: ScheduleTimelineDotProps) {
  const dotStyles = {
    live: 'bg-emerald-500',
    upcoming: 'bg-transparent border-2 border-primary',
    completed: 'bg-muted-foreground/40',
  };

  return (
    <div 
      className={cn(
        "w-2.5 h-2.5 rounded-full ring-4 ring-background transition-colors",
        dotStyles[status],
        className
      )}
    >
      {status === 'live' && (
        <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500/50 animate-ping" />
      )}
    </div>
  );
}

// Map tournament status to dot status
export function getTournamentDotStatus(status: string): 'live' | 'upcoming' | 'completed' {
  switch (status) {
    case 'inprogress':
      return 'live';
    case 'closed':
      return 'completed';
    default:
      return 'upcoming';
  }
}
