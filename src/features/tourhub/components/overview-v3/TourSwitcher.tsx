/**
 * TourSwitcher - Horizontal scrolling tour pills with live indicators
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TOUR_CONFIG, type TourId, useTournamentsByTour } from '../../hooks/useOverviewData';

interface TourSwitcherProps {
  selectedTour: TourId | 'all';
  onSelectTour: (tour: TourId | 'all') => void;
}

export function TourSwitcher({ selectedTour, onSelectTour }: TourSwitcherProps) {
  const { data: tourStats } = useTournamentsByTour();

  // Check which tours have live events
  const liveToursSet = new Set<TourId>();
  (tourStats || []).forEach(stats => {
    if (stats.liveCount > 0) {
      liveToursSet.add(stats.tourSlug);
    }
  });

  const hasAnyLive = liveToursSet.size > 0;

  const tours: Array<{ id: TourId | 'all'; name: string; emoji: string; hasLive: boolean }> = [
    { id: 'all', name: 'All Tours', emoji: '🌐', hasLive: hasAnyLive },
    ...Object.entries(TOUR_CONFIG).map(([id, config]) => ({
      id: id as TourId,
      name: config.name,
      emoji: config.emoji,
      hasLive: liveToursSet.has(id as TourId),
    })),
  ];

  return (
    <div className="relative px-4 py-4 bg-[#F8FAFC]">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tours.map((tour) => {
          const isSelected = selectedTour === tour.id;
          
          return (
            <motion.button
              key={tour.id}
              onClick={() => onSelectTour(tour.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all",
                isSelected
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              <span>{tour.emoji}</span>
              <span>{tour.name}</span>
              
              {/* Live indicator */}
              {tour.hasLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
