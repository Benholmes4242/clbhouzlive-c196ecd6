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
  countriesPlayed,
  seasonColor = '#006747',
}: GlobalGolfersMapStatsRowProps) {
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
        Countries Explored
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stat */}
      <span className="text-sm font-bold whitespace-nowrap" style={{ color: seasonColor }}>
        {countriesPlayed} {countriesPlayed === 1 ? 'Country' : 'Countries'}
      </span>
    </div>
  );
}
