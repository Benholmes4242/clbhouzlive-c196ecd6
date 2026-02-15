/**
 * ScheduleEmptyMessage - Premium empty states for the schedule page
 * 
 * Variants:
 * - no-live: Premium empty state with next-event countdown + CTA
 * - no-results: Tour filter yields nothing, CTA to reset
 * - no-upcoming: No upcoming events scheduled
 * - season-complete: Season done, link to overview
 */

import { Link } from 'react-router-dom';
import { Calendar, Flag, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, differenceInHours } from 'date-fns';

interface ScheduleEmptyMessageProps {
  variant: 'no-live' | 'no-results' | 'no-upcoming' | 'season-complete';
  nextTournamentName?: string;
  nextTournamentDate?: string;
  tourName?: string;
  onSwitchFilter?: (filter: string) => void;
  onResetTour?: () => void;
  className?: string;
}

function formatCountdown(dateStr: string): string {
  const target = new Date(dateStr);
  const now = new Date();
  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  
  if (days > 1) return `starts in ${days} days`;
  if (days === 1) return `starts tomorrow`;
  if (hours > 1) return `starts in ${hours} hours`;
  return `starts soon`;
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

  const countdown = nextTournamentDate ? formatCountdown(nextTournamentDate) : null;

  // Premium no-live empty state
  if (variant === 'no-live') {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-5",
          "py-16 px-6 mx-4 text-center",
          className
        )}
        style={{ minHeight: 'clamp(282px, 53vh, 422px)' }}
      >
        {/* Golf-themed icon with gradient circle */}
        <div className="relative">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(var(--muted)), hsl(var(--muted) / 0.5))' }}
          >
            <Flag className="w-8 h-8 text-muted-foreground" />
          </div>
          <div 
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center bg-card border-2 border-background"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Primary message */}
        <h3 className="text-xl font-bold text-foreground">
          No Tournaments Live Right Now
        </h3>

        {/* Countdown to next event */}
        {nextTournamentName && countdown && (
          <div className="flex flex-col items-center gap-1.5 max-w-[300px]">
            <p className="text-sm text-muted-foreground">Next up</p>
            <p className="text-base font-semibold text-foreground">{nextTournamentName}</p>
            <p className="text-sm text-muted-foreground">
              {countdown}
              {formattedDate && <> · {formattedDate}</>}
            </p>
          </div>
        )}

        {!nextTournamentName && (
          <p className="text-sm text-muted-foreground max-w-[280px]">
            No tournaments are in progress. Check back soon!
          </p>
        )}

        {/* CTA */}
        {onSwitchFilter && (
          <button
            onClick={() => onSwitchFilter('upcoming')}
            className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-card border border-border text-foreground transition-all active:scale-95 shadow-sm"
          >
            View Upcoming Schedule →
          </button>
        )}
      </div>
    );
  }

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
      {variant === 'no-results' && <Calendar className="w-8 h-8 text-muted-foreground/40" />}
      {variant === 'no-upcoming' && <Calendar className="w-8 h-8 text-muted-foreground/40" />}
      {variant === 'season-complete' && <Trophy className="w-8 h-8 text-muted-foreground/40" />}

      {/* Title */}
      <h4 className="text-lg font-semibold text-foreground">
        {variant === 'no-results' && (tourName ? `No ${tourName} Tournaments` : 'No Matches Found')}
        {variant === 'no-upcoming' && 'No Upcoming Tournaments'}
        {variant === 'season-complete' && 'Season Complete'}
      </h4>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground text-center max-w-[280px] mx-auto">
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
              className="text-[hsl(var(--accent-amber))] font-medium transition-colors active:opacity-70"
            >
              Overview →
            </Link>
          </>
        )}
      </p>

      {/* CTA */}
      {variant === 'no-results' && onResetTour && (
        <button
          onClick={() => onResetTour()}
          className="text-sm text-[hsl(var(--accent-amber))] font-medium transition-colors active:opacity-70"
        >
          View All Tours →
        </button>
      )}
    </div>
  );
}
