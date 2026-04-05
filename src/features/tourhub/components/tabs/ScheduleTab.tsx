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
import { Search, X, AlertCircle, RefreshCw, ChevronLeft, ChevronDown, Globe } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { HeroCarousel } from '../overview-v3/HeroCarousel';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getTourLogo, hasTourLogo } from '../../utils/tourLogos';

import {
  ScheduleFilterPills,
  type ScheduleFilterType,
  ScheduleTournamentCard,
  ScheduleMonthHeader,
  ScheduleEmptyMessage,
  type TourFilterCode,
} from '../schedule';

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA Tour', EURO: 'DP World Tour', LPGA: 'LPGA', CHAMP: 'Champions Tour', PGAD: 'Korn Ferry', LIV: 'LIV Golf',
};


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
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [tourSheetOpen, setTourSheetOpen] = useState(false);
  
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
  }, [tournaments, filter, activeTour, search]);

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
      
      {/* Hero Carousel — identical to Overview */}
      {!search && (
        <HeroCarousel hasHeader={false} />
      )}

      {/* Content below hero */}
      <div
        className="sticky top-0 z-30 -mx-4 bg-background/95 backdrop-blur-xl border-b border-border/10"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}
      >
        {/* ── ROW 1: Filter pills + Search icon toggle ── */}
        <div className="flex items-center gap-2 px-5 pt-2.5 pb-0">
          <div className="flex items-center flex-1 gap-0">
            {(['all', 'upcoming', 'live', 'completed'] as const).map((f) => {
              const isActive = filter === f;
              const isLive = f === 'live';
              const label = f === 'all' ? 'All' : f === 'upcoming' ? 'Upcoming' : f === 'live' ? 'Live' : 'Completed';
              const count = filterStats[f];
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'relative flex-1 h-[38px] rounded-[10px] text-[13px] font-semibold transition-all duration-200',
                    'flex items-center justify-center gap-1.5 active:scale-[0.97]',
                    isActive
                      ? isLive
                        ? 'text-white'
                        : 'bg-foreground text-background'
                      : 'bg-transparent text-muted-foreground'
                  )}
                  style={isActive && isLive ? { background: '#22C55E' } : undefined}
                >
                  {isLive && count > 0 && (
                    <span className="relative flex h-[6px] w-[6px] shrink-0">
                      <span
                        className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75"
                        style={{ background: isActive ? 'rgba(255,255,255,0.8)' : '#22C55E' }}
                      />
                      <span
                        className="relative inline-flex h-[6px] w-[6px] rounded-full"
                        style={{ background: isActive ? 'rgba(255,255,255,0.9)' : '#22C55E' }}
                      />
                    </span>
                  )}
                  {label}
                  {isLive && count > 0 && !isActive && (
                    <span
                      className="absolute top-[5px] right-[5px] flex items-center justify-center rounded-full text-white font-bold"
                      style={{ background: '#22C55E', fontSize: 9, width: 14, height: 14, lineHeight: 1 }}
                    >
                      {count}
                    </span>
                  )}
                  {isLive && count > 0 && isActive && (
                    <span
                      className="flex items-center justify-center rounded-full font-bold text-white"
                      style={{ background: 'rgba(255,255,255,0.25)', fontSize: 10, padding: '0 4px', height: 16, lineHeight: '16px' }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setSearchExpanded(v => !v)}
            className={cn(
              'w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 transition-colors duration-150',
              searchExpanded ? 'bg-amber-50' : 'bg-transparent'
            )}
          >
            <Search
              className="w-[17px] h-[17px] transition-colors duration-150"
              style={{ color: searchExpanded ? '#F59E0B' : undefined }}
              strokeWidth={2.5}
            />
          </button>
        </div>

        {/* ── SEARCH BAR — collapsible ── */}
        <div
          className="overflow-hidden transition-all ease-in-out px-5"
          style={{ maxHeight: searchExpanded ? 60 : 0, opacity: searchExpanded ? 1 : 0, transitionDuration: '250ms' }}
        >
          <div className="relative pt-2.5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground w-[17px] h-[17px] mt-[5px]" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search tournaments, venues, tours..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={cn(
                'w-full h-11 pl-10 pr-9 rounded-xl text-[13px] transition-all duration-200',
                'bg-card border text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400/60',
                'border-border/50'
              )}
            />
            <AnimatePresence>
              {searchInput && (
                <motion.button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-[5px] p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── ROW 2: ← Tour Overview + Tour filter pill ── */}
        <div className="flex items-center justify-between px-5 pt-2 pb-2.5">
          <button
            type="button"
            onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
            className="flex items-center gap-0.5 text-[12px] font-medium text-muted-foreground/70 active:opacity-50 transition-opacity"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            Tour Overview
          </button>
          <button
            onClick={() => setTourSheetOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] transition-all duration-150 active:scale-[0.97]',
              'bg-card border border-border/50 shadow-sm',
              activeTour !== 'all' ? 'border-amber-400/40 bg-amber-50/60' : ''
            )}
          >
            <Globe className="w-[12px] h-[12px] shrink-0" style={{ color: '#F59E0B' }} strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-foreground">
              {activeTour === 'all' ? 'All Tours' : activeTour === 'pga' ? 'PGA Tour' : activeTour === 'EURO' ? 'DP World Tour' : activeTour === 'LPGA' ? 'LPGA' : activeTour === 'CHAMP' ? 'Champions' : activeTour === 'PGAD' ? 'Korn Ferry' : 'LIV Golf'}
            </span>
            <ChevronDown className="w-[11px] h-[11px] text-muted-foreground/60" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="bg-background">

        {/* No Live Message — premium empty state SC-02 */}
        {filter === 'live' && filterStats.live === 0 && (
          // B42 FIX 8: remove motion wrapper
          <ScheduleEmptyMessage 
            variant="no-live" 
            nextTournamentName={nextUpcoming?.name}
            nextTournamentDate={nextUpcoming?.start_date}
            // B44 FIX 2: suppress CTA when hero already shows upcoming
            onSwitchFilter={setFilter}
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

      {/* Tour Filter Bottom Sheet — portaled to escape backdrop-blur stacking context */}
      <BottomSheet
        open={tourSheetOpen}
        onClose={() => setTourSheetOpen(false)}
        ariaLabelledBy="schedule-tour-sheet-title"
      >
        <div className="px-5 pt-3 pb-4 border-b border-border/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#F59E0B' }}>
            Filter
          </p>
          <p id="schedule-tour-sheet-title" className="text-[18px] font-bold text-foreground tracking-tight">Select Tour</p>
        </div>
        {(['all', 'pga', 'EURO', 'LPGA', 'CHAMP', 'PGAD', 'LIV'] as const).map((code) => {
          const labels: Record<string, string> = {
            all: 'All Tours', pga: 'PGA Tour', EURO: 'DP World Tour',
            LPGA: 'LPGA', CHAMP: 'Champions', PGAD: 'Korn Ferry', LIV: 'LIV Golf',
          };
          const isSelected = activeTour === code;
          const count = code === 'all'
            ? Object.values(tourCounts).reduce((s, c) => s + c, 0)
            : tourCounts[code] ?? 0;
          return (
            <button
              key={code}
              onClick={() => { setActiveTour(code as TourFilterCode); setTourSheetOpen(false); }}
              className={cn(
                'w-full flex items-center justify-between px-5 py-[14px]',
                'border-b border-border/[0.06] transition-colors duration-100',
                'active:bg-muted/50 text-left',
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <div className="flex items-center gap-2.5">
                {code === 'all' ? (
                  <Globe className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                ) : hasTourLogo(code.toLowerCase()) ? (
                  <img
                    src={getTourLogo(code.toLowerCase())}
                    alt=""
                    aria-hidden="true"
                    className="object-contain flex-shrink-0"
                    style={{ width: 32, height: 22 }}
                  />
                ) : null}
                <span className={cn('text-[15px]', isSelected ? 'font-bold' : 'font-medium')}>
                  {labels[code]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <span className="text-[12px] text-muted-foreground/60 font-medium">{count}</span>
                )}
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </BottomSheet>

      {/* Bottom safe area */}
      <div style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }} />
    </div>
  );
}
