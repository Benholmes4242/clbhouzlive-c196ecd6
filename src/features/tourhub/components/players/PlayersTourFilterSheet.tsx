/**
 * PlayersTourFilterSheet — Selector button + BottomSheet for tour filtering
 * Aligned with Schedule page ScheduleTourFilter styling.
 */

import { useState, useCallback } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AnimatedCheck } from '@/components/ui/AnimatedCheck';
import { motion } from 'framer-motion';
import type { PlayerTourCode } from './PlayersTourFilter';

interface TourOption {
  code: PlayerTourCode;
  label: string;
  description: string;
}

const TOUR_OPTIONS: TourOption[] = [
  { code: 'all', label: 'All Tours', description: 'Show players from every tour' },
  { code: 'pga', label: 'PGA Tour', description: 'PGA Tour players' },
  { code: 'EURO', label: 'DP World Tour', description: 'DP World Tour players' },
  { code: 'LPGA', label: 'LPGA', description: 'LPGA Tour players' },
  { code: 'PGAD', label: 'Korn Ferry', description: 'Korn Ferry Tour players' },
  { code: 'LIV', label: 'LIV Golf', description: 'LIV Golf players' },
];

interface PlayersTourFilterSheetProps {
  activeTour: PlayerTourCode;
  onTourChange: (tour: PlayerTourCode) => void;
  tourCounts: Record<string, number>;
}

export function PlayersTourFilterSheet({
  activeTour,
  onTourChange,
  tourCounts,
}: PlayersTourFilterSheetProps) {
  const [open, setOpen] = useState(false);

  const activeTourOption = TOUR_OPTIONS.find((t) => t.code === activeTour) || TOUR_OPTIONS[0];
  const totalCount = Object.values(tourCounts).reduce((sum, c) => sum + c, 0);

  const handleSelect = useCallback(
    (code: PlayerTourCode) => {
      onTourChange(code);
      setOpen(false);
    },
    [onTourChange]
  );

  return (
    <>
      {/* Selector Button — matches Schedule page */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full flex items-center justify-between',
          'bg-card border border-border/50 rounded-2xl',
          'px-4 py-3',
          'shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
          'transition-all duration-200',
          'active:scale-[0.99]'
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{activeTourOption.label}</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground">
            Players
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground opacity-60" />
      </button>

      {/* Bottom Sheet */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabelledBy="players-tour-sheet-title"
      >
        <div
          className="overflow-y-auto overscroll-contain px-4 pb-4"
          style={{ maxHeight: 'calc(70vh - 60px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              id="players-tour-sheet-title"
              className="text-lg font-bold text-foreground"
            >
              Filter by Tour
            </h2>
          </div>

          {/* Tour options */}
          <div className="space-y-1.5" role="listbox" aria-label="Filter by Tour">
            {TOUR_OPTIONS.map((tour) => {
              const isActive = activeTour === tour.code;
              const count = tour.code === 'all'
                ? totalCount
                : (tourCounts[tour.code] || 0);

              return (
                <motion.button
                  key={tour.code}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(tour.code)}
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-xl transition-all',
                    isActive
                      ? 'bg-muted border border-border'
                      : 'bg-muted/50 border border-transparent hover:border-border'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold tabular-nums',
                      isActive ? 'bg-foreground text-background' : 'bg-card text-muted-foreground'
                    )}
                  >
                    {count}
                  </div>

                  <div className="flex-1 text-left">
                    <p
                      className={cn(
                        'font-medium text-[13px]',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {tour.label}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] mt-0.5',
                        isActive ? 'text-muted-foreground' : 'text-muted-foreground/70'
                      )}
                    >
                      {tour.description}
                    </p>
                  </div>

                  {isActive && <AnimatedCheck color="hsl(var(--foreground))" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </BottomSheet>
    </>
  );
}
