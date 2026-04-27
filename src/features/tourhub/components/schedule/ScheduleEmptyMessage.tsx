/**
 * ScheduleEmptyMessage - Premium empty states aligned with dispatch styling
 */

import { Link } from 'react-router-dom';
import { Calendar, Flag, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ScheduleEmptyMessageProps {
  variant: 'no-live' | 'no-results' | 'no-upcoming' | 'season-complete';
  nextTournamentName?: string;
  nextTournamentDate?: string;
  nextTournamentTour?: string; // tour label e.g. "Champions Tour"
  tourName?: string;
  onSwitchFilter?: (filter: string) => void;
  onResetTour?: () => void;
  className?: string;
}

function formatTeesOff(dateStr: string): string {
  const target = new Date(dateStr);
  return `Next event tees off ${format(target, 'EEEE, MMMM d')}.`;
}

export function ScheduleEmptyMessage({
  variant,
  nextTournamentName,
  nextTournamentDate,
  nextTournamentTour,
  tourName,
  onSwitchFilter,
  onResetTour,
  className,
}: ScheduleEmptyMessageProps) {

  const teesOffLine = nextTournamentDate ? formatTeesOff(nextTournamentDate) : null;

  if (variant === 'no-live') {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center",
          "py-16 px-6 mx-4 text-center",
          className
        )}
        style={{ paddingTop: 40, paddingBottom: 40 }}
      >
        <div className="relative">
          <Flag className="w-12 h-12 text-muted-foreground/30" />
          <div className="absolute -bottom-1 -right-2">
            <Clock className="w-5 h-5 text-muted-foreground/40" />
          </div>
        </div>

        <h3
          className="text-center"
          style={{ fontSize: 20, fontWeight: 900, marginTop: 16, color: '#0F172A', letterSpacing: '-0.5px' }}
        >
          Quiet on tour right now.
        </h3>

        {teesOffLine && (
          <p
            className="text-center max-w-[300px]"
            style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginTop: 12, lineHeight: 1.5 }}
          >
            {teesOffLine}
          </p>
        )}

        {nextTournamentName && (
          <p
            className="text-center max-w-[300px]"
            style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginTop: 6 }}
          >
            {nextTournamentName}
            {nextTournamentTour && (
              <span style={{ color: '#94A3B8', fontWeight: 600 }}> · {nextTournamentTour}</span>
            )}
          </p>
        )}

        {!nextTournamentName && (
          <p className="max-w-[280px]" style={{ fontSize: 13, fontWeight: 500, marginTop: 12, color: '#475569' }}>
            No tournaments are in progress. Check back soon!
          </p>
        )}

        {onSwitchFilter && (
          <button
            onClick={() => onSwitchFilter('upcoming')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '12px 24px',
              marginTop: 20,
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              color: '#0F172A',
              background: '#ffffff',
              border: '1px solid rgba(15,23,42,0.09)',
              boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
              cursor: 'pointer',
            }}
            className="active:scale-[0.97] transition-transform"
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
        "py-12 px-6 text-center",
        className
      )}
    >
      {variant === 'no-results' && <Calendar className="w-8 h-8 text-muted-foreground/40" />}
      {variant === 'no-upcoming' && <Calendar className="w-8 h-8 text-muted-foreground/40" />}
      {variant === 'season-complete' && <Trophy className="w-8 h-8 text-muted-foreground/40" />}

      <h4 className="text-lg font-semibold text-foreground">
        {variant === 'no-results' && (tourName ? `No ${tourName} Tournaments` : 'No Matches Found')}
        {variant === 'no-upcoming' && 'No Upcoming Tournaments'}
        {variant === 'season-complete' && 'Season Complete'}
      </h4>

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
