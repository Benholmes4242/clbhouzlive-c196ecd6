import { linkedTournamentPlace, TOURNAMENT_COURSE_PLACE_JOIN, type CoursePlaceJoin } from '../_shared/tournamentPlace';
/**
 * useSeasonTimeline — data hook powering the schedule-v2 open-ledger view.
 *
 * SEASON RESOLUTION (PROBE pattern, ported from the former useStatWatch.resolveSeasonIds):
 *   1. Pull sr_seasons rows desc by year (limit 50).
 *   2. Filter to rows whose mapTourSlug(tour_full_name) === requested tour.
 *   3. For pga, prefer exact-name matches over fallback-mapped rows.
 *   3b. The current season by date (currentSeasonFor) is moved to the front.
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
import { currentSeasonFor } from '../_shared/currentSeason';
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
import { weekKey, todayNoonMs, daysUntil, currentRoundFromScores } from './timelineUtils';
import { rowTourIndex } from './scheduleRules';

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
  event_type?: string | null;
  golf_course_id?: string | null;
  course?: CoursePlaceJoin | CoursePlaceJoin[];
  season?: { tour_name: string | null; tour_full_name: string | null; year?: number | null } | null;
}

async function resolveSeasonCandidates(
  tour: TourId,
): Promise<SrSeasonRow[]> {
  const { data, error } = await supabase
    .from('sr_seasons')
    .select('id, tour_full_name, tour_name, year, name, created_at')
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('[schedule-v2] sr_seasons fetch failed:', error);
    throw error;
  }
  const rows = (data ?? []) as SrSeasonRow[];
  const matches = rows.filter(
    (r: SrSeasonRow) => mapTourSlug(r.tour_full_name) === tour,
  );

  // Same tie-break as the former useStatWatch: prefer exact 'pga' string matches over
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

  if (matches.length === 0) {
    const distinctTours = Array.from(
      new Set(rows.map((r) => r.tour_full_name ?? '(null)')),
    );
    console.warn(
      '[schedule-v2] empty season candidates for tour:',
      tour,
      '| fetched rows:',
      rows.length,
      '| distinct tour_full_name seen:',
      distinctTours,
    );
  }

  return sorted.slice(0, 8);
}

/** Current season (by date) first; the rest keep their order, so next season stays a probe fallback. */
export function currentFirst<T extends { id: string }>(cands: T[], currentId: string | null | undefined): T[] {
  if (!currentId) return cands;
  const hit = cands.find((c) => c.id === currentId);
  return hit ? [hit, ...cands.filter((c) => c !== hit)] : cands;
}


const TOURNAMENT_SELECT =
  `id, season_id, name, status, start_date, end_date, venue_name, venue_city, venue_country, purse, defending_champion, event_type, golf_course_id, season:sr_seasons(tour_name, tour_full_name, year), ${TOURNAMENT_COURSE_PLACE_JOIN}`;

/** Fetch every tournament under every candidate season row of one year
 *  (the same-year widening that lets cross-tour miscoded majors ride
 *  along). Returns [] when no candidate of that year exists. */
async function fetchYearRows(
  candidates: SrSeasonRow[],
  year: number,
  fallbackId?: string,
): Promise<SrTournamentRow[]> {
  const seasonIds = candidates
    .filter((c) => c.year != null && c.year === year)
    .map((c) => c.id);
  const idsToQuery = seasonIds.length > 0 ? seasonIds : fallbackId ? [fallbackId] : [];
  if (idsToQuery.length === 0) return [];
  const { data, error } = await supabase
    .from('sr_tournaments')
    .select(TOURNAMENT_SELECT)
      .in('season_id', idsToQuery)
      .order('start_date', { ascending: true });
  if (error) {
    console.error('[schedule-v2] sr_tournaments fetch failed for year', year, error);
    throw error;
  }
  return (data ?? []) as unknown as SrTournamentRow[];
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
    const rows = await fetchYearRows(candidates, cand.year ?? -1, cand.id);
    return { season: cand, rows };
  }
  return { season: null, rows: [] };
}

// ─── Per-event derived shape ──────────────────────────────────────────────

export type EventState = 'completed' | 'live' | 'upcoming';

export interface SeasonEvent {
  id: string;
  /** Canonical tour slug for the row. Populated in BOTH modes: the rebuilt
   *  row always prints a tour label and weeks sort by tour order. */
  tourSlug?: TourId;
  name: string;
  venueName: string | null;
  venueCity: string | null;
  /** Place from the linked course; SeasonRow prefers it over venueCity. */
  coursePlace?: string | null;
  venueCountry: string | null;
  purse: number | null;
  /** sr_tournaments.event_type — 'team' drives the TEAM tag. */
  eventType: string | null;
  /** Linked course id — drives the member's "You've played here" line. */
  golfCourseId: string | null;
  startDate: string;
  endDate: string;
  status: string;
  state: EventState;
  /** The season year this event belongs to (from its sr_seasons join). */
  seasonYear?: number | null;
  /** True when the event sits in the CURRENT season (currentSeasonFor). */
  inCurrentSeason?: boolean;
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
    /** Numeric score to par — drives getScoreColor. */
    score: number | null;
  } | null;
  /** Live leader (only populated on inprogress events). */
  leader?: {
    playerId: string | null;
    name: string;
    displayName: string;
    photoUrl: string | null;
    tourCode: string | null;
    totalText: string;
    /** Numeric score to par — drives getScoreColor. */
    score: number | null;
    /** Rows sharing position 1 (1 = outright leader). */
    tiedCount: number;
    /** Current round (1–4), derived from the latest non-null round score. */
    currentRound: number | null;
  } | null;
  /** Defending champion (upcoming rows). */
  defendingChampion?: DefendingChampionEntry | null;
}

