/**
 * useSeasonTimeline — data hook powering the schedule-v2 open-ledger view.
 *
 * SEASON RESOLUTION (PROBE pattern, ported from useStatWatch.resolveSeasonIds):
 *   1. Pull sr_seasons rows desc by year (limit 50).
 *   2. Filter to rows whose mapTourSlug(tour_full_name) === requested tour.
 *   3. For pga, prefer exact-name matches over fallback-mapped rows.
 *   4. Probe each candidate .limit(1) against sr_tournaments; first hit wins.
 *   Never silent — every error path is console.error'd with [schedule-v2].
 *
 * TIMELINE SHAPE: sorted list of events (start_date asc) grouped into
 * months. Each event carries per-state enrichment (leader for live rows,
 * champion for completed rows). Champions/leaders come from
 * useTournamentLeadersWinners — the same source used across ScheduleTab
 * today. Defending champions come from useScheduleDefendingChampionPhotos.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '../_shared/tourOrder';
import { LIVE_STATUSES, COMPLETED_STATUSES, endDateInPast } from '../components/overview-v3/useTournamentPulse';
import type { TourId } from '../hooks/useOverviewData';
import { getContextLabel } from '../utils/tournamentClassification';
import {
  useTournamentLeadersWinners,
  type TournamentLeaderWinner,
} from '../hooks/useTournamentLeadersWinners';
import {
  useScheduleDefendingChampionPhotos,
  type DefendingChampionEntry,
} from '../hooks/useScheduleDefendingChampionPhotos';
import { isInCurrentWeek } from '../utils/getCurrentWeek';

// ─── Season → tournament resolution ───────────────────────────────────────

interface SrSeasonRow {
  id: string;
  tour_full_name: string | null;
  tour_name: string | null;
  year: number | null;
  name: string | null;
}

interface SrTournamentRow {
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

async function resolveSeasonCandidates(
  tour: TourId,
): Promise<SrSeasonRow[]> {
  const { data, error } = await supabase
    .from('sr_seasons')
    .select('id, tour_full_name, tour_name, year, name')
    .order('year', { ascending: false })
    .limit(50);
  if (error) {
    console.error('[schedule-v2] sr_seasons fetch failed:', error);
    throw error;
  }
  const matches = (data ?? []).filter(
    (r: any) => mapTourSlug(r.tour_full_name) === tour,
  ) as SrSeasonRow[];

  // Same tie-break as useStatWatch: prefer exact 'pga' string matches over
  // fallback-mapped rows so DP-World / LIV rows can't masquerade as pga.
  const sorted =
    tour === 'pga'
      ? [...matches].sort((a, b) => {
          const aExact = /pga/.test((a.tour_full_name ?? '').toLowerCase()) ? 0 : 1;
          const bExact = /pga/.test((b.tour_full_name ?? '').toLowerCase()) ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
          return (b.year ?? 0) - (a.year ?? 0);
        })
      : matches;

  if (tour === 'pga') {
    console.log(
      '[schedule-v2] pga season candidates (probe order):',
      sorted.slice(0, 6).map((r) => ({
        id: r.id,
        tour: r.tour_full_name,
        year: r.year,
      })),
    );
  }
  return sorted.slice(0, 8);
}

async function probeAndFetchTournaments(
  tour: TourId,
  candidates: SrSeasonRow[],
): Promise<{ season: SrSeasonRow | null; rows: SrTournamentRow[] }> {
  for (const cand of candidates) {
    const { data: probe, error: pErr } = await supabase
      .from('sr_tournaments')
      .select('id')
      .eq('season_id', cand.id)
      .limit(1);
    if (pErr) {
      console.error('[schedule-v2] probe failed for season', cand.id, pErr);
      throw pErr;
    }
    if ((probe ?? []).length === 0) continue;

    // Winning season found. Widen the fetch to every season row with the
    // same year (so cross-tour miscoded majors ride along), matching the
    // existing useTourTournaments behaviour.
    const seasonIds = candidates
      .filter((c) => c.year != null && c.year === cand.year)
      .map((c) => c.id);
    const idsToQuery = seasonIds.length > 0 ? seasonIds : [cand.id];

    const { data, error } = await supabase
      .from('sr_tournaments')
      .select(
        'id, season_id, name, status, start_date, end_date, venue_name, venue_city, venue_country, purse, defending_champion, season:sr_seasons(tour_name, tour_full_name)',
      )
      .in('season_id', idsToQuery)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('[schedule-v2] sr_tournaments fetch failed:', error);
      throw error;
    }
    return { season: cand, rows: (data ?? []) as unknown as SrTournamentRow[] };
  }
  return { season: null, rows: [] };
}

// ─── Per-event derived shape ──────────────────────────────────────────────

export type EventState = 'completed' | 'live' | 'upcoming';

export interface SeasonEvent {
  id: string;
  name: string;
  venueName: string | null;
  venueCity: string | null;
  venueCountry: string | null;
  startDate: string;
  endDate: string;
  status: string;
  state: EventState;
  isMajor: boolean;
  isPlayoff: boolean;
  isThisWeek: boolean;
  daysAway: number | null;
  contextLabel: string;
  eventNumber: number; // 1-based index within the sorted season
  /** Completed champion (only populated on completed events). */
  champion?: {
    playerId: string | null;
    name: string;
    displayName: string;
    photoUrl: string | null;
    tourCode: string | null;
    scoreText: string;
  } | null;
  /** Live leader (only populated on inprogress events). */
  leader?: {
    playerId: string | null;
    name: string;
    displayName: string;
    photoUrl: string | null;
    tourCode: string | null;
    totalText: string;
  } | null;
  /** Defending champion (upcoming rows). */
  defendingChampion?: DefendingChampionEntry | null;
}

