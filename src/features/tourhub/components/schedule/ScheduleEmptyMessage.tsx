/**
 * ScheduleEmptyMessage - Inline empty states for schedule
 * Subtle, informative messages that don't break the flow
 */

import { Calendar, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleEmptyMessageProps {
  variant: 'no-live' | 'no-results' | 'season-complete';
  nextTournamentName?: string;
  className?: string;
}

export function ScheduleEmptyMessage({ 
  variant, 
  nextTournamentName,
  className 
}: ScheduleEmptyMessageProps) {
  const content = {
    'no-live': {
      icon: <Radio className="w-4 h-4" />,
      message: nextTournamentName 
        ? `No live tournaments right now — next up: ${nextTournamentName}` 
        : 'No live tournaments right now.',
    },
    'no-results': {
      icon: <Calendar className="w-4 h-4" />,
      message: 'No tournaments match your search.',
    },
    'season-complete': {
      icon: <Calendar className="w-4 h-4" />,
      message: 'Season complete — relive the highlights in Overview.',
    },
  };

  const { icon, message } = content[variant];

  return (
    <div 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border/50",
        className
      )}
    >
      <div className="text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