export interface WeekGroup {
  key: string; // yyyy-MM-dd of the week's Monday
  events: SeasonEvent[];
}

export interface SeasonTimeline {
  seasonName: string | null;
  seasonYear: number | null;
  weeks: WeekGroup[];
  /** CURRENT season's event count — never the merged list's length. */
  totalEvents: number;
  currentEventNumber: number | null; // 1-based; null when no anchor
  anchorEventId: string | null; // this-week row, else next upcoming
  /** Previous/current/next season summaries, oldest first (single-tour only). */
  seasons?: SeasonSpan[];
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


// ─── The hook ─────────────────────────────────────────────────────────────

export function useSeasonTimeline(
  tour: TourId,
  { enabled = true }: { enabled?: boolean } = {},
): {
  data: SeasonTimeline | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  // 1. Season + raw tournament rows for the requested tour.
  const seasonQuery = useQuery({
    queryKey: ['schedule-v2', 'season-rows', tour],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const candidates = await resolveSeasonCandidates(tour);
      if (candidates.length === 0) {
        console.warn('[schedule-v2] no season candidates for tour:', tour);
        return { season: null as SrSeasonRow | null, rows: [] as SrTournamentRow[] };
      }
      // Default to the current season by date, not the newest year (next season loads early).
      const current = await currentSeasonFor(tour).catch(() => null);
      const found = await probeAndFetchTournaments(tour, currentFirst(candidates, current?.id));
      /* SCHEDULE ACROSS SEASONS: the list runs previous → current → next.
         The neighbouring years are fetched when their season rows exist;
         a year with no rows simply doesn't appear. */
      const year = found.season?.year ?? current?.year ?? null;
      if (year == null) return found;
      const [prevRows, nextRows] = await Promise.all([
        fetchYearRows(candidates, year - 1),
        fetchYearRows(candidates, year + 1),
      ]);
      const seen = new Set(found.rows.map((r) => r.id));
      const extra = [...prevRows, ...nextRows].filter((r) => !seen.has(r.id));
      return { season: found.season, rows: [...found.rows, ...extra] };
    },
  });

  const rawRows = seasonQuery.data?.rows ?? [];
  const currentYear = seasonQuery.data?.season?.year ?? null;

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

  const { data: leadersWinnersMap } = useTournamentLeadersWinners(
    enabled ? [...liveIds, ...completedIds] : [],
    1,
  );

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
  const { data: defendingChampionMap } = useScheduleDefendingChampionPhotos(
    enabled ? upcomingForDefenders : [],
  );

  // 4. Compose the timeline.
  const timeline = useMemo<SeasonTimeline | null>(() => {
    if (!seasonQuery.data) return null;
    const season = seasonQuery.data.season;
    if (!season && events.length === 0) return null;

    /* Counters stay CURRENT-SEASON ONLY: eventNumber, totalEvents, the
       anchor and currentEventNumber all describe the current season even
       though the list runs previous → current → next. */
    let currentSeq = 0;
    const decorated: SeasonEvent[] = events.map((r) => {
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
      const seasonYear = r.season?.year ?? null;
      const inCurrent = seasonYear != null && currentYear != null && seasonYear === currentYear;
      if (inCurrent) currentSeq += 1;

      const evt: SeasonEvent = {
        id: r.id,
        tourSlug: tour,
        name: r.name,
        venueName: r.venue_name,
        venueCity: r.venue_city,
        coursePlace: linkedTournamentPlace(r.golf_course_id, r.course),
        venueCountry: r.venue_country,
        purse: r.purse,
        eventType: r.event_type ?? null,
        golfCourseId: r.golf_course_id ?? null,
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
        state,
        seasonYear,
        inCurrentSeason: inCurrent,
        isMajor,
        isPlayoff,
        isThisWeek,
        daysAway: state === 'upcoming' ? daysUntil(r.start_date) : null,
        contextLabel: label,
        eventNumber: inCurrent ? currentSeq : 0,
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
            scoreText: w.displayScore || '',
            score: w.score ?? null,
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
            score: l.score ?? null,
            tiedCount: l.tiedCount ?? 1,
            currentRound: currentRoundFromScores(l),
          };
        } else {
          evt.leader = null;
        }
      } else {
        // upcoming
        const def = defendingChampionMap?.get(r.id) ?? null;
        evt.defendingChampion = def;
      }

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

    // Week bucket (Monday→Sunday), preserve sort order; within a week sort by
    // start date then the schedule tour order (BRIEF_TOUR_SCHEDULE_REBUILT §3).
    const buckets = new Map<string, SeasonEvent[]>();
    for (const e of decorated) {
      const k = weekKey(e.startDate);
      const arr = buckets.get(k) ?? [];
      arr.push(e);
      buckets.set(k, arr);
    }
    const weeks: WeekGroup[] = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, arr]) => ({
        key: k,
        events: arr.sort(
          (a, b) =>
            a.startDate.localeCompare(b.startDate) ||
            rowTourIndex(a.tourSlug) - rowTourIndex(b.tourSlug) ||
            a.name.localeCompare(b.name),
        ),
      }));

    return {
      seasonName: season?.name ?? null,
      seasonYear: season?.year ?? null,
      weeks,
      totalEvents: total,
      currentEventNumber,
      anchorEventId: anchorId,
    };
  }, [seasonQuery.data, events, leadersWinnersMap, defendingChampionMap]);

  return {
    data: timeline,
    isLoading: seasonQuery.isLoading,
    error: (seasonQuery.error as Error) ?? null,
    refetch: seasonQuery.refetch,
  };
}
