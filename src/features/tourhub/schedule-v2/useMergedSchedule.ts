/**
 * useMergedSchedule — All Tours chronological merge for schedule-v2.
 *
 * Phase 5B: when the ScheduleTab lens is null (All Tours), we cannot loop
 * useSeasonTimeline per tour (Rules of Hooks) and cannot fan out inside a
 * single hook without a batch query. Instead, we run ONE useQuery against
 * sr_tournaments joined to sr_seasons for the current calendar year across
 * every tour, then decorate and month-group the same way useSeasonTimeline
 * does so ScheduleTab can consume an identical SeasonTimeline shape.
 *
 * Each event carries a resolved `tourSlug` so SeasonRow can render a per-
 * row tour chip. Enrichment (leaders / winners / defenders) reuses the same
 * hooks single-tour mode uses, so live rows still show leaders and
 * completed rows still show champions.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '../_shared/tourOrder';
import {
  LIVE_STATUSES,
  COMPLETED_STATUSES,
  endDateInPast,
} from '../components/overview-v3/useTournamentPulse';
import { getContextLabel } from '../utils/tournamentClassification';
import {
  useTournamentLeadersWinners,
  type TournamentLeaderWinner,
} from '../hooks/useTournamentLeadersWinners';
import { useScheduleDefendingChampionPhotos } from '../hooks/useScheduleDefendingChampionPhotos';
import { isInCurrentWeek } from '../utils/getCurrentWeek';
import type {
  SeasonEvent,
  SeasonTimeline,
  MonthGroup,
  EventState,
} from './useSeasonTimeline';

interface MergedRow {
  id: string;
  season_id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  venue_name: string | null;
  venue_city: string | null;
  venue_country: string | null;
  purse: number | null;
  defending_champion: string | null;
  season?: { tour_name: string | null; tour_full_name: string | null } | null;
}

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}
function monthLabelFromKey(key: string): string {
  const [y, m] = key.split('-');
  const idx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
  return `${MONTH_NAMES[idx]} ${y}`;
}
function todayNoonMs(): number {
  const d = new Date();
  return new Date(`${d.toISOString().split('T')[0]}T12:00:00Z`).getTime();
}
function daysUntil(startDate: string): number | null {
  if (!startDate) return null;
  const t = new Date(`${startDate}T12:00:00Z`).getTime();
  return Math.max(0, Math.ceil((t - todayNoonMs()) / 86_400_000));
}

export function useMergedSchedule(options?: { enabled?: boolean }): {
  data: SeasonTimeline | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const enabled = options?.enabled ?? true;
  const year = new Date().getFullYear();

  const rowsQuery = useQuery({
    queryKey: ['schedule-v2', 'merged-all-tours', year],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MergedRow[]> => {
      const start = `${year}-01-01`;
      const end = `${year + 1}-01-01`;
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(
          'id, season_id, name, status, start_date, end_date, venue_name, venue_city, venue_country, purse, defending_champion, season:sr_seasons(tour_name, tour_full_name)',
        )
        .gte('start_date', start)
        .lt('start_date', end)
        .order('start_date', { ascending: true })
        .limit(1000);
      if (error) {
        console.error('[schedule-v2/merged] fetch failed:', error);
        throw error;
      }
      return (data ?? []) as unknown as MergedRow[];
    },
  });

  const rawRows = rowsQuery.data ?? [];

  // Sort chronologically (query already sorts, this is defensive) and
  // dedupe by id in case the same tournament ends up multi-seasoned.
  const events = useMemo(() => {
    const seen = new Set<string>();
    const out: MergedRow[] = [];
    for (const r of [...rawRows].sort((a, b) =>
      a.start_date.localeCompare(b.start_date),
    )) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  }, [rawRows]);

  const liveIds = events
    .filter((e) => LIVE_STATUSES.has((e.status ?? '').toLowerCase()))
    .map((e) => e.id);
  const completedIds = events
    .filter(
      (e) =>
        COMPLETED_STATUSES.has((e.status ?? '').toLowerCase()) ||
        endDateInPast(e.end_date),
    )
    .map((e) => e.id);

  const { data: leadersWinnersMap } = useTournamentLeadersWinners([
    ...liveIds,
    ...completedIds,
  ]);

  const upcomingForDefenders = useMemo(
    () =>
      events
        .filter(
          (e) =>
            (e.status === 'scheduled' || e.status === 'created') &&
            new Date(`${e.start_date}T12:00:00Z`).getTime() > todayNoonMs() &&
            !!e.defending_champion,
        )
        .map((e) => ({ id: e.id, defending_champion: e.defending_champion })),
    [events],
  );
  const { data: defendingChampionMap } =
    useScheduleDefendingChampionPhotos(upcomingForDefenders);

  const timeline = useMemo<SeasonTimeline | null>(() => {
    if (!rowsQuery.data) return null;
    if (events.length === 0) return null;

    const decorated: SeasonEvent[] = events.map((r, idx) => {
      const statusLc = (r.status ?? '').toLowerCase();
      const isDone =
        COMPLETED_STATUSES.has(statusLc) || endDateInPast(r.end_date);
      const isLive = !isDone && LIVE_STATUSES.has(statusLc);
      const state: EventState = isDone
        ? 'completed'
        : isLive
          ? 'live'
          : 'upcoming';

      const tourFullName =
        r.season?.tour_full_name ?? r.season?.tour_name ?? null;
      const label = getContextLabel({ name: r.name, tourName: tourFullName });
      const isMajor = label === 'MAJOR CHAMPIONSHIP';
      const isPlayoff = label === 'PLAYOFF EVENT';
      const isThisWeek = isInCurrentWeek(r.start_date);
      const tourSlug = mapTourSlug(tourFullName ?? '');

      const evt: SeasonEvent = {
        id: r.id,
        tourSlug,
        name: r.name,
        venueName: r.venue_name,
        venueCity: r.venue_city,
        venueCountry: r.venue_country,
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
        state,
        isMajor,
        isPlayoff,
        isThisWeek,
        daysAway: state === 'upcoming' ? daysUntil(r.start_date) : null,
        contextLabel: label,
        eventNumber: idx + 1,
      };

      if (state === 'completed') {
        const w = leadersWinnersMap?.[r.id] as
          | TournamentLeaderWinner
          | undefined;
        evt.champion = w
          ? {
              playerId: w.playerId,
              name: w.fullName,
              displayName: w.displayName,
              photoUrl: w.photoUrl,
              tourCode: w.tourCode,
              scoreText: w.displayScore || '',
            }
          : null;
      } else if (state === 'live') {
        const l = leadersWinnersMap?.[r.id] as
          | TournamentLeaderWinner
          | undefined;
        evt.leader = l
          ? {
              playerId: l.playerId,
              name: l.fullName,
              displayName: l.displayName,
              photoUrl: l.photoUrl,
              tourCode: l.tourCode,
              totalText: l.displayScore || '',
            }
          : null;
      } else {
        evt.defendingChampion = defendingChampionMap?.get(r.id) ?? null;
      }
      return evt;
    });

    let anchorId: string | null = null;
    let currentEventNumber: number | null = null;
    const liveIdx = decorated.findIndex((e) => e.state === 'live');
    const thisWeekIdx = decorated.findIndex((e) => e.isThisWeek);
    if (liveIdx !== -1) {
      anchorId = decorated[liveIdx].id;
      currentEventNumber = decorated[liveIdx].eventNumber;
    } else if (thisWeekIdx !== -1) {
      anchorId = decorated[thisWeekIdx].id;
      currentEventNumber = decorated[thisWeekIdx].eventNumber;
    } else {
      const upcomingIdx = decorated.findIndex((e) => e.state === 'upcoming');
      if (upcomingIdx !== -1) {
        anchorId = decorated[upcomingIdx].id;
        currentEventNumber = decorated[upcomingIdx].eventNumber;
      } else if (decorated.length > 0) {
        currentEventNumber = decorated[decorated.length - 1].eventNumber;
      }
    }

    const buckets = new Map<string, SeasonEvent[]>();
    for (const e of decorated) {
      const k = monthKey(e.startDate);
      const arr = buckets.get(k) ?? [];
      arr.push(e);
      buckets.set(k, arr);
    }
    const months: MonthGroup[] = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, arr]) => ({
        key: k,
        label: monthLabelFromKey(k),
        events: arr,
      }));

    return {
      seasonName: `${year} Season`,
      seasonYear: year,
      months,
      totalEvents: decorated.length,
      currentEventNumber,
      anchorEventId: anchorId,
    };
  }, [rowsQuery.data, events, leadersWinnersMap, defendingChampionMap, year]);

  return {
    data: timeline,
    isLoading: rowsQuery.isLoading,
    error: (rowsQuery.error as Error) ?? null,
    refetch: rowsQuery.refetch,
  };
}
