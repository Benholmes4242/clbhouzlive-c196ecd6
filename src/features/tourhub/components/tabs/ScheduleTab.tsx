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
import { Search, X, AlertCircle, RefreshCw, ChevronLeft, ChevronDown, ChevronRight, Globe, Clock, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { useScheduleDefendingChampionPhotos } from '../../hooks/useScheduleDefendingChampionPhotos';
import { deriveFieldStrength } from '../../utils/deriveFieldStrength';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getTourLogo, hasTourLogo } from '../../utils/tourLogos';
import { TOUR_MAP, getTourLabel, getTourShort, getTourMeta } from '../../constants/tourMap';
import { getCurrentWeek, getCurrentMonthKey, isInCurrentWeek } from '../../utils/getCurrentWeek';
import { TourPill } from '../shared/TourPill';
import { EventTag, type EventTagKind } from '../shared/EventTag';
import { CompactNextUp } from '../shared/CompactNextUp';
import { ThisWeekAnchor } from '../shared/ThisWeekAnchor';
import { getContextLabel } from '../../utils/tournamentClassification';
import { useStickyHeaderSafeArea } from '@/hooks/useStickyHeaderSafeArea';

import {
  ScheduleFilterPills,
  type ScheduleFilterType,
  ScheduleTournamentCard,
  ScheduleMonthHeader,
  ScheduleEmptyMessage,
  type TourFilterCode,
} from '../schedule';

