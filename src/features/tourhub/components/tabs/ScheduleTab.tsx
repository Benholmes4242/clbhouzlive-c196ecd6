/**
 * ScheduleTab - Cinematic Schedule Experience (A* Redesign)
 * 
 * Features:
 * - Dynamic hero: LIVE carousel / Next Up / Recent Winner
 * - Tour filter pills (6 tours + All)
 * - Batch course image resolution (1 query, not 366)
 * - Sticky filter toolbar (status + tour)
 * - URL-persisted filters (?filter=live&tour=pga)
 * - Debounced search with tour name matching
 * - InView entrance animations per card
 * - Live count on filter pill
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Import schedule components
import {
  ScheduleFilterPills,
  type ScheduleFilterType,
  ScheduleTournamentCard,
  ScheduleMonthHeader,
  ScheduleEmptyMessage,
  ScheduleHeroCard,
  getFeaturedTournament,
  ScheduleTourFilter,
  type TourFilterCode,
} from '../schedule';

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  tournaments: TourTournament[];
}

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// InView card wrapper for staggered entrance
function InViewCard({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

export function ScheduleTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasScrolledToNow, setHasScrolledToNow] = useState(false);
  const heroScrollRef = useRef<HTMLDivElement>(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  
  // Filters from URL params
  const filter = (searchParams.get('filter') as ScheduleFilterType) || 'all';
  const activeTour = (searchParams.get('tour') as TourFilterCode) || 'all';
  
  const setFilter = useCallback((f: ScheduleFilterType) => {
    const params = new URLSearchParams(searchParams);
    if (f === 'all') { params.delete('filter'); } else { params.set('filter', f); }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const setActiveTour = useCallback((t: TourFilterCode) => {
    const params = new URLSearchParams(searchParams);
    if (t === 'all') { params.delete('tour'); } else { params.set('tour', t); }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Debounce search
  const search = useDebouncedValue(searchInput, 200);
  
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);

  // Batch course images (replaces 366 individual queries)
  const { data: batchImages } = useBatchCourseImages(tournaments);

  // Collect live + completed tournament IDs for leader/winner fetch
  const { liveIds, completedIds } = useMemo(() => {
    if (!tournaments) return { liveIds: [] as string[], completedIds: [] as string[] };
    return {
      liveIds: tournaments.filter(t => t.status === 'inprogress').map(t => t.id),
      completedIds: tournaments.filter(t => t.status === 'closed').map(t => t.id),
    };
  }, [tournaments]);

  const { data: leadersWinnersMap } = useTournamentLeadersWinners([...liveIds, ...completedIds]);

  // Dynamic hero: context-aware based on active status filter
  const heroItems = useMemo(() => {
    if (!tournaments) return [];
    
    // For completed filter: show most recent completed
    if (filter === 'completed') {
      const completed = tournaments
        .filter(t => t.status === 'closed')
        .filter(t => activeTour === 'all' || t.tour_code === activeTour)
        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
      return completed.length > 0 
        ? [{ tournament: completed[0], type: 'recent' as const }] 
        : [];
    }

    // For live filter: show all live events as carousel
    if (filter === 'live') {
      return tournaments
        .filter(t => t.status === 'inprogress')
        .filter(t => activeTour === 'all' || t.tour_code === activeTour)
        .map(t => ({ tournament: t, type: 'live' as const }));
    }

    // Default: prioritize live (carousel), then upcoming, then recent
    const liveTournaments = tournaments
      .filter(t => t.status === 'inprogress')
      .filter(t => activeTour === 'all' || t.tour_code === activeTour);
    if (liveTournaments.length > 0) {
      return liveTournaments.map(t => ({ tournament: t, type: 'live' as const }));
    }

    // Next upcoming
    const featured = getFeaturedTournament(
      activeTour === 'all' ? tournaments : tournaments.filter(t => t.tour_code === activeTour)
    );
    return featured ? [featured] : [];
  }, [tournaments, filter, activeTour]);

  // Hero carousel scroll tracking
  useEffect(() => {
    const container = heroScrollRef.current;
    if (!container || heroItems.length <= 1) return;
    
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const index = Math.round(scrollLeft / itemWidth);
      setActiveHeroIndex(index);
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [heroItems.length]);

  // Filter stats for pills
  const filterStats = useMemo(() => {
    if (!tournaments) return { all: 0, live: 0, upcoming: 0, completed: 0 };
    
    const now = new Date();
    const tourFiltered = activeTour === 'all' 
      ? tournaments 
      : tournaments.filter(t => t.tour_code === activeTour);
    
    return {
      all: tourFiltered.length,
      live: tourFiltered.filter(t => t.status === 'inprogress').length,
      upcoming: tourFiltered.filter(t => 
        t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)
      ).length,
      completed: tourFiltered.filter(t => t.status === 'closed').length,
    };
  }, [tournaments, activeTour]);

  // Tour counts (filtered by active status filter)
  const tourCounts = useMemo(() => {
    if (!tournaments) return {} as Record<string, number>;
    
    const now = new Date();
    let statusFiltered = [...tournaments];
    
    switch (filter) {
      case 'upcoming':
        statusFiltered = statusFiltered.filter(t => 
          t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)
        );
        break;
      case 'completed':
        statusFiltered = statusFiltered.filter(t => t.status === 'closed');
        break;
      case 'live':
        statusFiltered = statusFiltered.filter(t => t.status === 'inprogress');
        break;
    }
    
    const counts: Record<string, number> = {};
    for (const t of statusFiltered) {
      if (t.tour_code) {
        counts[t.tour_code] = (counts[t.tour_code] || 0) + 1;
      }
    }
    return counts;
  }, [tournaments, filter]);

  // Get next upcoming tournament for empty state
  const nextUpcoming = useMemo(() => {
    if (!tournaments) return undefined;
    const upcoming = tournaments
      .filter(t => t.status === 'scheduled' || t.status === 'created')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return upcoming[0];
  }, [tournaments]);

  // Filter tournaments (exclude featured from list)
  const filteredResults = useMemo(() => {
    if (!tournaments) return [];
    
    let filtered = [...tournaments];

    // Tour filter
    if (activeTour !== 'all') {
      filtered = filtered.filter(t => t.tour_code === activeTour);
    }
    
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(t => 
          t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)
        );
        break;
      case 'completed':
        filtered = filtered.filter(t => t.status === 'closed');
        break;
      case 'live':
        filtered = filtered.filter(t => t.status === 'inprogress');
        break;
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.venue_name?.toLowerCase().includes(searchLower) ||
        t.venue_city?.toLowerCase().includes(searchLower) ||
        t.venue_country?.toLowerCase().includes(searchLower) ||
        t.tour_full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Exclude hero tournament(s) from the list when on 'all' filter and no search
    if (filter === 'all' && !search && heroItems.length > 0) {
      const heroIds = new Set(heroItems.map(h => h.tournament.id));
      filtered = filtered.filter(t => !heroIds.has(t.id));
    }
    
    return filtered;
  }, [tournaments, filter, activeTour, search, heroItems]);

  // Group by month with sort order based on filter
  const monthGroups = useMemo((): (MonthGroup & { tourBreakdown: Record<string, number> })[] => {
    if (!filteredResults.length) return [];

    const groups = new Map<string, TourTournament[]>();
    
    filteredResults.forEach(tournament => {
      const date = new Date(tournament.start_date);
      const monthKey = format(date, 'yyyy-MM');
      const existing = groups.get(monthKey) || [];
      groups.set(monthKey, [...existing, tournament]);
    });

    const entries = Array.from(groups.entries());
    
    // Completed: most recent first (reverse chronological)
    if (filter === 'completed') {
      entries.sort(([a], [b]) => b.localeCompare(a));
      entries.forEach(([, tournaments]) => {
        tournaments.sort((a, b) => 
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      });
    } else {
      entries.sort(([a], [b]) => a.localeCompare(b));
    }

    return entries.map(([monthKey, tournaments]) => {
      // Compute tour breakdown for this month
      const tourBreakdown: Record<string, number> = {};
      for (const t of tournaments) {
        if (t.tour_code) {
          tourBreakdown[t.tour_code] = (tourBreakdown[t.tour_code] || 0) + 1;
        }
      }

      return {
        monthKey,
        monthLabel: format(new Date(tournaments[0].start_date), 'MMMM yyyy').toUpperCase(),
        tournaments,
        tourBreakdown,
      };
    });
  }, [filteredResults, filter]);

  // Scroll to current month on load (only for 'all' or 'upcoming' with no search)
  useEffect(() => {
    if (hasScrolledToNow || isLoading || !monthGroups.length) return;
    if (filter !== 'all' && filter !== 'upcoming') return;
    if (search) return;

    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const targetEl = document.getElementById(`month-${currentMonthKey}`);
    
    if (targetEl) {
      const timer = setTimeout(() => {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHasScrolledToNow(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    setHasScrolledToNow(true);
  }, [hasScrolledToNow, isLoading, monthGroups, filter, search]);

  // Loading state with cinematic shimmer
  if (isLoading) {
    return (
      <div className="space-y-6 -mx-4">
        {/* Hero skeleton */}
        <div className="animate-pulse bg-muted" style={{ height: '320px' }} />
        
        {/* Search skeleton */}
        <div className="px-4">
          <div className="h-12 bg-muted rounded-xl w-full max-w-md animate-pulse" />
        </div>
        
        {/* Filters skeleton */}
        <div className="px-4 space-y-2">
          <div className="h-12 bg-muted rounded-xl animate-pulse" />
          <div className="h-11 bg-muted rounded-xl animate-pulse w-3/4" />
        </div>
        
        {/* Cards skeleton */}
        <div className="space-y-4 mt-4 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i} 
              className="animate-pulse rounded-2xl bg-muted"
              style={{ height: '220px' }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state - no tournaments at all
  if (!tournaments || tournaments.length === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }
  
  return (
    <div className="min-h-screen pb-24 -mx-4">
      
      {/* Dynamic Hero — carousel when multiple live events */}
      {filter !== 'live' && !search && heroItems.length > 0 && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {heroItems.length === 1 ? (
            <ScheduleHeroCard 
              tournament={heroItems[0].tournament} 
              type={heroItems[0].type}
              leaderWinner={leadersWinnersMap?.get(heroItems[0].tournament.id)}
            />
          ) : (
            <>
              {/* Snap-scroll carousel for multiple live events */}
              <div 
                ref={heroScrollRef}
                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none' }}
              >
                {heroItems.map((item) => (
                  <div key={item.tournament.id} className="w-full flex-shrink-0 snap-start">
                    <ScheduleHeroCard 
                      tournament={item.tournament} 
                      type={item.type}
                      leaderWinner={leadersWinnersMap?.get(item.tournament.id)}
                    />
                  </div>
                ))}
              </div>
              {/* Page dots */}
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {heroItems.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'rounded-full transition-all duration-300',
                      i === activeHeroIndex
                        ? 'w-6 h-1.5 bg-foreground'
                        : 'w-1.5 h-1.5 bg-foreground/25'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Content container with padding */}
      <div className="px-4">
        {/* Premium Glassmorphic Search Bar */}
        <motion.div 
          className="relative max-w-md mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Search 
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
              isSearchFocused ? "text-foreground" : "text-muted-foreground"
            )} 
          />
          <input
            type="text"
            placeholder="Search tournaments, venues, tours..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "w-full h-12 pl-11 pr-10 rounded-xl text-[14px] transition-all duration-200",
              "bg-card/80 backdrop-blur-sm border text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:bg-card",
              isSearchFocused 
                ? "border-border ring-border/50 shadow-lg" 
                : "border-border/60 ring-transparent shadow-sm"
            )}
          />
          <AnimatePresence>
            {searchInput && (
              <motion.button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sticky Filter Toolbar — status pills + tour pills stick together */}
        <motion.div
          className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-4 px-4 pb-2 space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <ScheduleFilterPills
            activeFilter={filter}
            onFilterChange={setFilter}
            counts={filterStats}
          />
          <ScheduleTourFilter
            activeTour={activeTour}
            onTourChange={setActiveTour}
            tourCounts={tourCounts}
          />
        </motion.div>
      </div>

      {/* No Live Message */}
      {filter === 'live' && filterStats.live === 0 && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ScheduleEmptyMessage 
            variant="no-live" 
            nextTournamentName={nextUpcoming?.name}
          />
        </motion.div>
      )}
      
      {/* Event Cards - Grouped by Month */}
      <AnimatePresence mode="wait">
        {monthGroups.length > 0 ? (
          <motion.div 
            className="space-y-6 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {monthGroups.map((group, groupIndex) => (
              <motion.div 
                key={group.monthKey}
                id={`month-${group.monthKey}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.05, duration: 0.3 }}
              >
                {/* Month Header */}
                <ScheduleMonthHeader 
                  monthLabel={group.monthLabel}
                  eventCount={group.tournaments.length}
                  tourBreakdown={group.tourBreakdown}
                />

                {/* Tournament Cards - Full width with spacing + InView entrance */}
                <div className="space-y-3 mt-3 -mx-4">
                  {group.tournaments.map((tournament) => (
                    <InViewCard key={tournament.id}>
                      <ScheduleTournamentCard 
                        tournament={tournament}
                        leaderWinner={leadersWinnersMap?.get(tournament.id)}
                        batchImageUrl={
                          tournament.venue_name
                            ? batchImages?.get(tournament.venue_name) ?? undefined
                            : undefined
                        }
                      />
                    </InViewCard>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ScheduleEmptyMessage variant="no-results" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Season Complete Message */}
      {filterStats.upcoming === 0 && filterStats.live === 0 && filterStats.completed > 0 && filter === 'all' && !search && (
        <div className="pt-8 border-t border-border mt-8">
          <ScheduleEmptyMessage variant="season-complete" />
        </div>
      )}
    </div>
  );
}
