/**
 * PlayersTourFilter - Scrollable tour filter pills for the Players tab.
 * Active pill: dark bg with white text. Inactive: muted bg.
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type PlayerTourCode = 'all' | 'pga' | 'EURO' | 'PGAD' | 'LIV' | 'LPGA';

interface TourOption {
  code: PlayerTourCode;
  label: string;
}

const TOUR_OPTIONS: TourOption[] = [
  { code: 'all', label: 'All Tours' },
  { code: 'pga', label: 'PGA Tour' },
  { code: 'EURO', label: 'DP World' },
  { code: 'PGAD', label: 'Korn Ferry' },
  { code: 'LIV', label: 'LIV Golf' },
  { code: 'LPGA', label: 'LPGA' },
];

/** Map of tour code → display label */
export const TOUR_LABELS: Record<PlayerTourCode, string> = {
  all: 'All Tours',
  pga: 'PGA Tour',
  EURO: 'DP World Tour',
  PGAD: 'Korn Ferry Tour',
  LIV: 'LIV Golf',
  LPGA: 'LPGA Tour',
};

interface PlayersTourFilterProps {
  activeTour: PlayerTourCode;
  onTourChange: (tour: PlayerTourCode) => void;
  tourCounts: Record<string, number>;
}

export function PlayersTourFilter({
  activeTour,
  onTourChange,
  tourCounts,
}: PlayersTourFilterProps) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
      role="group"
      aria-label="Filter by tour"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {TOUR_OPTIONS.map((tour) => {
        const isActive = activeTour === tour.code;
        const count = tour.code === 'all'
          ? Object.values(tourCounts).reduce((sum, c) => sum + c, 0)
          : (tourCounts[tour.code] || 0);

        return (
          <motion.button
            key={tour.code}
            onClick={() => onTourChange(tour.code)}
            aria-pressed={isActive}
            aria-label={`Show ${tour.label} players`}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap',
              'text-xs font-semibold transition-colors duration-200',
              'min-h-[44px]',
              isActive
                ? 'bg-card text-foreground shadow-sm border border-border/40'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {tour.label}
            <span className={cn(
              'text-[10px] font-bold tabular-nums',
              isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'
            )}>
              {count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