import { useLiveRightNow } from '../../hooks/useOverviewModules';
import { LiveRightNow } from '../overview-v3/LiveRightNow';

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
  const { sentinelRef: stickysentinelRef, paddingTop: stickyPaddingTop } = useStickyHeaderSafeArea();
  const thisWeekAnchorRef = useRef<HTMLDivElement>(null);
  const [isThisWeekVisible, setIsThisWeekVisible] = useState(true);
  const hasAutoScrolledAllTab = useRef(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [tourSheetOpen, setTourSheetOpen] = useState(false);

  const filter = (searchParams.get('filter') as ScheduleFilterType) || 'all';
  const activeTour = (searchParams.get('tour') as TourFilterCode) || 'all';

  // Current week — computed once per render, used for THIS WEEK anchor + Today pill
  const currentWeek = useMemo(() => getCurrentWeek(), []);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  // Scroll to top on mount — always start at top
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, []);



  // Track THIS WEEK anchor visibility for sticky Today pill
  useEffect(() => {
    const el = thisWeekAnchorRef.current;
    if (!el) {
      setIsThisWeekVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsThisWeekVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filter]);

  // Default to upcoming tab on fresh mount (no filter param in URL)
  useEffect(() => {
    if (!searchParams.get('filter')) {
      const params = new URLSearchParams(searchParams);
      params.set('filter', 'upcoming');
      setSearchParams(params, { replace: true });
    }
  }, []); // runs once on mount only

  // First-activation scroll on All tab — scroll to current month divider
  useEffect(() => {
    if (filter !== 'all') return;
    if (hasAutoScrolledAllTab.current) return;
    // Wait a tick for monthGroups to render
    const t = setTimeout(() => {
      const el = document.getElementById(`month-${currentMonthKey}`);
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: 'auto' });
        hasAutoScrolledAllTab.current = true;
      }
    }, 80);
    return () => clearTimeout(t);
  }, [filter, currentMonthKey]);

  const scrollToThisWeek = useCallback(() => {
    const el = thisWeekAnchorRef.current ?? document.getElementById(`month-${currentMonthKey}`);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [currentMonthKey]);
  
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
  const { data: liveTournaments } = useLiveRightNow();

  // Phase 2 (Tier 4) — fetch defending-champion photos only for upcoming tournaments
  // that pass the show-section threshold (have defending_champion AND a qualifying tier).
  const upcomingForMeta = useMemo(() => {
    if (!tournaments) return [] as { id: string; defending_champion: string | null }[];
    return tournaments
      .filter((t) => (t.status === 'scheduled' || t.status === 'created') && !!t.defending_champion)
      .filter((t) =>
        deriveFieldStrength({
          name: t.name,
          tourName: t.tour_full_name ?? null,
          purse: t.purse,
        }) !== null,
      )
      .map((t) => ({ id: t.id, defending_champion: t.defending_champion }));
  }, [tournaments]);
  const { data: defendingChampionMap } = useScheduleDefendingChampionPhotos(upcomingForMeta);
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

  const nextUpTournament = useMemo(() => {
    if (!tournaments) return null;
    return [...tournaments]
      .filter(t => t.status === 'scheduled' || t.status === 'created')
      .sort((a, b) => {
        const dateDiff = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (b.purse ?? 0) - (a.purse ?? 0);
      })[0] ?? null;
  }, [tournaments]);

  const daysUntilNext = useMemo(() => {
    if (!nextUpTournament) return null;
    const diff = new Date(nextUpTournament.start_date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [nextUpTournament]);

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
      <div className="space-y-4 -mx-5">
        <Skeleton className="w-full" style={{ height: '35dvh' }} />
        <div className="px-5 space-y-3">
          {/* Sticky header skeleton: filter pills */}
          <div className="flex gap-1">
            {['All', 'Upcoming', 'Live', 'Completed'].map((label) => (
              <Skeleton key={label} className="flex-1 h-[38px] rounded-[10px]" />
            ))}
            <Skeleton className="w-[38px] h-[38px] rounded-[10px] shrink-0" />
          </div>
          {/* Tour filter + month header */}
          <div className="flex gap-2">
            <Skeleton className="h-[34px] rounded-[10px] flex-1" />
          </div>
          {/* Tournament card skeletons */}
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
      className="min-h-screen -mx-5"
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
      
      {/* ── SCHEDULE MASTHEAD — canonical section header on all tabs ── */}
      {!search && (() => {
        const tourCount = new Set(
          (tournaments ?? []).map(t => t.tour_code).filter(Boolean) as string[]
        ).size;
        const seasonLabel = season?.name ?? (season?.year ? `${season.year} Season` : 'Season');
        return (
          <div style={{ padding: '16px 16px 0', background: '#F8FAFC' }}>
            <button
              onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
              aria-label="Schedule — open Tour Overview"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
              }}
            >
              <Calendar size={13} color="#F7931E" strokeWidth={2.5} />
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#F7931E',
                textTransform: 'uppercase' as const,
              }}>
                SCHEDULE
              </span>
              <ChevronRight size={11} color="#F7931E" strokeWidth={2.5} style={{ marginTop: 1 }} />
            </button>

            <h1 style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
              margin: 0,
            }}>
              Tour schedule
            </h1>

            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              fontSize: 13,
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.005em',
              lineHeight: 1.25,
              margin: '6px 0 0',
              paddingBottom: 12,
            }}>
              <span>{seasonLabel}</span>
              <span style={{ fontWeight: 600, color: '#64748B' }}>
                {(tournaments ?? []).length} events across {tourCount} tour{tourCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Compact Next Up — rendered on every tab when an upcoming event exists */}
      {!search && nextUpTournament && daysUntilNext !== null && (
        <CompactNextUp
          tournamentId={nextUpTournament.id}
          tourCode={nextUpTournament.tour_code}
          name={nextUpTournament.name}
          daysUntil={daysUntilNext}
        />
      )}

      {/* Live Now — All tab only, below Next Up */}
      {!search && filter === 'all' && (
        <div style={{ padding: '0 16px 12px' }}>
          <LiveRightNow />
        </div>
      )}
      {/* Sentinel for sticky detection */}
      <div ref={stickysentinelRef} style={{ height: 1, marginTop: -1 }} />

      {/* Content below hero */}
      <div
        className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/10"
        style={{ paddingTop: stickyPaddingTop, transition: 'padding-top 200ms ease' }}
      >
        {/* ── ROW 1: Filter underline tabs ── */}
        <div style={{ padding: '0' }}>
          <ScheduleFilterPills
            activeFilter={filter}
            onFilterChange={setFilter}
            counts={filterStats}
          />
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

        {/* ── ROW 2: ← Tour Overview + Search + Tour filter pill ── */}
        <div className="flex items-center justify-between pt-2 pb-2.5" style={{ paddingLeft: 16, paddingRight: 16 }}>
          <button
            type="button"
            onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
            className="active:opacity-50 transition-opacity"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 12,
              fontWeight: 600,
              color: '#64748B',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={13} strokeWidth={2.5} color="#64748B" />
            Tour Overview
          </button>
          <div className="flex items-center gap-2">
            {/* Today jump pill — All tab only, when current week not visible */}
            {filter === 'all' && !isThisWeekVisible && (
              <button
                onClick={scrollToThisWeek}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 11px',
                  background: '#F7931E',
                  color: '#FFFFFF',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                }}
                className="active:scale-[0.97] transition-transform"
                aria-label="Jump to this week"
              >
                <Clock size={12} strokeWidth={2.8} color="#FFFFFF" />
                Today
              </button>
            )}
            <button
              onClick={() => setSearchExpanded(v => !v)}
              className={cn(
                'w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 transition-colors duration-150',
                searchExpanded ? 'bg-amber-50' : 'bg-transparent'
              )}
            >
              <Search
                className="w-[15px] h-[15px] transition-colors duration-150"
                style={{ color: searchExpanded ? '#D97706' : undefined }}
                strokeWidth={2.5}
              />
            </button>
            <button
              onClick={() => setTourSheetOpen(true)}
              className="active:scale-[0.97] transition-all duration-150"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 11px',
                background: activeTour !== 'all' ? '#FEF3E7' : '#FFFFFF',
                border: `1.5px solid ${activeTour !== 'all' ? '#F7931E' : '#E2E8F0'}`,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: '#0F172A',
                cursor: 'pointer',
              }}
            >
              {activeTour !== 'all' && hasTourLogo(activeTour.toLowerCase())
                ? <img src={getTourLogo(activeTour.toLowerCase())} alt={activeTour} className="shrink-0" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                : <Globe size={12} strokeWidth={2.5} color="#D97706" />
              }
              <span>
                {activeTour === 'all' ? 'All Tours' : (getTourMeta(activeTour)?.short ?? activeTour)}
              </span>
              <ChevronDown size={11} strokeWidth={2.5} color="#94A3B8" />
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', marginTop: '8px' }}>

        {/* No Live Message — premium empty state SC-02 */}
        {filter === 'live' && filterStats.live === 0 && (
          // B42 FIX 8: remove motion wrapper
          <ScheduleEmptyMessage 
            variant="no-live" 
            nextTournamentName={nextUpcoming?.name}
            nextTournamentDate={nextUpcoming?.start_date}
            nextTournamentTour={getTourMeta(nextUpcoming?.tour_code)?.short}
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
              {monthGroups.map((group, groupIndex) => {
                const isCurrentMonth = group.monthKey === currentMonthKey;
                // Find first tournament in current week to anchor the THIS WEEK band
                const currentWeekIdx = isCurrentMonth && filter === 'all'
                  ? group.tournaments.findIndex(t => isInCurrentWeek(t.start_date))
                  : -1;
                return (
                <div
                  key={group.monthKey}
                  id={`month-${group.monthKey}`}
                  className=""
                >
                  {filter !== 'live' && (
                    <ScheduleMonthHeader
                      monthLabel={group.monthLabel}
                      eventCount={group.tournaments.length}
                      tourBreakdown={group.tourBreakdown}
                      isCurrentMonth={isCurrentMonth}
                    />
                  )}

                  {/* Tournament list — flat rows with hairline dividers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {group.tournaments.map((tournament, idx) => (
                      <div key={tournament.id}>
                        {currentWeekIdx === idx && (
                          <ThisWeekAnchor ref={thisWeekAnchorRef} label={currentWeek.label} />
                        )}
                        <InViewCard>
                          <div style={{ borderBottom: idx < group.tournaments.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}>
                            <ScheduleTournamentCard
                              tournament={tournament}
                              leaderWinner={leadersWinnersMap?.get(tournament.id)}
                              defendingChampion={defendingChampionMap?.get(tournament.id) ?? null}
                            />
                          </div>
                        </InViewCard>
                      </div>
                    ))}
                   </div>
                    {/* Heavier rule between date groups */}
                    {groupIndex < monthGroups.length - 1 && (
                      <div style={{ height: '1px', background: 'rgba(15,23,42,0.1)' }} />
                    )}
                </div>
                );
              })}
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
                  tourName={activeTour !== 'all' ? getTourLabel(activeTour) : undefined}
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
        <div style={{ padding: '6px 20px 14px' }}>
          <div style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
            Filter
          </div>
          <div id="schedule-tour-sheet-title" style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
            Select Tour
          </div>
        </div>

        <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
          {(['all', 'pga', 'EURO', 'LPGA', 'CHAMP', 'PGAD', 'LIV'] as const).map((code) => {
            const meta = code === 'all' ? null : getTourMeta(code);
            const label = code === 'all' ? 'All Tours' : (meta?.short ?? code);
            const description = code === 'all'
              ? 'Show events from every tour'
              : `${meta?.label ?? code} events`;
            const isSelected = activeTour === code;
            const count = code === 'all'
              ? Object.values(tourCounts).reduce((s, c) => s + c, 0)
              : tourCounts[code] ?? 0;

            return (
              <button
                key={code}
                onClick={() => { setActiveTour(code as TourFilterCode); setTourSheetOpen(false); }}
                aria-pressed={isSelected}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 20px',
                  background: isSelected ? 'rgba(247,147,30,0.04)' : 'transparent',
                  border: 'none',
                  borderLeft: isSelected ? '3px solid #F7931E' : '3px solid transparent',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 36, height: 22, borderRadius: 4, background: 'rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {code === 'all' ? (
                    <Globe className="w-4 h-4" style={{ color: '#94A3B8' }} />
                  ) : hasTourLogo(code.toLowerCase()) ? (
                    <img
                      src={getTourLogo(code.toLowerCase())}
                      alt=""
                      aria-hidden="true"
                      style={{ width: 28, height: 18, objectFit: 'contain' }}
                    />
                  ) : null}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: isSelected ? 700 : 500, color: '#0F172A' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    {description}
                  </div>
                </div>

                <span style={{ fontSize: 13, color: '#94A3B8', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {count}
                </span>

                {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F7931E', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Bottom safe area */}
      <div style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }} />
    </div>
  );
}
