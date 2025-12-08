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
    <section className="rounded-sq-lg bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50/30 border border-emerald-200/60 shadow-sm overflow-hidden">
      {/* Top row */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Next round projection
          </p>
          <p className="text-base font-semibold text-foreground">
            {upcomingCourse}
          </p>
          <p className="text-xs text-muted-foreground">
            {dateLabel} · powered by demo data
          </p>
        </div>

        {/* England Golf API pill - same style as HCP pill on profile */}
        <div className="rounded-sq-pill bg-background/80 border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          England Golf WHS API
        </div>
      </div>

      {/* Main content */}
      <div className="px-5 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Big projected index */}
          <div>
            <p className="text-xs text-muted-foreground">Projected index</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground tabular-nums">
                {projectedIndexIfAverage.toFixed(1)}
              </span>
              <span className="text-sm text-emerald-600 font-medium">
                −{dropLabel} if you play to your 3-round average
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Current index{' '}
              <span className="font-medium text-foreground">
                {currentIndex.toFixed(1)}
              </span>{' '}
              · 3-round avg{' '}
              <span className="font-medium text-foreground">
                {threeRoundAverage.toFixed(1)}
              </span>
            </p>
          </div>

          {/* Best-case mini stack */}
          <div className="rounded-sq-md bg-background/90 border border-border/60 px-5 py-4 text-right shadow-sm">
            <p className="text-xs font-semibold text-foreground">
              Best case tomorrow
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
              {projectedIndexIfBest.toFixed(1)}
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              −{bestLabel} if you beat your average
            </p>
          </div>
        </div>
        
        {/* Fine print */}
        <p className="mt-4 text-[10px] text-muted-foreground text-center">
          Final values calculated using official WHS rules via England Golf API
        </p>
      </div>
    </section>
  );
};

export default HandicapNextRoundPredictionCard;
