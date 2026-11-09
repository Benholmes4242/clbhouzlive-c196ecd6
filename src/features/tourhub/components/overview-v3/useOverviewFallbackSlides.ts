/**
 * OVERVIEW-ONLY FALLBACK SLIDES (URGENT_FIX close-the-gap §3).
 *
 * Every tour in OVERVIEW_TOUR_ORDER always has a chip and a slide. The
 * carousel's buckets (useHeroCarouselData) only span a few weeks, so a tour
 * in a week off or between seasons can drop out. For each overview tour the
 * carousel did NOT supply, this hook fetches — in ONE batched read for all
 * missing tours — the next scheduled event at any distance (sr_tournaments ⋈
 * sr_seasons, status created/scheduled, start_date ≥ today, earliest first).
 * Only tours still missing after that get one batched read of the most recent
 * completed event. Rows are mapped to HeroSlide with the carousel's own field
 * mapping so they render through the normal upcoming / completed states.
 *
 * useHeroCarouselData's output is never changed: other surfaces read it.
 * A tour with neither a future nor a past event gets no slide.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CachedTournament } from '@/hooks/useTournamentsCache';
import { TOUR_CONFIG, type TourId } from '../../hooks/useOverviewData';
import { mapTourSlug, type HeroSlide, type HeroTournament } from '../../hooks/useHeroCarouselData';
import { OVERVIEW_TOUR_ORDER } from '../../_shared/tourOrder';
import { getContextLabel } from '../../utils/tournamentClassification';
import { isAnyMajor } from '../../utils/majorScope';

const SELECT = `
  id, name, status, event_type, start_date, end_date, purse, currency, winning_share,
  venue_id, venue_name, venue_course_name, venue_city, venue_state, venue_country, venue_par, venue_yardage,
  winner_id, defending_champion, champion_narrative, season_id,
  current_round, current_round_status, situation_note,
  season:sr_seasons!inner(id, tour_id, tour_name, year)
`;

type Winner = { sr_id: string; first_name: string | null; last_name: string | null; photo_url: string | null; pga_tour_id: string | null; headshot_override: string | null };

/** Same field mapping as useHeroCarouselData's transformTournament. A
 *  completed fallback names its winner only from the authoritative winner_id. */
export function mapFallbackTournament(row: CachedTournament, winner: Winner | null): HeroTournament {
  const tourSlug = mapTourSlug(row.season?.tour_name || '');
  const contextLabel = getContextLabel({ name: row.name, tourName: row.season?.tour_name });
  return {
    id: row.id,
    pickTourCode: tourSlug,
    seasonYear: row.season.year,
    name: row.name,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    venueName: row.venue_name,
    venueCourseName: row.venue_course_name,
    venueCity: row.venue_city,
    venueState: row.venue_state,
    venueCountry: row.venue_country,
    venuePar: row.venue_par,
    venueYardage: row.venue_yardage,
    purse: row.purse,
    winningShare: row.winning_share,
    currency: row.currency,
    tourSlug,
    tourName: TOUR_CONFIG[tourSlug]?.name || 'PGA Tour',
    defendingChampion: row.defending_champion || null,
    defendingChampionPhotoUrl: null,
    defendingChampionPgaTourId: null,
    isMajor: contextLabel === 'MAJOR CHAMPIONSHIP' || isAnyMajor(row.name || ''),
    isSignature: contextLabel === 'SIGNATURE EVENT' || contextLabel === 'ROLEX SERIES',
    eventType: row.event_type ?? null,
    winnerId: row.winner_id,
    winnerName: winner ? `${winner.first_name ?? ''} ${winner.last_name ?? ''}`.trim() || null : null,
    winnerPhotoUrl: winner?.photo_url ?? null,
    winnerHeadshotOverride: winner?.headshot_override ?? null,
    winnerKey: winner?.sr_id ?? null,
    winnerPgaTourId: winner?.pga_tour_id ?? null,
    winnerScore: null,
    leaderScore: null,
    leaderName: null,
    currentRound: row.current_round ?? null,
    currentRoundStatus: row.current_round_status ?? null,
    situationNote: row.situation_note ?? null,
  };
}

/** First row per missing tour, preserving the query's order. */
export function firstPerTour(rows: CachedTournament[], missing: TourId[]): Map<TourId, CachedTournament> {
  const out = new Map<TourId, CachedTournament>();
  for (const row of rows) {
    const tour = mapTourSlug(row.season?.tour_name || '');
    if (missing.includes(tour) && !out.has(tour)) out.set(tour, row);
  }
  return out;
}

export async function fetchOverviewFallbackSlides(missing: TourId[], today: string): Promise<HeroSlide[]> {
  if (missing.length === 0) return [];
  const future = await supabase
    .from('sr_tournaments')
    .select(SELECT)
    .in('event_type', ['stroke', 'team'])
    .in('status', ['created', 'scheduled'])
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(500);
  if (future.error) throw future.error;
  const next = firstPerTour((future.data ?? []) as unknown as CachedTournament[], missing);
  const stillMissing = missing.filter((tour) => !next.has(tour));
  let past = new Map<TourId, CachedTournament>();
  if (stillMissing.length > 0) {
    const done = await supabase
      .from('sr_tournaments')
      .select(SELECT)
      .in('event_type', ['stroke', 'team'])
      .in('status', ['closed', 'complete'])
      .lte('end_date', today)
      .order('end_date', { ascending: false })
      .limit(500);
    if (done.error) throw done.error;
    past = firstPerTour((done.data ?? []) as unknown as CachedTournament[], stillMissing);
  }
  const winnerIds = [...past.values()].map((r) => r.winner_id).filter((id): id is string => !!id);
  const winners = new Map<string, Winner>();
  if (winnerIds.length > 0) {
    const res = await supabase
      .from('sr_players')
      .select('sr_id, first_name, last_name, photo_url, pga_tour_id, headshot_override')
      .in('sr_id', winnerIds);
    for (const w of (res.data ?? []) as Winner[]) winners.set(w.sr_id, w);
  }
  const slides: HeroSlide[] = [];
  for (const tour of missing) {
    const up = next.get(tour);
    if (up) { slides.push({ tournament: mapFallbackTournament(up, null), type: 'upcoming' }); continue; }
    const last = past.get(tour);
    if (last) slides.push({ tournament: mapFallbackTournament(last, last.winner_id ? winners.get(last.winner_id) ?? null : null), type: 'completed' });
  }
  return slides;
}

export function useOverviewFallbackSlides(present: ReadonlyArray<HeroSlide>, ready: boolean) {
  const have = new Set(present.map((s) => s.tournament.tourSlug));
  const missing = OVERVIEW_TOUR_ORDER.filter((tour) => !have.has(tour));
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['overview-fallback-slides', missing.join(','), today],
    queryFn: () => fetchOverviewFallbackSlides(missing, today),
    enabled: ready && missing.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
