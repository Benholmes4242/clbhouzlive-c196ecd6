/**
 * SeasonToggle - Year Selection Component
 * 
 * Features:
 * - Compact inline display
 * - Animated selection indicator
 * - Matches slate design language
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { AvailableSeason } from '@/features/tourhub/hooks/useSeasonLeaderboards';

interface SeasonToggleProps {
  availableSeasons: AvailableSeason[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export const SeasonToggle = memo(function SeasonToggle({
  availableSeasons,
  selectedYear,
  onYearChange,
}: SeasonToggleProps) {
  // Don't render if only one season available
  if (availableSeasons.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-full p-0.5">
      {availableSeasons.map((season) => {
        const isSelected = season.year === selectedYear;

        return (
          <button
            key={season.id}
            onClick={() => onYearChange(season.year)}
            className="relative px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors duration-200"
            style={{
              color: isSelected ? 'white' : '#64748b',
            }}
          >
            {isSelected && (
              <motion.div
                layoutId="season-toggle-indicator"
                className="absolute inset-0 bg-slate-700 rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{season.year}</span>
          </button>
        );
      })}
    </div>
  );
});
