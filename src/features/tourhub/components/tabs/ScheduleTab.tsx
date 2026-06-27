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
import { AlertCircle } from 'lucide-react';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { useScheduleDefendingChampionPhotos } from '../../hooks/useScheduleDefendingChampionPhotos';
import { deriveFieldStrength } from '../../utils/deriveFieldStrength';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { getTourLabel, getTourMeta } from '../../constants/tourMap';
import { getCurrentWeek, getCurrentMonthKey, isInCurrentWeek } from '../../utils/getCurrentWeek';
import { CompactNextUp } from '../shared/CompactNextUp';
import { ThisWeekAnchor } from '../shared/ThisWeekAnchor';

import {
  type ScheduleFilterType,
  ScheduleTournamentCard,
  ScheduleMonthHeader,
  ScheduleEmptyMessage,
  type TourFilterCode,
} from '../schedule';

import { useLiveRightNow } from '../../hooks/useOverviewModules';
import { AMBER, INK, INK_MUTE, INK_FAINT, INK_TINT_07, HAIRLINE_INK_10, SLATE_50, SURFACE } from '../../_shared/tokens';

// B45 FIX 1: Helper for completed status check
const isCompleted = (t: TourTournament) => t.status === 'closed' || t.status === 'complete';

// Noon-anchor today for timezone-safe date comparisons (matches T12:00:00Z pattern in this file)
const todayNoonMs = () => {
  const d = new Date();
  return new Date(`${d.toISOString().split('T')[0]}T12:00:00Z`).getTime();
};
const notStarted = (t: TourTournament) => {
  if (!t.start_date) return false;
  return new Date(`${t.start_date}T12:00:00Z`).getTime() > todayNoonMs();
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

export function ScheduleTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const thisWeekAnchorRef = useRef<HTMLDivElement>(null);
  const [isThisWeekVisible, setIsThisWeekVisible] = useState(true);
  const hasAutoScrolledAllTab = useRef(false);

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
    const t = setTimeout(() => {
      const el = document.getElementById(`month-${currentMonthKey}`);
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: 'auto' });
        hasAutoScrolledAllTab.current = true;
      }
    }, 80);
    return () => clearTimeout(t);
  }, [filter, currentMonthKey]);

  const setActiveTour = useCallback((t: TourFilterCode) => {
    const params = new URLSearchParams(searchParams);
    if (t === 'all') { params.delete('tour'); } else { params.set('tour', t); }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const search: string = '';

  const setFilter = useCallback((f: ScheduleFilterType) => {
    const params = new URLSearchParams(searchParams);
    if (f === 'all') params.delete('filter'); else params.set('filter', f);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0 });
  }, [searchParams, setSearchParams]);

  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading, error, refetch } = useTourTournaments(season?.id, {
    refetchInterval: filter === 'live' ? 30000 : filter === 'upcoming' ? 60000 : false,
  });

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
      .filter((t) => (t.status === 'scheduled' || t.status === 'created') && notStarted(t) && !!t.defending_champion)
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
      // Defensive: past events with stale 'scheduled' status don't count as upcoming
      upcoming: tourFiltered.filter(t => (t.status === 'scheduled' || t.status === 'created') && notStarted(t)).length,
      // B45 FIX 1: include 'complete'
      completed: tourFiltered.filter(isCompleted).length,
    };
  }, [tournaments, activeTour]);

  const nextUpTournament = useMemo(() => {
    if (!tournaments) return null;
    return [...tournaments]
      .filter(t => (t.status === 'scheduled' || t.status === 'created') && notStarted(t))
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
      // Defensive: filter out past events with stale 'scheduled' status
      case 'upcoming': statusFiltered = statusFiltered.filter(t => (t.status === 'scheduled' || t.status === 'created') && notStarted(t)); break;
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
      .filter(t => (t.status === 'scheduled' || t.status === 'created') && notStarted(t))
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
  }, [tournaments]);

  const filteredResults = useMemo(() => {
    if (!tournaments) return [];
    let filtered = [...tournaments];
    if (activeTour !== 'all') filtered = filtered.filter(t => t.tour_code === activeTour);
    switch (filter) {
      // Defensive: filter out past events with stale 'scheduled' status
      case 'upcoming': filtered = filtered.filter(t => (t.status === 'scheduled' || t.status === 'created') && notStarted(t)); break;
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
    return entries.map(([monthKey, tournaments]) => ({
      monthKey,
      // B42 FIX 3: title case from source, no toUpperCase
      monthLabel: format(new Date(tournaments[0].start_date + 'T12:00:00Z'), 'MMMM yyyy'),
      tournaments,
    }));
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
    <div className="min-h-screen -mx-5" style={{ background: SLATE_50 }}>

      {/* ── SCHEDULE MASTHEAD — canonical section header on all tabs ── */}
      {!search && (() => {
        const tourCount = new Set(
          (tournaments ?? []).map(t => t.tour_code).filter(Boolean) as string[]
        ).size;
        const seasonLabel = season?.name ?? (season?.year ? `${season.year} Season` : 'Season');
        return (
          <div style={{ padding: '16px 16px 0', background: SLATE_50 }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              fontSize: 13,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.005em',
              lineHeight: 1.25,
              margin: 0,
              paddingBottom: 12,
            }}>

              <span>{seasonLabel}</span>
              <span style={{ fontWeight: 600, color: INK_FAINT }}>
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
          courseName={(nextUpTournament as any).venue_course_name}
          city={(nextUpTournament as any).venue_city}
          state={(nextUpTournament as any).venue_state}
          par={(nextUpTournament as any).venue_par}
          yardage={(nextUpTournament as any).venue_yardage}
          purse={(nextUpTournament as any).purse}
        />
      )}

      {/* LiveRightNow removed during Tour Overview hero nuke; rebuild pending. */}


      <div style={{ background: SLATE_50, marginTop: '8px' }}>

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
                          <div style={{ borderBottom: idx < group.tournaments.length - 1 ? `0.5px solid ${INK_TINT_07}` : 'none' }}>
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
                      <div style={{ height: '1px', background: HAIRLINE_INK_10 }} />
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


      {/* Bottom safe area */}
      <div style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }} />
    </div>
  );
}
