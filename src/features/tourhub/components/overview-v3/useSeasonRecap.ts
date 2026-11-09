/**
 * SEASON RECAP DATA (rules: seasonRecapRules.ts).
 *
 * useOverviewRecaps — ONE batched read of the most recent completed event per
 * overview tour plus their tour_races rows; OverviewHero combines them with
 * the slides it already has (next events) to decide which tours show a recap.
 *
 * useSeasonRecap — the active recap's figures, read only while a recap slide
 * is on screen:
 *  - season events / winners / most wins: sr_tournaments for the final
 *    event's season_id (completed stroke/team events), winner names from
 *    sr_players by sr_id;
 *  - standings: tour_season_rankings (dated by scraped_at), else the newest
 *    tour_standings_snapshots date — each used ONLY when its own date is on or
 *    after the final event's end date (isFreshStandings). pga instead reads
 *    sr_player_statistics (see freshPgaStandings), dated by updated_at;
 *  - card line: tour_stakes by the per-tour after_position mapping;
 *  - card earners' ages: sr_players.birth_date by sr_players.id.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CachedTournament } from '@/hooks/useTournamentsCache';
import type { HeroTournament } from '../../hooks/useHeroCarouselData';
import type { TourId } from '../../hooks/useOverviewData';
import { OVERVIEW_TOUR_ORDER } from '../../_shared/tourOrder';
import { firstPerTour, mapFallbackTournament } from './useOverviewFallbackSlides';
import {
  RECAP_CARD_LINE, ageAt, displayName, isFreshStandings, seasonWinnerFacts, surname,
  type CardEarner, type StandingRow,
} from './seasonRecapRules';

const SELECT = `
  id, name, status, event_type, start_date, end_date, purse, currency, winning_share,
  venue_id, venue_name, venue_course_name, venue_city, venue_state, venue_country, venue_par, venue_yardage,
  winner_id, defending_champion, champion_narrative, season_id,
  current_round, current_round_status, situation_note,
  season:sr_seasons!inner(id, tour_id, tour_name, year)
`;

export interface OverviewRecapCandidate { last: HeroTournament; seasonId: string | null; raceFinal: boolean }

export async function fetchOverviewRecapCandidates(today: string): Promise<Map<TourId, OverviewRecapCandidate>> {
  const done = await supabase
    .from('sr_tournaments')
    .select(SELECT)
    .in('event_type', ['stroke', 'team'])
    .in('status', ['closed', 'complete'])
    .lte('end_date', today)
    .order('end_date', { ascending: false })
    .limit(500);
  if (done.error) throw done.error;
  const last = firstPerTour((done.data ?? []) as unknown as CachedTournament[], [...OVERVIEW_TOUR_ORDER]);
  const out = new Map<TourId, OverviewRecapCandidate>();
  if (last.size === 0) return out;
  const races = await supabase.from('tour_races').select('tour_code, season_year, status').in('tour_code', [...last.keys()]);
  const finals = new Set<string>();
  for (const r of (races.data ?? []) as Array<{ tour_code: string; season_year: number; status: string }>) {
    if (r.status === 'final') finals.add(`${r.tour_code.toLowerCase()}|${r.season_year}`);
  }
  for (const [tour, row] of last) {
    out.set(tour, {
      last: mapFallbackTournament(row, null),
      seasonId: (row as unknown as { season_id: string | null }).season_id ?? null,
      raceFinal: finals.has(`${tour}|${row.season?.year}`),
    });
  }
  return out;
}

export function useOverviewRecaps(enabled: boolean) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['overview-recap-candidates', today],
    queryFn: () => fetchOverviewRecapCandidates(today),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export interface SeasonRecapData {
  events: number;
  winners: number;
  maxWins: number;
  mostWinsSurname: string | null;
  tiedLeaders: number;
  /** Only when a FRESH source exists; else null and every list part hides. */
  standings: StandingRow[] | null;
  standingsSource: { table: 'tour_season_rankings' | 'tour_standings_snapshots' | 'sr_player_statistics'; date: string } | null;
  cardLine: { label: string; n: number } | null;
  cardEarners: CardEarner[];
}

/**
 * PGA standings: the FedEx Cup race exactly as usePlayersRanking builds the
 * Players page — sr_player_statistics for the season, fedex_points descending,
 * zero/null excluded, rank = sort position. Dated by the newest updated_at.
 */
export async function freshPgaStandings(seasonId: string | null, finalEnd: string): Promise<{ rows: StandingRow[]; source: SeasonRecapData['standingsSource'] } | null> {
  if (!seasonId) return null;
  const r = await supabase
    .from('sr_player_statistics')
    .select('player_id, fedex_points, updated_at')
    .eq('season_id', seasonId)
    .order('fedex_points', { ascending: false, nullsFirst: false })
    .limit(300);
  const stats = ((r.data ?? []) as Array<{ player_id: string; fedex_points: number | string | null; updated_at: string | null }>)
    .filter((s) => s.fedex_points != null && Number(s.fedex_points) > 0)
    .sort((a, b) => Number(b.fedex_points) - Number(a.fedex_points));
  const updated = stats.map((s) => s.updated_at).filter((d): d is string => !!d).sort().pop() ?? null;
  if (stats.length === 0 || !isFreshStandings(updated, finalEnd)) return null;
  return {
    rows: stats.slice(0, 100).map((s, i) => ({ position: i + 1, name: '', points: Number(s.fedex_points), playerId: s.player_id })),
    source: { table: 'sr_player_statistics', date: updated as string },
  };
}

