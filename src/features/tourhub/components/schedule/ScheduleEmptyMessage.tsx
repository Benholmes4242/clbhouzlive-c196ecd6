/**
 * ScheduleEmptyMessage - Inline empty states for schedule
 * Subtle, centered, neutral messages that don't break the flow
 */

import { Link } from 'react-router-dom';
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
      message: 'No tournaments match your filter.',
    },
    'season-complete': {
      icon: <Calendar className="w-4 h-4" />,
      message: null, // Special handling for clickable link
    },
  };

  const { icon, message } = content[variant];

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-muted/30 border border-border/40 text-center",
        className
      )}
    >
      <div className="text-muted-foreground/60">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground/80">
        {variant === 'season-complete' ? (
          <>
            Season complete — relive the highlights in{' '}
            <Link 
              to="/tourhub?tab=overview" 
              className="text-primary hover:underline font-medium"
            >
              Overview
            </Link>
            .
          </>
        ) : (
          message
        )}
      </p>
    </div>
  );
}
