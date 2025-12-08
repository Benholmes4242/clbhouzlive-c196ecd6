import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

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
    <div className="flex items-start justify-between gap-4">
      {/* Left: Current handicap */}
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Handicap Index
        </span>
        <span className="text-5xl font-bold text-foreground tabular-nums mt-1">
          {currentIndex.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground mt-1.5">
          Updated {lastUpdated}
        </span>
      </div>

      {/* Right: Trend + confidence */}
      <div className="text-right flex flex-col items-end pt-0.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Last 12 months
        </span>
        <div className="flex items-center gap-1.5 mt-1.5">
          {isImproving ? (
            <TrendingDown className="h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingUp className="h-4 w-4 text-destructive" />
          )}
          <span className={`text-base font-semibold ${isImproving ? 'text-emerald-600' : 'text-destructive'}`}>
            {yearDelta > 0 ? '+' : ''}{yearDelta.toFixed(1)} over 12 months
          </span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {isImproving ? 'Playing your best golf this year' : 'Room for improvement'}
        </span>
      </div>
    </div>
  );
};

export default HandicapHeroStrip;
