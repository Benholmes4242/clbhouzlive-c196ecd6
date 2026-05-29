/**
 * useHeroSlidesHybrid — Overview hero slides under the two-state model.
 * LIVE tours → one 'live' slide each; non-live → one 'recapNext' slide per
 * tour pairing the most recent completed event (optional) with the next
 * upcoming event. Built on useHeroCarouselData (no new fetch).
 */
import { useMemo } from 'react';
import {
  useHeroCarouselData,
  type HeroSlide,
  type HeroTournament,
} from './useHeroCarouselData';
import type { TourId } from './useOverviewData';

export interface HybridHeroSlide {
  id: string;
  tourSlug: TourId;
  kind: 'live' | 'recapNext';
  live?: HeroTournament;
  completed?: HeroTournament;
  upcoming?: HeroTournament;
}

export function useHeroSlidesHybrid() {
  const { data: rawSlides = [], isLoading } = useHeroCarouselData();

  const slides = useMemo<HybridHeroSlide[]>(() => {
    if (!Array.isArray(rawSlides) || rawSlides.length === 0) return [];

    const liveByTour = new Map<TourId, HeroTournament[]>();
    const completedByTour = new Map<TourId, HeroTournament[]>();
    const upcomingByTour = new Map<TourId, HeroTournament[]>();

    const push = (m: Map<TourId, HeroTournament[]>, s: HeroSlide) => {
      const slug = s.tournament.tourSlug;
      const arr = m.get(slug) ?? [];
      arr.push(s.tournament);
      m.set(slug, arr);
    };

    for (const s of rawSlides) {
      if (s.type === 'live') push(liveByTour, s);
      else if (s.type === 'completed') push(completedByTour, s);
      else push(upcomingByTour, s);
    }

    const out: HybridHeroSlide[] = [];

    for (const [slug, tournaments] of liveByTour) {
      for (const t of tournaments) {
        out.push({ id: t.id, tourSlug: slug, kind: 'live', live: t });
      }
    }

    const nonLiveTours = new Set<TourId>([
      ...upcomingByTour.keys(),
      ...completedByTour.keys(),
    ]);

    for (const slug of nonLiveTours) {
      if (liveByTour.has(slug)) continue;
      const completedList = [...(completedByTour.get(slug) ?? [])].sort(
        (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
      );
      const upcomingList = [...(upcomingByTour.get(slug) ?? [])].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
      const completed = completedList[0];
      const upcoming = upcomingList[0];
      if (!completed && !upcoming) continue;
      const lead = upcoming ?? completed!;
      out.push({ id: lead.id, tourSlug: slug, kind: 'recapNext', completed, upcoming });
    }

    return out;
  }, [rawSlides]);

  return { slides, isLoading };
}
