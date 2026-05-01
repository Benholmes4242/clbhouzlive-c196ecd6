import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useCounters } from '@/lib/whs/hooks';

interface Props {
  connectionId: string;
}

export const PredictionsCard: React.FC<Props> = ({ connectionId }) => {
  const { data: counters, isLoading } = useCounters(connectionId);

  const worst = useMemo(() => {
    if (!counters || counters.length === 0) return null;
    return [...counters]
      .filter((c) => c.handicap_differential !== null && c.handicap_differential !== undefined)
      .sort((a, b) => (b.handicap_differential ?? 0) - (a.handicap_differential ?? 0))[0] ?? null;
  }, [counters]);

  if (isLoading) {
    return (
      <section className="px-5 mb-6">
        <div className="rounded-2xl border p-4 animate-pulse" style={{ borderColor: 'rgba(15,23,42,0.08)' }}>
          <div className="h-3 w-32 bg-muted rounded mb-3" />
          <div className="h-4 w-48 bg-muted rounded mb-3" />
          <div className="h-10 bg-muted/50 rounded" />
        </div>
      </section>
    );
  }

  if (!counters || counters.length < 8 || !worst) return null;

  const sorted = [...counters].sort(
    (a, b) => (a.handicap_differential ?? 0) - (b.handicap_differential ?? 0)
  );

  return (
    <section className="px-5 mb-6">
      <div className="rounded-2xl border p-4 bg-background" style={{ borderColor: 'rgba(15,23,42,0.08)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground mb-1">
          Next Round Opportunity
        </p>
        <h3 className="text-[16px] font-bold text-foreground mb-2">Drop your worst counter</h3>
        <p className="text-[13px] text-foreground/85 leading-snug mb-3">
          Your worst counting round is{' '}
          <span className="font-bold tabular-nums">{worst.handicap_differential?.toFixed(1)}</span>{' '}
          at <span className="font-semibold">{worst.course?.name ?? 'a recent course'}</span> on{' '}
          {format(new Date(worst.play_date), 'd MMM')}. Beat that with your next 18 holes and your
          handicap will drop.
        </p>

        <div className="flex items-end gap-1.5">
          {sorted.map((c) => {
            const isWorst = c.id === worst.id;
            return (
              <div
                key={c.id}
                className="flex-1 px-1 py-1 rounded text-center text-[10px] font-semibold tabular-nums"
                style={
                  isWorst
                    ? {
                        background: 'rgba(220,38,38,0.08)',
                        color: '#B91C1C',
                        border: '1px solid rgba(220,38,38,0.4)',
                        animation: 'whs-pulse 2s ease-in-out infinite',
                      }
                    : {
                        background: 'rgba(15,23,42,0.05)',
                        color: '#0F172A',
                      }
                }
              >
                {c.handicap_differential?.toFixed(1) ?? '—'}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes whs-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      `}</style>
    </section>
  );
};

export default PredictionsCard;
