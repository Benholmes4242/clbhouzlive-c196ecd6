/**
 * TourSwitcher - Clean horizontal logo strip (Apple-grade)
 * No pills, just logos with opacity-based selection
 */

import { cn } from '@/lib/utils';
import { TOUR_CONFIG, type TourId, useTournamentsByTour } from '../../hooks/useOverviewData';
import { getTourLogo } from '../../utils/tourLogos';

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

  const tours: Array<{ id: TourId; name: string; hasLive: boolean }> = 
    Object.entries(TOUR_CONFIG).map(([id, config]) => ({
      id: id as TourId,
      name: config.name,
      hasLive: liveToursSet.has(id as TourId),
    }));

  const isAllSelected = selectedTour === 'all';

  return (
    <div className="px-4 py-4 bg-[#F8FAFC]">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-1">
        {/* All Tours - Text only */}
        <button
          onClick={() => onSelectTour('all')}
          className={cn(
            "flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-all",
            isAllSelected ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <span className={cn(
            "w-2 h-2 rounded-full transition-all",
            isAllSelected ? "bg-emerald-500" : "bg-transparent"
          )} />
          All
          {hasAnyLive && isAllSelected && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Tour Logos */}
        {tours.map((tour) => {
          const isSelected = selectedTour === tour.id;
          
          return (
            <button
              key={tour.id}
              onClick={() => onSelectTour(tour.id)}
              className={cn(
                "relative flex items-center transition-all flex-shrink-0",
                isSelected ? "opacity-100" : "opacity-40 hover:opacity-70"
              )}
            >
              <img 
                src={getTourLogo(tour.id)}
                alt={tour.name}
                className="h-6 w-auto object-contain"
                onError={(e) => {
                  // Fallback to text if logo fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const span = document.createElement('span');
                    span.className = 'text-sm font-semibold text-slate-600';
                    span.textContent = tour.name;
                    parent.appendChild(span);
                  }
                }}
              />
              
              {/* Live indicator */}
              {tour.hasLive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
