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
          '',
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
          className="overflow-y-auto overscroll-contain px-4 pb-2"
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
          <div className="space-y-2" role="listbox" aria-label="Filter by Tour">
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
                  className="w-full flex items-center gap-3 text-left transition-all duration-150"
                  style={{
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: isActive
                      ? '1px solid hsl(var(--foreground))'
                      : '1px solid hsl(var(--border) / 0.5)',
                    background: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--card))',
                  }}
                >
                  <div
                    className="w-9 rounded-[34%] aspect-[1/1.05] flex items-center justify-center text-xs font-bold tabular-nums"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'hsl(var(--muted))',
                      color: isActive ? 'white' : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {count}
                  </div>

                  <div className="flex-1">
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'white' : 'hsl(var(--foreground))',
                      }}
                    >
                      {tour.label}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        marginTop: 2,
                        color: isActive ? 'rgba(255,255,255,0.7)' : 'hsl(var(--muted-foreground) / 0.7)',
                      }}
                    >
                      {tour.description}
                    </p>
                  </div>

                  {isActive && <AnimatedCheck color="white" />}
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