export interface MonthGroup {
  key: string; // yyyy-MM
  label: string; // "APRIL 2026"
  events: SeasonEvent[];
}

export interface SeasonTimeline {
  seasonName: string | null;
  seasonYear: number | null;
  months: MonthGroup[];
  totalEvents: number;
  currentEventNumber: number | null; // 1-based; null when no anchor
  anchorEventId: string | null; // this-week row, else next upcoming
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const MAJOR_KEYWORDS_TO_PGA = [
  'masters tournament',
  'the open championship',
  'u.s. open',
  'us open',
  'pga championship',
];
function reassignMiscodedMajor(
  name: string,
  tourCode: string | null,
): string | null {
  if (tourCode === 'pga') return tourCode;
  const lower = name.toLowerCase();
  const hit = MAJOR_KEYWORDS_TO_PGA.some((k) => lower.includes(k));
  if (hit && !lower.includes('senior') && !lower.includes('women') && !lower.includes('bmw')) {
    return 'pga';
  }
  return tourCode;
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

function fmtScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '';
  if (score === 0) return 'E';
  if (score > 0) return `+${score}`;
  return `${score}`;
}


const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

function monthKey(iso: string): string {
  return iso.slice(0, 7); // yyyy-MM
}
function monthLabelFromKey(key: string): string {
  const [y, m] = key.split('-');
  const idx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
  return `${MONTH_NAMES[idx]} ${y}`;
}

// ─── The hook ─────────────────────────────────────────────────────────────

export function useSeasonTimeline(tour: TourId): {
  data: SeasonTimeline | null;
  isLoading: boolean;
  error: Error | null;
} {
  // 1. Season + raw tournament rows for the requested tour.
  const seasonQuery = useQuery({
    queryKey: ['schedule-v2', 'season-rows', tour],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const candidates = await resolveSeasonCandidates(tour);
      if (candidates.length === 0) {
        console.warn('[schedule-v2] no season candidates for tour:', tour);
        return { season: null as SrSeasonRow | null, rows: [] as SrTournamentRow[] };
      }
      const result = await probeAndFetchTournaments(tour, candidates);
      console.log(
        '[schedule-v2] resolved season for tour',
        tour,
        '→',
        result.season?.name,
        '(events:',
        result.rows.length + ')',
      );
      return result;
    },
  });

