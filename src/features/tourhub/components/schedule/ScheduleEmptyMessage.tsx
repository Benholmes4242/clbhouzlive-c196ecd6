/**
 * ScheduleEmptyMessage - Premium empty states aligned with Tour Overview audit
 */

import { Link } from 'react-router-dom';
import { Calendar, Flag, Trophy, Clock } from 'lucide-react';
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

function formatCountdown(dateStr: string): string {
  const target = new Date(dateStr);
  return `starts ${format(target, 'EEE, MMM d')}`;
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
          "flex flex-col items-center justify-center",
          "py-16 px-6 mx-4 text-center",
          className
        )}
        style={{ paddingTop: '40px', paddingBottom: '40px' }}
      >
        {/* Icon cluster */}
        <div className="relative">
          <Flag className="w-12 h-12 text-muted-foreground/30" />
          <div className="absolute -bottom-1 -right-2">
            <Clock className="w-5 h-5 text-muted-foreground/40" />
          </div>
        </div>

        {/* Primary message */}
        <h3 
          className="text-foreground text-center"
          style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px' }}
        >
          No Tournaments Live Right Now
        </h3>

        {/* Countdown to next event */}
        {nextTournamentName && countdown && (
          <div className="flex flex-col items-center max-w-[300px]" style={{ marginTop: '24px' }}>
            <p className="text-muted-foreground" style={{ fontSize: '13px', fontWeight: 400 }}>
              Next up
            </p>
            <p className="text-foreground text-center" style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>
              {nextTournamentName}
            </p>
            <p className="text-muted-foreground" style={{ fontSize: '13px', fontWeight: 400, marginTop: '2px' }}>
              {countdown}
            </p>
          </div>
        )}

        {!nextTournamentName && (
          <p className="text-muted-foreground max-w-[280px]" style={{ fontSize: '13px', fontWeight: 400, marginTop: '12px' }}>
            No tournaments are in progress. Check back soon!
          </p>
        )}

        {/* CTA */}
        {onSwitchFilter && (
          <button
            onClick={() => onSwitchFilter('upcoming')}
            className="rounded-xl text-foreground border border-border/60 transition-all active:scale-95"
            style={{ fontSize: '14px', fontWeight: 600, padding: '12px 24px', marginTop: '20px' }}
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
