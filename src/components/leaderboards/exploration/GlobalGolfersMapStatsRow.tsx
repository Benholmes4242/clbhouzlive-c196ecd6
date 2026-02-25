/**
 * GlobalGolfersMapStatsRow - Full-width Continents Achievement Banner
 * 
 * Single horizontal row: Globe icon | Label | Progress bar | Stat
 * Uses dynamic season color instead of hardcoded green.
 */

import { Globe } from 'lucide-react';
import { getSeasonGradient } from '@/lib/colorUtils';

interface GlobalGolfersMapStatsRowProps {
  continentsPlayed: number;
  continentsTotal?: number;
  countriesPlayed: number;
  viewMode: string;
  onViewModeChange: (mode: any) => void;
  seasonColor?: string;
}

export function GlobalGolfersMapStatsRow({
  continentsPlayed,
  continentsTotal = 6,
  seasonColor = '#006747',
}: GlobalGolfersMapStatsRowProps) {
  const progressPct = continentsTotal > 0 
    ? Math.max(0, Math.min(100, (continentsPlayed / continentsTotal) * 100)) 
    : 0;

  const gradient = getSeasonGradient(seasonColor);

  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: gradient.subtleTint,
        border: `1px solid ${gradient.tint}`,
      }}
    >
      {/* Globe icon */}
      <Globe size={18} style={{ color: seasonColor, flexShrink: 0 }} />

      {/* Label */}
      <span className="text-sm font-semibold text-foreground whitespace-nowrap">
        Continents Explored
      </span>

      {/* Progress bar — takes remaining space */}
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${gradient.dark}, ${gradient.light})`,
          }}
        />
      </div>

      {/* Stat */}
      <span className="text-sm font-bold whitespace-nowrap" style={{ color: seasonColor }}>
        {continentsPlayed} of {continentsTotal}
      </span>
    </div>
  );
}
