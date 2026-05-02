import React from 'react';
import { format } from 'date-fns';
import { useCounters } from '@/lib/whs/hooks';

interface Props {
  connectionId: string;
}

export const CountersStrip: React.FC<Props> = ({ connectionId }) => {
  const { data: counters, isLoading: countersLoading } = useCounters(connectionId);

  if (!countersLoading && (!counters || counters.length === 0)) return null;

  return (
    <section className="mb-8">
      <div className="px-5 mb-1">
        <h3 className="text-[16px] font-bold text-foreground">Your 8 counting rounds</h3>
        <p className="text-[13px] text-muted-foreground">
          These are the rounds making up your current handicap
        </p>
      </div>
      <div
        className="flex gap-3 px-5 pt-3 pb-2 overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          willChange: 'transform',
        }}
      >
        {countersLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[120px] h-[110px] rounded-xl bg-muted/60 animate-pulse"
              />
            ))
          : counters?.map((c) => (
              <div
                key={c.id}
                className="flex-shrink-0 w-[120px] rounded-xl border p-3 bg-background"
                style={{
                  borderColor: 'rgba(15,23,42,0.08)',
                  scrollSnapAlign: 'start',
                  borderLeftWidth: 3,
                  borderLeftColor: '#10B981',
                }}
              >
                <p className="text-[24px] font-bold text-foreground tabular-nums leading-none mb-2">
                  {c.handicap_differential !== null && c.handicap_differential !== undefined
                    ? c.handicap_differential.toFixed(1)
                    : '—'}
                </p>
                <p className="text-[12px] text-foreground/80 truncate mb-1">
                  {c.course?.name ?? '—'}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {format(new Date(c.play_date), 'd MMM')}
                </p>
              </div>
            ))}
      </div>
    </section>
  );
};

export default CountersStrip;
