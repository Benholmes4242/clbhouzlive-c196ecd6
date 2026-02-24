/**
 * GlobalGolfersMapStatsRow - Full-width Continents Achievement Banner
 * 
 * Single horizontal row: Globe icon | Label | Progress bar | Stat
 * No card wrapper — sits directly on page background with green-tinted container
 */

import { Globe } from 'lucide-react';

interface GlobalGolfersMapStatsRowProps {
  continentsPlayed: number;
  continentsTotal?: number;
  countriesPlayed: number;
  viewMode: string;
  onViewModeChange: (mode: any) => void;
}

export function GlobalGolfersMapStatsRow({
  continentsPlayed,
  continentsTotal = 6,
}: GlobalGolfersMapStatsRowProps) {
  const progressPct = continentsTotal > 0 
    ? Math.max(0, Math.min(100, (continentsPlayed / continentsTotal) * 100)) 
    : 0;

  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: 'rgba(82, 183, 136, 0.06)',
        border: '1px solid rgba(82, 183, 136, 0.12)',
      }}
    >
      {/* Globe icon */}
      <Globe size={18} style={{ color: '#40916C', flexShrink: 0 }} />

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
            background: 'linear-gradient(90deg, #2D6A4F, #52B788)',
          }}
        />
      </div>

      {/* Stat */}
      <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#40916C' }}>
        {continentsPlayed} of {continentsTotal}
      </span>
    </div>
  );
}
