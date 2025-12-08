import * as React from 'react';
import { format } from 'date-fns';
import type { NextRoundPrediction } from '@/lib/mockHandicapData';

type Props = {
  prediction: NextRoundPrediction;
};

export const HandicapNextRoundPredictionCard: React.FC<Props> = ({
  prediction,
}) => {
  const {
    upcomingCourse,
    upcomingDate,
    currentIndex,
    threeRoundAverage,
    projectedIndexIfAverage,
    projectedIndexIfBest,
  } = prediction;

  const dateLabel = format(new Date(upcomingDate), 'd MMM yyyy');

  const dropIfAvg = currentIndex - projectedIndexIfAverage;
  const dropIfBest = currentIndex - projectedIndexIfBest;

  const dropLabel = dropIfAvg > 0 ? dropIfAvg.toFixed(1) : '0.0';
  const bestLabel = dropIfBest > 0 ? dropIfBest.toFixed(1) : '0.0';

  return (
    <section className="rounded-sq-lg bg-gradient-to-r from-emerald-50 via-sky-50 to-muted border border-border px-5 py-5">
      {/* Top row */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Next round projection
          </p>
          <p className="text-sm font-semibold text-foreground">
            {upcomingCourse}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {dateLabel} • powered by demo data
          </p>
        </div>

        <div className="rounded-sq-pill bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          England Golf WHS API
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        {/* Big projected index */}
        <div>
          <p className="text-xs text-muted-foreground">Projected index</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tabular-nums">
              {projectedIndexIfAverage.toFixed(1)}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              −{dropLabel} if you play to your 3-round average
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Current index{' '}
            <span className="font-medium text-foreground">
              {currentIndex.toFixed(1)}
            </span>{' '}
            • 3-round avg{' '}
            <span className="font-medium text-foreground">
              {threeRoundAverage.toFixed(1)}
            </span>
          </p>
        </div>

        {/* Best-case mini stack */}
        <div className="rounded-sq-md bg-background/80 px-4 py-3 text-right shadow-sm border border-border/50">
          <p className="text-xs font-semibold text-foreground">
            Best case tomorrow
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-700 tabular-nums">
            {projectedIndexIfBest.toFixed(1)}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700">
            −{bestLabel} if you beat your average
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground max-w-[180px] ml-auto">
            Final values calculated using official WHS rules via England Golf API
          </p>
        </div>
      </div>
    </section>
  );
};

export default HandicapNextRoundPredictionCard;
