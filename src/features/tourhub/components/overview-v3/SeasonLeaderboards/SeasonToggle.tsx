// src/features/tourhub/components/overview-v3/SeasonLeaderboards/SeasonToggle.tsx

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
    <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
      {availableSeasons.map((season) => {
        const isSelected = season.year === selectedYear;

        return (
          <button
            key={season.id}
            onClick={() => onYearChange(season.year)}
            className={`
              relative px-3 py-1.5 rounded-full text-sm font-medium
              transition-colors duration-200
              ${isSelected ? 'text-white' : 'text-gray-600 hover:text-gray-900'}
            `}
          >
            {isSelected && (
              <motion.div
                layoutId="season-toggle-indicator"
                className="absolute inset-0 bg-gray-900 rounded-full"
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
