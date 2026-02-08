/**
 * GlobalGolfersMapStatsRow - Two-card progress UI that doubles as toggle
 * 
 * Left card: Continents progress with visual bar (tappable)
 * Right card: Countries explored count (tappable)
 * Cards function as the metric toggle - no separate pill needed
 */

import { cn } from '@/lib/utils';
import type { ExplorationMetric } from '@/types/leaderboards';

interface GlobalGolfersMapStatsRowProps {
  continentsPlayed: number;
  continentsTotal?: number;
  countriesPlayed: number;
  viewMode: ExplorationMetric;
  onViewModeChange: (mode: ExplorationMetric) => void;
}

export function GlobalGolfersMapStatsRow({
  continentsPlayed,
  continentsTotal = 6,
  countriesPlayed,
  viewMode,
  onViewModeChange,
}: GlobalGolfersMapStatsRowProps) {
  const progress = continentsTotal > 0 ? continentsPlayed / continentsTotal : 0;
  const progressPct = Math.max(0, Math.min(100, progress * 100));

  const isCountriesActive = viewMode === 'countries';
  const isContinentsActive = viewMode === 'continents';

  return (
    <div className="mt-3 px-4 grid grid-cols-2 gap-3">
      {/* Continents Card - Tappable */}
      <button
        onClick={() => onViewModeChange('continents')}
        aria-pressed={isContinentsActive}
        aria-label="View continents progress"
        className={cn(
          "rounded-2xl px-4 py-3 text-left transition-all duration-200",
          "active:scale-[0.98] cursor-pointer",
          isContinentsActive
            ? "bg-card border-2 border-[#8B9D77] shadow-md"
            : "bg-card/80 border border-border/50 shadow-sm"
        )}
      >
        <div className="text-sm font-semibold text-foreground">Continents</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {continentsPlayed} of {continentsTotal} completed
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#8B9D77] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </button>

      {/* Countries Card - Tappable */}
      <button
        onClick={() => onViewModeChange('countries')}
        aria-pressed={isCountriesActive}
        aria-label="View countries progress"
        className={cn(
          "rounded-2xl px-4 py-3 text-left transition-all duration-200",
          "active:scale-[0.98] cursor-pointer",
          isCountriesActive
            ? "bg-card border-2 border-[#8B9D77] shadow-md"
            : "bg-card/80 border border-border/50 shadow-sm"
        )}
      >
        <div className="text-sm font-semibold text-foreground">Countries</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {countriesPlayed} explored
        </div>
      </button>
    </div>
  );
}
