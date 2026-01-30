/**
 * TourSwitcher - Sticky horizontal logo strip with backdrop blur (Apple-grade)
 * Stays visible when scrolling, subtle glassmorphic effect
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
    <div className="sticky top-0 z-30 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center gap-5 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* All Tours pill */}
        <button
          onClick={() => onSelectTour('all')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
            isAllSelected 
              ? "bg-slate-900 text-white" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            isAllSelected ? "bg-emerald-400" : "bg-emerald-500"
          )} />
          All
          {hasAnyLive && isAllSelected && (
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
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
                "relative flex items-center transition-opacity flex-shrink-0",
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
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
