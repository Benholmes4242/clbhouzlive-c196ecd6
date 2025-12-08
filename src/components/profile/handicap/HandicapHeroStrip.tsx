import React from 'react';
import { TrendingDown } from 'lucide-react';

interface HandicapHeroStripProps {
  currentIndex: number;
  lastUpdated: string;
  yearDelta?: number;
}

const HandicapHeroStrip: React.FC<HandicapHeroStripProps> = ({
  currentIndex,
  lastUpdated,
  yearDelta = -2.3,
}) => {
  const isImproving = yearDelta < 0;

  return (
    <section className="flex items-start justify-between gap-4 px-1">
      {/* Left: Current handicap */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Handicap Index
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-foreground tabular-nums">
            {currentIndex.toFixed(1)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdated}
        </span>
      </div>

      {/* Right: Trend + confidence */}
      <div className="text-right flex flex-col items-end gap-1 pt-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Last 12 months
        </span>
        <div className="flex items-center gap-1.5">
          {isImproving && <TrendingDown className="h-4 w-4 text-emerald-600" />}
          <span className={`text-sm font-semibold ${isImproving ? 'text-emerald-600' : 'text-red-500'}`}>
            {yearDelta > 0 ? '+' : ''}{yearDelta.toFixed(1)} over 12 months
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {isImproving ? 'Playing your best golf this year' : 'Room for improvement'}
        </span>
      </div>
    </section>
  );
};

export default HandicapHeroStrip;
