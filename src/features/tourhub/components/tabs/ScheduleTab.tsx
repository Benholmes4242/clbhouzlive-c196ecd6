/**
 * ScheduleTab - Full visual overhaul matching Overview design language
 * 
 * SC-01: Live Hero Carousel on Live tab
 * SC-02: Premium empty state with countdown
 * SC-07: Error state with retry
 * SC-08: Pull-to-refresh compatible
 * SC-09: 30s polling on Live tab
 * SC-12: Sticky month headers
 * SC-17: Scroll position via sessionStorage
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

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
  LiveHeroCarousel,
} from '../schedule';

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA Tour', EURO: 'DP World Tour', LPGA: 'LPGA', CHAMP: 'Champions Tour', PGAD: 'Korn Ferry', LIV: 'LIV Golf',
};

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  tournaments: TourTournament[];
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function InViewCard({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

const SCROLL_KEY = 'schedule-scroll-pos';

export function ScheduleTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const heroScrollRef = useRef<HTMLDivElement>(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const filter = (searchParams.get('filter') as ScheduleFilterType) || 'all';
  const activeTour = (searchParams.get('tour') as TourFilterCode) || 'all';

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    const scrollContainer = document.querySelector('[data-scroll-container]') || document.querySelector('main') || document.querySelector('.page-root');
    if (scrollContainer) scrollContainer.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    });

    // Restore scroll position on back navigation
    const savedPos = sessionStorage.getItem(SCROLL_KEY);
    if (savedPos) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(savedPos, 10));
      });
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, []);

  // Save scroll position before navigating away
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };
    window.addEventListener('beforeunload', saveScroll);
    return () => window.removeEventListener('beforeunload', saveScroll);
  }, []);
  
  const setFilter = useCallback((f: ScheduleFilterType) => {
    const params = new URLSearchParams(searchParams);
    if (f === 'all') { params.delete('filter'); } else { params.set('filter', f); }
    setSearchParams(params, { replace: true });
    // Scroll to top on filter change
    window.scrollTo({ top: 0 });
  }, [searchParams, setSearchParams]);

  const setActiveTour = useCallback((t: TourFilterCode) => {
    const params = new URLSearchParams(searchParams);
    if (t === 'all') { params.delete('tour'); } else { params.set('tour', t); }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const search = useDebouncedValue(searchInput, 200);
  
  const queryClient = useQueryClient();
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading, error, refetch } = useTourTournaments(season?.id, {
    refetchInterval: filter === 'live' ? 30000 : false,
  });

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tourhub', 'tournaments'] }),
      queryClient.invalidateQueries({ queryKey: ['tournament-leaders-winners'] }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const distance = e.touches[0].clientY - touchStartY.current;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance * 0.5, 80));
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pullDistance > 50) {
      handleRefresh();
    }
    setPullDistance(0);
    isPulling.current = false;
  }, [pullDistance, handleRefresh]);

  const { liveIds, completedIds } = useMemo(() => {
    if (!tournaments) return { liveIds: [] as string[], completedIds: [] as string[] };
    return {
      liveIds: tournaments.filter(t => t.status === 'inprogress').map(t => t.id),
      completedIds: tournaments.filter(t => t.status === 'closed').map(t => t.id),
    };
  }, [tournaments]);

  const { data: leadersWinnersMap } = useTournamentLeadersWinners([...liveIds, ...completedIds]);

  // Live tournaments for hero carousel
  const liveTournaments = useMemo(() => {
    if (!tournaments) return [];
    return tournaments
      .filter(t => t.status === 'inprogress')
      .filter(t => activeTour === 'all' || t.tour_code === activeTour);
  }, [tournaments, activeTour]);

  // Dynamic hero (for non-live tabs)
  const heroItems = useMemo(() => {
    if (!tournaments) return [];
    
    if (filter === 'live') return []; // Handled by LiveHeroCarousel

    if (filter === 'completed') {
      const completed = tournaments
        .filter(t => t.status === 'closed')
        .filter(t => activeTour === 'all' || t.tour_code === activeTour)
        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
      return completed.length > 0 
        ? [{ tournament: completed[0], type: 'recent' as const }] 
        : [];
    }

    const liveTourneys = tournaments
      .filter(t => t.status === 'inprogress')
      .filter(t => activeTour === 'all' || t.tour_code === activeTour);
    if (liveTourneys.length > 0) {
      return liveTourneys.map(t => ({ tournament: t, type: 'live' as const }));
    }

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

  const filterStats = useMemo(() => {
    if (!tournaments) return { all: 0, live: 0, upcoming: 0, completed: 0 };
    const now = new Date();
    const tourFiltered = activeTour === 'all' ? tournaments : tournaments.filter(t => t.tour_code === activeTour);
    return {
      all: tourFiltered.length,
      live: tourFiltered.filter(t => t.status === 'inprogress').length,
      upcoming: tourFiltered.filter(t => t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)).length,
      completed: tourFiltered.filter(t => t.status === 'closed').length,
    };
  }, [tournaments, activeTour]);

  const tourCounts = useMemo(() => {
    if (!tournaments) return {} as Record<string, number>;
    const now = new Date();
    let statusFiltered = [...tournaments];
    switch (filter) {
      case 'upcoming': statusFiltered = statusFiltered.filter(t => t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)); break;
      case 'completed': statusFiltered = statusFiltered.filter(t => t.status === 'closed'); break;
      case 'live': statusFiltered = statusFiltered.filter(t => t.status === 'inprogress'); break;
    }
    const counts: Record<string, number> = {};
    for (const t of statusFiltered) { if (t.tour_code) counts[t.tour_code] = (counts[t.tour_code] || 0) + 1; }
    return counts;
  }, [tournaments, filter]);

  const nextUpcoming = useMemo(() => {
    if (!tournaments) return undefined;
    return tournaments
      .filter(t => t.status === 'scheduled' || t.status === 'created')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
  }, [tournaments]);

  const filteredResults = useMemo(() => {
    if (!tournaments) return [];
    let filtered = [...tournaments];
    if (activeTour !== 'all') filtered = filtered.filter(t => t.tour_code === activeTour);
    const now = new Date();
    switch (filter) {
      case 'upcoming': filtered = filtered.filter(t => t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)); break;
      case 'completed': filtered = filtered.filter(t => t.status === 'closed'); break;
      case 'live': filtered = filtered.filter(t => t.status === 'inprogress'); break;
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
    // Exclude hero items from list (non-live tabs only)
    if (filter !== 'live' && filter === 'all' && !search && heroItems.length > 0) {
      const heroIds = new Set(heroItems.map(h => h.tournament.id));
      filtered = filtered.filter(t => !heroIds.has(t.id));
    }
    return filtered;
  }, [tournaments, filter, activeTour, search, heroItems]);

  const monthGroups = useMemo((): (MonthGroup & { tourBreakdown: Record<string, number> })[] => {
    if (!filteredResults.length) return [];
    const groups = new Map<string, TourTournament[]>();
    filteredResults.forEach(tournament => {
      const date = new Date(tournament.start_date + 'T12:00:00Z');
      const monthKey = format(date, 'yyyy-MM');
      const existing = groups.get(monthKey) || [];
      groups.set(monthKey, [...existing, tournament]);
    });
    const entries = Array.from(groups.entries());
    if (filter === 'completed') {
      entries.sort(([a], [b]) => b.localeCompare(a));
      entries.forEach(([, tournaments]) => tournaments.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()));
    } else {
      entries.sort(([a], [b]) => a.localeCompare(b));
    }
    return entries.map(([monthKey, tournaments]) => {
      const tourBreakdown: Record<string, number> = {};
      for (const t of tournaments) { if (t.tour_code) tourBreakdown[t.tour_code] = (tourBreakdown[t.tour_code] || 0) + 1; }
      return {
        monthKey,
        monthLabel: format(new Date(tournaments[0].start_date + 'T12:00:00Z'), 'MMMM yyyy').toUpperCase(),
        tournaments,
        tourBreakdown,
      };
    });
  }, [filteredResults, filter]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 -mx-4">
        <div className="animate-pulse bg-muted" style={{ height: 'clamp(282px, 53vh, 422px)' }} />
        <div className="px-4 space-y-3">
          <div className="h-12 bg-muted rounded-xl w-full animate-pulse" />
          <div className="h-11 bg-muted rounded-xl animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // SC-07: Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground">Couldn't load the schedule</h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-card border border-border text-foreground transition-all active:scale-95 shadow-sm"
        >
          Tap to Retry
        </button>
      </div>
    );
  }
  
  if (!tournaments || tournaments.length === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }
  
  return (
    <div
      className="min-h-screen -mx-4"
      ref={scrollContainerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator — SC-08 */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            className="flex items-center justify-center"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isRefreshing ? 48 : pullDistance, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <RefreshCw
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform',
                isRefreshing && 'animate-spin'
              )}
              style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Live Hero Carousel — SC-01 */}
      {filter === 'live' && !search && liveTournaments.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute z-30 left-4 flex h-11 w-11 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 active:scale-95 transition-all"
            style={{ top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <LiveHeroCarousel tournaments={liveTournaments} leadersMap={leadersWinnersMap} />
          </motion.div>
        </div>
      )}

      {/* Standard Hero — non-live tabs */}
      {filter !== 'live' && !search && heroItems.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute z-30 left-4 flex h-11 w-11 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 active:scale-95 transition-all"
            style={{ top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <motion.div 
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
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {heroItems.map((_, i) => (
                  <span
                    key={i}
                    className={i === activeHeroIndex ? "hero-dot-active" : "hero-dot-inactive"}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
        </div>
      )}

      {/* Content below hero */}
      <div className="bg-background pt-4">
        {/* Search Bar */}
        <div className="px-4">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground w-[18px] h-[18px]"
              strokeWidth={2.5}
            />
            <input
              type="text"
              placeholder="Search tournaments, venues, tours..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "w-full h-12 pl-11 pr-10 rounded-2xl text-[14px] transition-all duration-200",
                "bg-card border text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:bg-card",
                isSearchFocused 
                  ? "border-border ring-border/50 shadow-lg" 
                  : "border-border/50 ring-transparent shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
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
        </div>

        {/* Sticky Filter Toolbar */}
        <motion.div
          className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-4 pb-2"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
            borderBottom: '1px solid hsl(var(--border) / 0.3)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <div style={{ marginTop: '14px' }}>
            <ScheduleFilterPills
              activeFilter={filter}
              onFilterChange={setFilter}
              counts={filterStats}
            />
          </div>
          <div style={{ marginTop: '8px' }}>
            <ScheduleTourFilter
              activeTour={activeTour}
              onTourChange={setActiveTour}
              tourCounts={tourCounts}
            />
          </div>
        </motion.div>

        {/* No Live Message — premium empty state SC-02 */}
        {filter === 'live' && filterStats.live === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ScheduleEmptyMessage 
              variant="no-live" 
              nextTournamentName={nextUpcoming?.name}
              nextTournamentDate={nextUpcoming?.start_date}
              onSwitchFilter={setFilter}
            />
          </motion.div>
        )}
        
        {/* Event Cards — Grouped by Month */}
        <AnimatePresence mode="wait">
          {monthGroups.length > 0 ? (
            <motion.div 
              className="mt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {monthGroups.map((group, groupIndex) => (
                <motion.div 
                  key={group.monthKey}
                  id={`month-${group.monthKey}`}
                  className={groupIndex > 0 ? 'mt-7' : ''}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.05, duration: 0.3 }}
                >
                  {/* Month header (non-sticky) */}
                  <div>
                    <ScheduleMonthHeader 
                      monthLabel={group.monthLabel}
                      eventCount={group.tournaments.length}
                      tourBreakdown={group.tourBreakdown}
                    />
                  </div>

                  {/* Tournament list — 12px gap from header, 12px between cards */}
                  <div className="flex flex-col gap-3 px-4 mt-3">
                    {group.tournaments.map((tournament) => (
                      <InViewCard key={tournament.id}>
                        <ScheduleTournamentCard 
                          tournament={tournament}
                          leaderWinner={leadersWinnersMap?.get(tournament.id)}
                        />
                      </InViewCard>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            filter === 'live' && filterStats.live === 0 ? null : (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ScheduleEmptyMessage 
                  variant={filter === 'upcoming' ? 'no-upcoming' : 'no-results'}
                  tourName={activeTour !== 'all' ? TOUR_LABELS[activeTour] : undefined}
                  onResetTour={() => setActiveTour('all')}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Season Complete Message */}
        {filterStats.upcoming === 0 && filterStats.live === 0 && filterStats.completed > 0 && filter === 'all' && !search && (
          <div className="pt-8 mt-8">
            <ScheduleEmptyMessage variant="season-complete" />
          </div>
        )}
      </div>

      {/* Bottom safe area */}
      <div style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }} />
    </div>
  );
}
