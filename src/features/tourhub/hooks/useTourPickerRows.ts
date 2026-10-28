/**
 * useTourPickerRows — THE tour row model, shared by TourPickerSheet (bottom
 * sheet) and TourGlance (the island tile) so which rows appear, their order
 * and what selecting does can never drift (BRIEF_TOUR_ISLAND §2).
 *
 * Order: All tours first; the active men's major row when there is one; then
 * one row per tour slide in TOUR_ROW_SLUGS order, with season-complete and
 * no-event rows for tours the carousel omits. Selection state and the
 * isSlugAcceptable gate come from TourSelectionContext; both surfaces call
 * selectTour(slug, { tournamentId }) themselves and close themselves.
 *
 * The model carries NO labels or styling: the sheet keeps its uppercase
 * TOUR_LABEL map and gold major row, the tile uses the sentence-case
 * TOUR_DISPLAY map from tourIslandRules.
 */
import { useMemo } from 'react';
import { useHeroCarouselData, mapTourSlug as mapTourSlugForPicker, type HeroSlide } from './useHeroCarouselData';
import { useActiveMensMajor } from './useActiveMensMajor';
import { useTournamentsCache } from '@/hooks/useTournamentsCache';
import { RESULTS_CAP_DAYS, daysSinceEndDate } from '../components/overview-v3/HybridHero.utils';
import { useTourSelection } from '../context/TourSelectionContext';

export type TourPickerRowStatus = 'all' | 'live' | 'completed' | 'upcoming' | 'season' | 'none';

export interface TourPickerRow {
  key: string;
  /** 'all' | 'major' | a real tour slug. */
  slug: string;
  tournamentId: string | null;
  status: TourPickerRowStatus;
  /** Tournament name, or the season-complete event name; null for 'all'/'none'. */
  eventName: string | null;
  startDate: string | null;
  currentRound: number | null;
  /** The active page can express this slug (S2.1). */
  acceptable: boolean;
  selected: boolean;
  /** Never tappable: unacceptable on this tab, no event, or season complete. */
  disabled: boolean;
}

/**
 * THE ROW LIST IS NOT THE LABEL MAP. `all` and `major` have their own
 * hand-built rows at the top; only real tours belong in the loop.
 */
export const TOUR_ROW_SLUGS = ['pga', 'lpga', 'euro', 'pgad', 'champ', 'liv'] as const;

export function useTourPickerRows(): { rows: TourPickerRow[] } {
  const { data: heroSlides } = useHeroCarouselData();
  const { data: cache } = useTournamentsCache();
  const activeMajor = useActiveMensMajor();
  const { selectedTourSlug, viewingTourSlug, viewingTournamentId, appliedTourSlug, isSlugAcceptable } = useTourSelection();

  const activeTourSlug = appliedTourSlug ?? selectedTourSlug ?? viewingTourSlug ?? 'all';
  const isMajorActive = activeTourSlug === 'major';

  const slidesByTour = useMemo(() => {
    const map: Record<string, HeroSlide[]> = {};
    (heroSlides ?? []).forEach((s) => {
      const slug = s.tournament.tourSlug;
      if (slug === 'major') return;
      if (!map[slug]) map[slug] = [];
      map[slug].push(s);
    });
    return map;
  }, [heroSlides]);

  // SEASON COMPLETE (MICRO_BRIEF_TOUR_SEASON_COMPLETE_WINDOW §3). A tour past
  // the hero's RESULTS_CAP_DAYS with no upcoming event is omitted from the
  // carousel, so its row has no slide to describe. Read the last result
  // straight from the (wider) completed bucket instead.
  const seasonCompleteByTour = useMemo(() => {
    const map: Record<string, { name: string; winner: string | null }> = {};
    if (!cache) return map;
    const hasUpcoming = new Set(
      cache.upcoming.map((t) => mapTourSlugForPicker(t.season?.tour_name || '')),
    );
    const hasLive = new Set(
      cache.live.map((t) => mapTourSlugForPicker(t.season?.tour_name || '')),
    );
    [...cache.completed]
      .sort((a, b) => (b.end_date || '').localeCompare(a.end_date || ''))
      .forEach((t) => {
        const slug = mapTourSlugForPicker(t.season?.tour_name || '');
        if (map[slug] || hasUpcoming.has(slug) || hasLive.has(slug)) return;
        const age = daysSinceEndDate(t.end_date);
        if (age == null || age <= RESULTS_CAP_DAYS) return;
        map[slug] = { name: t.name, winner: t.defending_champion ?? null };
      });
    return map;
  }, [cache]);

  return useMemo(() => {
    const rows: TourPickerRow[] = [];

    // All tours — no filter: the hero river stays as it is and every section
    // that can express "all" merges chronologically.
    const allAcceptable = isSlugAcceptable('all');
    rows.push({
      key: 'all', slug: 'all', tournamentId: null, status: 'all',
      eventName: null, startDate: null, currentRound: null,
      acceptable: allAcceptable, selected: activeTourSlug === 'all', disabled: !allAcceptable,
    });

    if (activeMajor) {
      const majorAcceptable = isSlugAcceptable('major');
      rows.push({
        key: 'major', slug: 'major', tournamentId: activeMajor.id, status: activeMajor.status,
        eventName: activeMajor.name, startDate: activeMajor.startDate, currentRound: null,
        acceptable: majorAcceptable, selected: isMajorActive, disabled: !majorAcceptable,
      });
    }

    for (const slug of TOUR_ROW_SLUGS) {
      const tourSlides = slidesByTour[slug] ?? [];
      const seasonDone = seasonCompleteByTour[slug];
      const acceptable = isSlugAcceptable(slug);

      if (tourSlides.length === 0) {
        rows.push({
          key: slug, slug, tournamentId: null,
          status: seasonDone ? 'season' : 'none',
          eventName: seasonDone?.name ?? null, startDate: null, currentRound: null,
          acceptable, selected: false, disabled: true,
        });
        continue;
      }

      for (const slide of tourSlides) {
        const tournament = slide.tournament;
        const selected = !isMajorActive
          && (viewingTournamentId
            ? tournament.id === viewingTournamentId
            : slug === activeTourSlug && slide === tourSlides[0]);
        rows.push({
          key: `${slug}:${tournament.id}`, slug, tournamentId: tournament.id, status: slide.type,
          eventName: tournament.name, startDate: tournament.startDate, currentRound: tournament.currentRound ?? null,
          acceptable, selected, disabled: !acceptable,
        });
      }
    }

    return { rows };
  }, [slidesByTour, seasonCompleteByTour, activeMajor, activeTourSlug, isMajorActive, viewingTournamentId, isSlugAcceptable]);
}
