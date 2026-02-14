/**
 * ScheduleEmptyMessage - Polished empty states matching app design language
 * 
 * Variants:
 * - no-live: No live events, shows next upcoming + CTA to switch filter
 * - no-results: Tour filter yields nothing, CTA to reset
 * - no-upcoming: No upcoming events scheduled
 * - season-complete: Season done, link to overview
 */

import { Link } from 'react-router-dom';
import { Calendar, Flag, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ScheduleEmptyMessageProps {
  variant: 'no-live' | 'no-results' | 'no-upcoming' | 'season-complete';
  nextTournamentName?: string;
  nextTournamentDate?: string;
  tourName?: string;
  onSwitchFilter?: (filter: string) => void;
  onResetTour?: () => void;
  className?: string;
}

export function ScheduleEmptyMessage({ 
  variant, 
  nextTournamentName,
  nextTournamentDate,
  tourName,
  onSwitchFilter,
  onResetTour,
  className 
}: ScheduleEmptyMessageProps) {

  const formattedDate = nextTournamentDate 
    ? format(new Date(nextTournamentDate), 'EEE, MMM d') 
    : null;

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-4 min-h-[240px]",
        "py-12 px-6 mx-4 rounded-2xl text-center",
        "bg-card border border-border shadow-sm",
        className
      )}
    >
      {/* Icon */}
      {variant === 'no-live' && <Flag className="w-8 h-8 text-muted-foreground/40" />}
      {variant === 'no-results' && <Calendar className="w-8 h-8 text-muted-foreground/40" />}
      {variant === 'no-upcoming' && <Calendar className="w-8 h-8 text-muted-foreground/40" />}
      {variant === 'season-complete' && <Trophy className="w-8 h-8 text-muted-foreground/40" />}

      {/* Title */}
      <h4 className="text-lg font-semibold text-foreground">
        {variant === 'no-live' && 'No Live Events Right Now'}
        {variant === 'no-results' && (tourName ? `No ${tourName} Tournaments` : 'No Matches Found')}
        {variant === 'no-upcoming' && 'No Upcoming Tournaments'}
        {variant === 'season-complete' && 'Season Complete'}
      </h4>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground text-center max-w-[280px] mx-auto">
        {variant === 'no-live' && (
          nextTournamentName 
            ? <>Next up: <span className="font-medium text-foreground">{nextTournamentName}</span>{formattedDate && <> · {formattedDate}</>}</>
            : 'No tournaments are in progress. Check back soon!'
        )}
        {variant === 'no-results' && (
          tourName 
            ? `There are no ${tourName} events scheduled right now. Try a different tour or check back later.`
            : 'No tournaments match your search or filter.'
        )}
        {variant === 'no-upcoming' && 'The schedule will be updated when new events are announced.'}
        {variant === 'season-complete' && (
          <>
            Relive the highlights in{' '}
            <Link 
              to="/tourhub?tab=overview" 
              className="text-amber-600 font-medium transition-colors active:opacity-70"
            >
              Overview →
            </Link>
          </>
        )}
      </p>

      {/* CTA */}
      {variant === 'no-live' && onSwitchFilter && (
        <button
          onClick={() => onSwitchFilter('upcoming')}
          className="text-sm text-amber-600 font-medium transition-colors active:opacity-70"
        >
          View Upcoming →
        </button>
      )}
      {variant === 'no-results' && onResetTour && (
        <button
          onClick={() => onResetTour()}
          className="text-sm text-amber-600 font-medium transition-colors active:opacity-70"
        >
          View All Tours →
        </button>
      )}
    </div>
  );
}