async function freshStandings(tour: TourId, year: number, finalEnd: string, seasonId: string | null = null): Promise<{ rows: StandingRow[]; source: SeasonRecapData['standingsSource'] } | null> {
  if (tour === 'pga') return freshPgaStandings(seasonId, finalEnd);
  const r = await supabase
    .from('tour_season_rankings')
    .select('position, points, player_name, player_id, manual_player_id, scraped_at')
    .ilike('tour_code', tour)
    .eq('season_year', year)
    .order('position', { ascending: true })
    .limit(200);
  const rows = (r.data ?? []) as Array<{ position: number; points: number | null; player_name: string; player_id: string | null; manual_player_id: string | null; scraped_at: string | null }>;
  const scraped = rows.map((x) => x.scraped_at).filter((d): d is string => !!d).sort().pop() ?? null;
  if (rows.length > 0 && isFreshStandings(scraped, finalEnd)) {
    return {
      rows: rows.map((x) => ({ position: x.position, name: displayName(x.player_name), points: x.points, playerId: x.player_id ?? x.manual_player_id })),
      source: { table: 'tour_season_rankings', date: scraped as string },
    };
  }
  // tour_standings_snapshots is deliberately not consulted (see seasonRecapRules header).
  return null;
}

export async function fetchSeasonRecap(tour: TourId, seasonId: string | null, year: number, finalEnd: string): Promise<SeasonRecapData> {
  let events: Array<{ id: string; winner_id: string | null; end_date: string }> = [];
  if (seasonId) {
    const ev = await supabase
      .from('sr_tournaments')
      .select('id, winner_id, end_date')
      .eq('season_id', seasonId)
      .in('event_type', ['stroke', 'team'])
      .in('status', ['closed', 'complete']);
    if (ev.error) throw ev.error;
    events = (ev.data ?? []) as typeof events;
  }
  const facts = seasonWinnerFacts(events.map((e) => ({ id: e.id, winnerId: e.winner_id, endDate: e.end_date })));
  let mostWinsSurname: string | null = null;
  if (facts.leaders.length === 1) {
    const w = await supabase.from('sr_players').select('sr_id, last_name, full_name').eq('sr_id', facts.leaders[0]).maybeSingle();
    const p = w.data as { last_name: string | null; full_name: string | null } | null;
    mostWinsSurname = p?.last_name || surname(p?.full_name) || null;
  }

  const fresh = await freshStandings(tour, year, finalEnd, seasonId);
  let standings = fresh?.rows ?? null;
  let cardLine: SeasonRecapData['cardLine'] = null;
  let cardEarners: CardEarner[] = [];
  const mapping = RECAP_CARD_LINE[tour];
  if (standings) {
    const ids = standings.slice(0, 100).map((x) => x.playerId).filter((x): x is string => !!x);
    const people = new Map<string, { full_name: string | null; birth_date: string | null }>();
    if (ids.length) {
      const pr = await supabase.from('sr_players').select('id, full_name, birth_date').in('id', ids);
      for (const p of (pr.data ?? []) as Array<{ id: string; full_name: string | null; birth_date: string | null }>) people.set(p.id, p);
    }
    standings = standings.map((x) => ({ ...x, name: (x.playerId && people.get(x.playerId)?.full_name) || x.name }));
    if (mapping) {
      const st = await supabase
        .from('tour_stakes')
        .select('line_label, after_position')
        .ilike('tour_code', tour)
        .eq('season_year', year)
        .eq('after_position', mapping.afterPosition)
        .maybeSingle();
      const line = st.data as { line_label: string; after_position: number } | null;
      if (line) {
        cardLine = { label: line.line_label, n: line.after_position };
        cardEarners = standings.slice(0, line.after_position).map((x) => {
          const birth = x.playerId ? people.get(x.playerId)?.birth_date : null;
          return { name: x.name, age: birth ? ageAt(birth, finalEnd) : null };
        });
      }
    }
  }
  return {
    events: facts.events, winners: facts.winners, maxWins: facts.maxWins, mostWinsSurname, tiedLeaders: facts.leaders.length,
    standings, standingsSource: fresh?.source ?? null, cardLine, cardEarners,
  };
}

export function useSeasonRecap(tour: TourId | null, seasonId: string | null, year: number | null, finalEnd: string | null) {
  return useQuery({
    queryKey: ['overview-season-recap', tour, seasonId, year, finalEnd],
    queryFn: () => fetchSeasonRecap(tour as TourId, seasonId, year as number, finalEnd as string),
    enabled: !!tour && year != null && !!finalEnd,
    staleTime: 10 * 60_000,
  });
}
