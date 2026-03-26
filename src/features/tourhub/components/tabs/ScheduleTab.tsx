/**
 * ScheduleTab - Full visual overhaul matching Overview design language
 * 
 * SC-01: Live Hero Carousel on Live tab
 * SC-02: Premium empty state with countdown
 * SC-07: Error state with retry
 * SC-08: Pull-to-refresh compatible
 * SC-09: 30s polling on Live tab
 * SC-12: Sticky month headers
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, AlertCircle, RefreshCw, ChevronLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { getContextLabel } from '../../utils/tournamentClassification';
import { getTournamentDisplayState } from '@/utils/tournamentState';

import {
  ScheduleFilterPills,
  type ScheduleFilterType,
  ScheduleTournamentCard,
  ScheduleMonthHeader,
  ScheduleEmptyMessage,
  ScheduleTourFilter,
  type TourFilterCode,
  ScheduleHeroCarousel,
  type ScheduleHeroItem,
} from '../schedule';

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA Tour', EURO: 'DP World Tour', LPGA: 'LPGA', CHAMP: 'Champions Tour', PGAD: 'Korn Ferry', LIV: 'LIV Golf',
};

const SCHEDULE_TOUR_PRIORITY: Record<string, number> = {
  pga: 0, LIV: 1, EURO: 2, LPGA: 3, PGAD: 4, CHAMP: 5,
};

function getTournamentPriority(t: TourTournament): number {
  const label = getContextLabel({ name: t.name, tourName: t.tour_full_name ?? undefined });
  if (label === 'MAJOR CHAMPIONSHIP') return -1;
  return SCHEDULE_TOUR_PRIORITY[t.tour_code || ''] ?? 99;
}

// B45 FIX 1: Helper for completed status check
const isCompleted = (t: TourTournament) => t.status === 'closed' || t.status === 'complete';

// B42 FIX 4: tourBreakdown in interface directly
interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  tournaments: TourTournament[];
  tourBreakdown: Record<string, number>;
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

export function ScheduleTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  
  const filter = (searchParams.get('filter') as ScheduleFilterType) || 'all';
  const activeTour = (searchParams.get('tour') as TourFilterCode) || 'all';

  // Scroll to top on mount — always start at top
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, []);

  // Default to upcoming tab on fresh mount (no filter param in URL)
  useEffect(() => {
    if (!searchParams.get('filter')) {
      const params = new URLSearchParams(searchParams);
      params.set('filter', 'upcoming');
      setSearchParams(params, { replace: true });
    }
  }, []); // runs once on mount only
  
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
    // B43 FIX 4: poll upcoming tab too
    refetchInterval: filter === 'live' ? 30000 : filter === 'upcoming' ? 60000 : false,
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
      // B45 FIX 1: include 'complete' status
      completedIds: tournaments.filter(isCompleted).map(t => t.id),
    };
  }, [tournaments]);

  const { data: leadersWinnersMap } = useTournamentLeadersWinners([...liveIds, ...completedIds]);

  // Unified hero items for all tabs
  const heroItems = useMemo((): ScheduleHeroItem[] => {
    if (!tournaments) return [];
    const tourFiltered = activeTour === 'all' ? tournaments : tournaments.filter(t => t.tour_code === activeTour);

    // onePerTour: dedup by tour, preserving input list order (chronological)
    // No major-priority hoisting — soonest event per tour wins
    const onePerTour = (list: TourTournament[], type: ScheduleHeroItem['type']): ScheduleHeroItem[] => {
      const seenTours = new Set<string>();
      return list.filter(t => {
        const tour = t.tour_code || 'unknown';
        if (seenTours.has(tour)) return false;
        seenTours.add(tour);
        return true;
      }).map(t => ({ tournament: t, type }));
    };

    const now = new Date();

    const liveList = tourFiltered.filter(t =>
      getTournamentDisplayState(t.status, t.end_date, now) === 'live'
    );

    const completedList = tourFiltered
      .filter(t => getTournamentDisplayState(t.status, t.end_date, now) === 'result')
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

    const upcomingList = tourFiltered
      .filter(t => getTournamentDisplayState(t.status, t.end_date, now) === 'upcoming'
        && (t.status === 'scheduled' || t.status === 'created'))
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    if (filter === 'live') {
      if (liveList.length > 0) {
        return [...liveList]
          .sort((a, b) => getTournamentPriority(a) - getTournamentPriority(b))
          .map(t => ({ tournament: t, type: 'live' as const }));
      }
      // No live tournaments — show next upcoming as hero
      if (upcomingList.length > 0) {
        return [{ tournament: upcomingList[0], type: 'upcoming' as const }];
      }
      return [];
    }

    if (filter === 'completed') {
      return onePerTour(completedList, 'recent');
    }

    // B43 FIX 2: upcoming tab always shows upcoming heroes
    if (filter === 'upcoming') {
      return onePerTour(upcomingList, 'upcoming');
    }

    // 'all' tab: live + one completed per tour + one upcoming per tour, capped at 8
    const items: ScheduleHeroItem[] = [
      ...[...liveList]
        .sort((a, b) => getTournamentPriority(a) - getTournamentPriority(b))
        .map(t => ({ tournament: t, type: 'live' as const })),
      ...onePerTour(completedList, 'recent'),
      ...onePerTour(upcomingList, 'upcoming'),
    ];
    return items.slice(0, 8);
  }, [tournaments, filter, activeTour]);

  const filterStats = useMemo(() => {
    if (!tournaments) return { all: 0, live: 0, upcoming: 0, completed: 0 };
    const tourFiltered = activeTour === 'all' ? tournaments : tournaments.filter(t => t.tour_code === activeTour);
    return {
      all: tourFiltered.length,
      live: tourFiltered.filter(t => t.status === 'inprogress').length,
      // B43 FIX 1: remove isAfter
      upcoming: tourFiltered.filter(t => t.status === 'scheduled' || t.status === 'created').length,
      // B45 FIX 1: include 'complete'
      completed: tourFiltered.filter(isCompleted).length,
    };
  }, [tournaments, activeTour]);

  const tourCounts = useMemo(() => {
    if (!tournaments) return {} as Record<string, number>;
    let statusFiltered = [...tournaments];
    switch (filter) {
      // B43 FIX 1: remove isAfter
      case 'upcoming': statusFiltered = statusFiltered.filter(t => t.status === 'scheduled' || t.status === 'created'); break;
      // B45 FIX 1: include 'complete'
      case 'completed': statusFiltered = statusFiltered.filter(isCompleted); break;
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
    switch (filter) {
      // B43 FIX 1: remove isAfter
      case 'upcoming': filtered = filtered.filter(t => t.status === 'scheduled' || t.status === 'created'); break;
      // B45 FIX 1: include 'complete'
      case 'completed': filtered = filtered.filter(isCompleted); break;
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
    // Remove hero items from the list (they're shown in the carousel above)
    // but never on the completed tab — users expect the full completed list
    if (!search && heroItems.length > 0 && filter !== 'all' && filter !== 'live' && filter !== 'completed') {
      const heroIds = new Set(heroItems.map(h => h.tournament.id));
      filtered = filtered.filter(t => !heroIds.has(t.id));
    }

    // B42 FIX 2: "all" tab sort — live first, then upcoming by date, then completed
    if (filter === 'all') {
      filtered.sort((a, b) => {
        const statusScore = (t: TourTournament) =>
          t.status === 'inprogress' ? 0 : (t.status === 'scheduled' || t.status === 'created') ? 1 : 2;
        const ss = statusScore(a) - statusScore(b);
        if (ss !== 0) return ss;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });
    }

    return filtered;
  }, [tournaments, filter, activeTour, search, heroItems]);

  const monthGroups = useMemo((): MonthGroup[] => {
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
      // B45 FIX 3: sort by end_date for completed
      entries.forEach(([, tournaments]) => tournaments.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()));
    } else {
      entries.sort(([a], [b]) => a.localeCompare(b));
    }
    return entries.map(([monthKey, tournaments]) => {
      const tourBreakdown: Record<string, number> = {};
      for (const t of tournaments) { if (t.tour_code) tourBreakdown[t.tour_code] = (tourBreakdown[t.tour_code] || 0) + 1; }
      return {
        monthKey,
        // B42 FIX 3: title case from source, no toUpperCase
        monthLabel: format(new Date(tournaments[0].start_date + 'T12:00:00Z'), 'MMMM yyyy'),
        tournaments,
        tourBreakdown,
      };
    });
  }, [filteredResults, filter]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 -mx-4">
        <Skeleton className="w-full" style={{ height: '45dvh' }} />
        <div className="px-4 space-y-3">
          <Skeleton className="h-12 rounded-xl w-full" />
          <Skeleton className="h-11 rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
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
      
      {/* Unified Hero Carousel — all tabs */}
      {!search && heroItems.length > 0 && (
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <ScheduleHeroCarousel
              items={heroItems}
              leadersMap={leadersWinnersMap}
            />
          </motion.div>
        </div>
      )}

      {/* Content below hero */}
      <div className="bg-background pt-3">
        {/* ← Tour Overview back link */}
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
            className="flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground active:opacity-70 transition-opacity"
          >
            <ChevronLeft size={14} />
            Tour Overview
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4" style={{ marginTop: '16px' }}>
          <div className="relative">
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground w-[18px] h-[18px]"
              strokeWidth={2.5}
            />
            <input
              type="text"
              placeholder="Search tournaments, venues, tours..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={cn(
                "w-full h-12 pl-11 pr-10 rounded-2xl text-[13px] transition-all duration-200",
                "bg-card border text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:bg-card",
                "border-border/50 ring-transparent",
                "focus:border-border focus:ring-border/50 focus:shadow-lg"
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
          </div>
        </div>

        {/* Sticky Filter Toolbar */}
        <div
          className="sticky top-0 z-20 -mx-4 px-4 mt-6"
          style={{
            background: 'hsl(var(--background) / 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid hsl(var(--border) / 0.15)',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          }}
        >
          <div className="pb-1">
            <ScheduleFilterPills
              activeFilter={filter}
              onFilterChange={setFilter}
              counts={filterStats}
            />
          </div>
          <div className="pb-2">
            <ScheduleTourFilter
              activeTour={activeTour}
              onTourChange={setActiveTour}
              tourCounts={tourCounts}
            />
          </div>
        </div>

        {/* No Live Message — premium empty state SC-02 */}
        {filter === 'live' && filterStats.live === 0 && (
          // B42 FIX 8: remove motion wrapper
          <ScheduleEmptyMessage 
            variant="no-live" 
            nextTournamentName={nextUpcoming?.name}
            nextTournamentDate={nextUpcoming?.start_date}
            // B44 FIX 2: suppress CTA when hero already shows upcoming
            onSwitchFilter={heroItems.length === 0 ? setFilter : undefined}
          />
        )}
        
        {/* Event Cards — Grouped by Month */}
        <AnimatePresence mode="wait">
          {monthGroups.length > 0 ? (
            <motion.div 
              className="mt-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {monthGroups.map((group, groupIndex) => (
                // B42 FIX 5: plain div, no staggered entrance
                <div
                  key={group.monthKey}
                  id={`month-${group.monthKey}`}
                  className={groupIndex > 0 ? 'mt-7' : ''}
                >
                  {/* B44 FIX 3: suppress month header on live tab */}
                  {filter !== 'live' && (
                    // B42 FIX 7: remove redundant wrapper div
                    <ScheduleMonthHeader 
                      monthLabel={group.monthLabel}
                      eventCount={group.tournaments.length}
                      tourBreakdown={group.tourBreakdown}
                    />
                  )}

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
                </div>
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
