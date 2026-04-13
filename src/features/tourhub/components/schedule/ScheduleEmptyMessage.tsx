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
  tourName?: string;
  onSwitchFilter?: (filter: string) => void;
  onResetTour?: () => void;
  className?: string;
}

function formatCountdown(dateStr: string): string {
  const target = new Date(dateStr);
  return `Starts ${format(target, 'EEE, MMM d')}`;
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

  const countdown = nextTournamentDate ? formatCountdown(nextTournamentDate) : null;

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
        <div className="relative">
          <Flag className="w-12 h-12 text-muted-foreground/30" />
          <div className="absolute -bottom-1 -right-2">
            <Clock className="w-5 h-5 text-muted-foreground/40" />
          </div>
        </div>

        <h3 
          className="text-center"
          style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px', color: '#0F172A' }}
        >
          No Tournaments Live Right Now
        </h3>

        {nextTournamentName && countdown && (
          <div className="flex flex-col items-center max-w-[300px]" style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 400, color: '#94A3B8' }}>
              Next up
            </p>
            <p className="text-center" style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: '#0F172A' }}>
              {nextTournamentName}
            </p>
            <p style={{ fontSize: '13px', fontWeight: 400, marginTop: '2px', color: '#94A3B8' }}>
              {countdown}
            </p>
          </div>
        )}

        {!nextTournamentName && (
          <p className="max-w-[280px]" style={{ fontSize: '13px', fontWeight: 400, marginTop: '12px', color: '#94A3B8' }}>
            No tournaments are in progress. Check back soon!
          </p>
        )}

        {onSwitchFilter && (
          <button
            onClick={() => onSwitchFilter('upcoming')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '12px 24px',
              marginTop: '20px',
              borderRadius: '12px',
              fontSize: '13px',
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
