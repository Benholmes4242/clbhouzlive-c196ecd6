/**
 * Games Filters Component
 * Filter pills for When/Distance/Sort and selected club display
 */
import React from 'react';
import { haptic } from '@/utils/haptics';
import { openWhenSheet, openDistanceSheet, openSortSheet, labelWhen } from '@/features/nearby/components/FilterSheets';
import type { GolfCourse } from '@/features/nearby/hooks/useCourseSearch';
import type { useGameFilters } from '@/features/nearby/hooks/useGameFilters';

interface GamesFiltersProps {
  filters: ReturnType<typeof useGameFilters>;
  selectedClub: GolfCourse | null;
  onClearClub: () => void;
}

const pillBase =
  'inline-flex items-center gap-1 rounded-[999px] border border-[color:var(--hub-stroke-subtle)] bg-[color:var(--hub-glass-bg-subtle)] px-3 py-1.5 text-[12px] text-[color:var(--hub-text-muted)] active:scale-[0.97] transition-transform duration-120';

export function GamesFilters({ filters, selectedClub, onClearClub }: GamesFiltersProps) {
  const whenLabel = filters.when ? labelWhen(filters.when) : 'When';
  const distanceLabel = filters.distanceKm ? `${filters.distanceKm}km` : 'Distance';

  const handleWhenClick = () => {
    haptic('light');
    openWhenSheet(filters);
  };

  const handleDistanceClick = () => {
    haptic('light');
    openDistanceSheet(filters);
  };

  const handleSortClick = () => {
    haptic('light');
    openSortSheet(filters);
  };

  return (
    <>
      {/* Filter Pills */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleWhenClick} className={pillBase}>
          <span className="text-[14px]">📅</span>
          <span>{whenLabel}</span>
        </button>

        <button type="button" onClick={handleDistanceClick} className={pillBase}>
          <span className="text-[14px]">📍</span>
          <span>{distanceLabel}</span>
        </button>

        <button type="button" onClick={handleSortClick} className={pillBase}>
          <span className="text-[14px]">⇅</span>
          <span>{filters.sortLabel}</span>
        </button>
      </div>

      {/* Selected Club Pill */}
      {selectedClub && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-[999px] bg-black/65 border border-[color:var(--hub-stroke-subtle)] px-3 py-1.5 text-[12px] text-[color:var(--hub-text-bright)] shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
            <span className="truncate">
              Viewing games at <span className="font-semibold">{selectedClub.name}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                haptic('light');
                onClearClub();
              }}
              className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/6"
            >
              <span className="absolute inset-0 flex items-center justify-center text-[13px] leading-none">
                ×
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
