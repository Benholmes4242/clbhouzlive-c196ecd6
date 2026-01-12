/**
 * ScheduleEmptyMessage - Clean inline empty states (no card container)
 * Simple centered text with icon, no background box
 */

import { Link } from 'react-router-dom';
import { Calendar, Radio, Trophy } from 'lucide-react';
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
      icon: <Radio className="w-5 h-5" />,
      message: nextTournamentName 
        ? `No live tournaments right now — next up: ${nextTournamentName}` 
        : 'No live tournaments right now.',
    },
    'no-results': {
      icon: <Calendar className="w-5 h-5" />,
      message: 'No tournaments match your filter.',
    },
    'season-complete': {
      icon: <Trophy className="w-5 h-5" />,
      message: null, // Special handling for clickable link
    },
  };

  const { icon, message } = content[variant];

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className
      )}
    >
      <div className="text-muted-foreground/50">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">
        {variant === 'season-complete' ? (
          <>
            Season complete — relive the highlights in{' '}
            <Link 
              to="/tourhub?tab=overview" 
              className="text-primary hover:underline font-medium"
            >
              Overview
            </Link>
          </>
        ) : (
          message
        )}
      </p>
    </div>
  );
}
