/**
 * ScheduleTourFilter — Selector button + BottomSheet for tour filtering
 * Matches LeadersCategorySheet button pattern + MomentAudienceSheet tile styling
 */

import { useState, useCallback } from 'react';
import { ChevronDown, X, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AnimatedCheck } from '@/components/ui/AnimatedCheck';
import { motion } from 'framer-motion';

export type TourFilterCode = 'all' | 'pga' | 'EURO' | 'LPGA' | 'CHAMP' | 'PGAD' | 'LIV';

interface TourOption {
  code: TourFilterCode;
  label: string;
  description: string;
}

const TOUR_OPTIONS: TourOption[] = [
  { code: 'all', label: 'All Tours', description: 'Show events from every tour' },
  { code: 'pga', label: 'PGA Tour', description: 'PGA Tour events' },
  { code: 'EURO', label: 'DP World', description: 'DP World Tour events' },
  { code: 'LPGA', label: 'LPGA', description: 'LPGA Tour events' },
  { code: 'CHAMP', label: 'Champions', description: 'PGA Champions Tour events' },
  { code: 'PGAD', label: 'Korn Ferry', description: 'Korn Ferry Tour events' },
  { code: 'LIV', label: 'LIV Golf', description: 'LIV Golf events' },
];

interface ScheduleTourFilterProps {
  activeTour: TourFilterCode;
  onTourChange: (tour: TourFilterCode) => void;
  tourCounts: Record<string, number>;
}

export function ScheduleTourFilter({
  activeTour,
  onTourChange,
  tourCounts,
}: ScheduleTourFilterProps) {
  const [open, setOpen] = useState(false);

  const activeTourOption = TOUR_OPTIONS.find((t) => t.code === activeTour) || TOUR_OPTIONS[0];
  const totalCount = Object.values(tourCounts).reduce((sum, c) => sum + c, 0);

  const handleSelect = useCallback(
    (code: TourFilterCode) => {
      onTourChange(code);
      setOpen(false);
    },
    [onTourChange]
  );

  return (
    <>
      {/* Selector Button — matches LeadersCategorySheet */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full flex items-center justify-between',
          'bg-card border border-border/50 rounded-[14px]',
          'px-4 py-3.5',
          'shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
          'transition-all duration-200',
          'hover:border-[hsl(var(--accent-amber))] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
          'active:scale-[0.99]'
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{activeTourOption.label}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
            Schedule
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Bottom Sheet — MomentAudienceSheet tile styling */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabelledBy="schedule-tour-sheet-title"
      >
        <div
          className="overflow-y-auto overscroll-contain px-4 pb-4"
          style={{ maxHeight: 'calc(70vh - 60px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              id="schedule-tour-sheet-title"
              className="text-lg font-bold text-foreground"
            >
              Filter by Tour
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Tour options — audience sheet tile style */}
          <div className="space-y-1.5">
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
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-xl transition-all',
                    isActive
                      ? 'bg-[#f8fafc] border border-[#e2e8f0]'
                      : 'bg-[#f8fafc] border border-transparent hover:border-[#e2e8f0]'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold tabular-nums',
                      isActive ? 'bg-[#1e293b] text-white' : 'bg-white text-muted-foreground'
                    )}
                  >
                    {count}
                  </div>

                  <div className="flex-1 text-left">
                    <p
                      className={cn(
                        'font-medium text-[13px]',
                        isActive ? 'text-[#1e293b]' : 'text-[#64748b]'
                      )}
                    >
                      {tour.label}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] mt-0.5',
                        isActive ? 'text-[#64748b]' : 'text-[#94a3b8]'
                      )}
                    >
                      {tour.description}
                    </p>
                  </div>

                  {isActive && <AnimatedCheck color="#1e293b" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Safe area bottom padding */}
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </BottomSheet>
    </>
  );
}
