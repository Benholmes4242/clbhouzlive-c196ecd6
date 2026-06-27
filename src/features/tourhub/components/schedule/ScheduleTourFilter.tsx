/**
 * ScheduleTourFilter — Selector button + BottomSheet for tour filtering
 * Aligned with Tour Overview audit specs
 */

import { useState, useCallback } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { getTourLogo, hasTourLogo } from '../../utils/tourLogos';
import { AMBER_TINT_04, INK_TINT_06, INK_TINT_07 } from '../../_shared/tokens';

export type TourFilterCode = 'all' | 'pga' | 'EURO' | 'LPGA' | 'CHAMP' | 'PGAD' | 'LIV';

interface TourOption {
  code: TourFilterCode;
  label: string;
  description: string;
}

const TOUR_OPTIONS: TourOption[] = [
  { code: 'all', label: 'All Tours', description: 'Show events from every tour' },
  { code: 'pga', label: 'PGA Tour', description: 'PGA Tour events' },
  { code: 'EURO', label: 'DP World Tour', description: 'DP World Tour events' },
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
      {/* Selector Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full flex items-center justify-between',
          'bg-card border border-border/50 rounded-2xl',
          'px-4 py-3',
          'transition-all duration-200',
          'active:scale-[0.99]'
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          {activeTour !== 'all' && hasTourLogo(activeTour.toLowerCase()) ? (
            <img
              src={getTourLogo(activeTour.toLowerCase())}
              alt={activeTourOption.label}
              className="object-contain flex-shrink-0"
              style={{ width: 28, height: 20 }}
            />
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground">
              All Tours
            </span>
          )}
          <span className="text-sm font-semibold text-foreground">{activeTourOption.label}</span>
          {activeTour !== 'all' && (
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
              · {tourCounts[activeTour] ?? 0}
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground opacity-60" />
      </button>

      {/* Bottom Sheet */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabelledBy="schedule-tour-sheet-title"
      >
        {/* Header */}
        <SheetHeader
          eyebrow="FILTER"
          title={<span id="schedule-tour-sheet-title">Select tour</span>}
          onClose={() => setOpen(false)}
        />

        {/* Flat option rows */}
        <div>
          {TOUR_OPTIONS.filter(tour => tour.code === 'all' || (tourCounts[tour.code] ?? 0) > 0).map((tour) => {
            const isActive = activeTour === tour.code;
            const count = tour.code === 'all' ? totalCount : (tourCounts[tour.code] || 0);

            return (
              <button
                key={tour.code}
                onClick={() => handleSelect(tour.code)}
                aria-pressed={isActive}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  background: isActive ? AMBER_TINT_04 : 'transparent',
                  border: 'none',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  cursor: 'pointer', textAlign: 'left' as const,
                }}
              >
                {/* Tour logo chip */}
                <div style={{ width: 36, height: 22, borderRadius: 4, background: INK_TINT_06, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {tour.code === 'all'
                    ? <Globe className="w-4 h-4" style={{ color: '#94A3B8' }} />
                    : <img src={getTourLogo(tour.code.toLowerCase())} alt="" style={{ width: 28, height: 18, objectFit: 'contain' }} />
                  }
                </div>

                {/* Label + description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: isActive ? 700 : 500, color: '#0F172A' }}>{tour.label}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{tour.description}</div>
                </div>

                {/* Count */}
                <span style={{ fontSize: 13, color: '#94A3B8', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{count}</span>

                {/* Active dot */}
                {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F7931E', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
      </BottomSheet>
    </>
  );
}
