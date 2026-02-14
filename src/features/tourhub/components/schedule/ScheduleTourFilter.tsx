/**
 * ScheduleTourFilter - Scrollable tour filter pill bar
 * 
 * Features:
 * - Emoji-prefixed pills for 6 professional tours + "All Tours"
 * - Dynamic counts reflecting active status filter
 * - Semantic token styling (bg-foreground/text-background active, bg-muted inactive)
 * - Spring tap animation
 * - 44px minimum touch targets
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type TourFilterCode = 'all' | 'pga' | 'EURO' | 'LPGA' | 'CHAMP' | 'PGAD' | 'LIV';

interface TourOption {
  code: TourFilterCode;
  emoji: string;
  label: string;
}

const TOUR_OPTIONS: TourOption[] = [
  { code: 'all', emoji: '', label: 'All Tours' },
  { code: 'pga', emoji: '⛳', label: 'PGA Tour' },
  { code: 'EURO', emoji: '🇪🇺', label: 'DP World' },
  { code: 'LPGA', emoji: '', label: 'LPGA' },
  { code: 'CHAMP', emoji: '🏆', label: 'Champions' },
  { code: 'PGAD', emoji: '🌱', label: 'Korn Ferry' },
  { code: 'LIV', emoji: '⚡', label: 'LIV Golf' },
];

interface ScheduleTourFilterProps {
  activeTour: TourFilterCode;
  onTourChange: (tour: TourFilterCode) => void;
  /** Map of tour code → count (filtered by current status filter) */
  tourCounts: Record<string, number>;
}

export function ScheduleTourFilter({
  activeTour,
  onTourChange,
  tourCounts,
}: ScheduleTourFilterProps) {
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
            aria-label={`Show ${tour.label} tournaments`}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap',
              'text-xs font-semibold transition-colors duration-200',
              'min-h-[44px]',
              isActive
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {tour.emoji && <span>{tour.emoji}</span>}
            {tour.label}
            <span className={cn(
              'text-[10px] font-bold tabular-nums',
              isActive ? 'text-background/60' : 'text-muted-foreground/60'
            )}>
              {count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
