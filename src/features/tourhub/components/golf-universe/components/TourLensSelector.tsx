/**
 * TourLensSelector - Global tour reweighting system
 * Lens Options: Global, PGA, LPGA, LIV, DP World, Majors, Team
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Globe, Trophy, Users } from 'lucide-react';
import type { TourLens } from '../types';
import { TOUR_LENS_CONFIG } from '../hooks/useTourLens';

interface TourLensSelectorProps {
  activeLens: TourLens;
  onSelect: (lens: TourLens) => void;
  isTransitioning?: boolean;
}

const lensIcons: Record<TourLens, React.ReactNode> = {
  global: <Globe className="w-3.5 h-3.5" />,
  pga: null,
  lpga: null,
  liv: null,
  dpworld: null,
  majors: <Trophy className="w-3.5 h-3.5" />,
  team: <Users className="w-3.5 h-3.5" />,
};

export const TourLensSelector = memo(function TourLensSelector({
  activeLens,
  onSelect,
  isTransitioning = false,
}: TourLensSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide">
      {TOUR_LENS_CONFIG.map((lens) => {
        const isActive = lens.id === activeLens;
        const icon = lensIcons[lens.id];

        return (
          <motion.button
            key={lens.id}
            onClick={() => onSelect(lens.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
            whileTap={{ scale: 0.95 }}
            disabled={isTransitioning}
          >
            {icon}
            <span>{lens.shortLabel}</span>
            
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="lens-indicator"
                className="absolute inset-0 bg-slate-900 rounded-full -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
});