  const rawRows = seasonQuery.data?.rows ?? [];

  // 2. Filter rows to the requested tour (respecting cross-tour miscoded majors).
  const events = useMemo(() => {
    return rawRows
      .filter((r) => {
        const dbCode = r.season?.tour_name ?? null;
        const effective = reassignMiscodedMajor(r.name, dbCode);
        // effective is a raw string; map through mapTourSlug for canonical id.
        const slug = mapTourSlug(
          effective === 'pga'
            ? 'pga'
            : (r.season?.tour_full_name ?? r.season?.tour_name ?? ''),
        );
        return slug === tour;
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [rawRows, tour]);

  // 3. Split by state for the enrichment queries — use the house pulse sets.
  const liveIds = events
    .filter((e) => LIVE_STATUSES.has((e.status ?? '').toLowerCase()))
    .map((e) => e.id);
  const completedIds = events
    .filter((e) => COMPLETED_STATUSES.has((e.status ?? '').toLowerCase()) || endDateInPast(e.end_date))
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

  // 4. Compose the timeline.
  const timeline = useMemo<SeasonTimeline | null>(() => {
    if (!seasonQuery.data) return null;
    const season = seasonQuery.data.season;
    if (!season && events.length === 0) return null;

    const total = events.length;
    const noon = todayNoonMs();

    const decorated: SeasonEvent[] = events.map((r, idx) => {
      const startMs = new Date(`${r.start_date}T12:00:00Z`).getTime();
      const endMs = new Date(`${r.end_date}T12:00:00Z`).getTime();
      const statusLc = (r.status ?? '').toLowerCase();
      const isDone = COMPLETED_STATUSES.has(statusLc) || endDateInPast(r.end_date);
      const isLive = !isDone && LIVE_STATUSES.has(statusLc);
      const state: EventState = isDone
        ? 'completed'
        : isLive
          ? 'live'
          : 'upcoming';

      // Tour-aware classification. Feed the effective full-name so the
      // helper's tour branches fire correctly on miscoded majors.
      const tourFullName = r.season?.tour_full_name ?? r.season?.tour_name ?? null;
      const label = getContextLabel({ name: r.name, tourName: tourFullName });
      const isMajor = label === 'MAJOR CHAMPIONSHIP';
      const isPlayoff = label === 'PLAYOFF EVENT';

      const isThisWeek = isInCurrentWeek(r.start_date);

      const evt: SeasonEvent = {
        id: r.id,
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
        if (w) {
          evt.champion = {
            playerId: w.playerId,
            name: w.fullName,
            displayName: w.displayName,
            photoUrl: w.photoUrl,
            tourCode: w.tourCode,
            scoreText:
              w.displayScore || '',
          };
        } else {
          evt.champion = null;
        }
      } else if (state === 'live') {
        const l = leadersWinnersMap?.[r.id] as
          | TournamentLeaderWinner
          | undefined;
        if (l) {
          evt.leader = {
            playerId: l.playerId,
            name: l.fullName,
            displayName: l.displayName,
            photoUrl: l.photoUrl,
            tourCode: l.tourCode,
            totalText: l.displayScore || '',
          };
        } else {
          evt.leader = null;
        }
      } else {
        // upcoming
        const def = defendingChampionMap?.get(r.id) ?? null;
        evt.defendingChampion = def;
      }

      // suppress unused startMs/endMs — kept for readability
      void startMs;
      void endMs;
      void noon;
      return evt;
    });

    // Anchor priority: live row, then this-week row, then first upcoming.
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

    // Month bucket, preserve sort order.
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
      seasonName: season?.name ?? null,
      seasonYear: season?.year ?? null,
      months,
      totalEvents: total,
      currentEventNumber,
      anchorEventId: anchorId,
    };
  }, [seasonQuery.data, events, leadersWinnersMap, defendingChampionMap]);

  return {
    data: timeline,
    isLoading: seasonQuery.isLoading,
    error: (seasonQuery.error as Error) ?? null,
  };
}
