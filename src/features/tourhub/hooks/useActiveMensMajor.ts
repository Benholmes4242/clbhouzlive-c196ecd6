/**
 * useActiveMensMajor — returns the currently active men's major (if any).
 *
 * A men's major is "active" when its sr_tournaments row is inprogress OR
 * starts within 10 days. Uses the shared tournaments cache — no extra query.
 *
 * Consumed by:
 *  - useHeroCarouselData: to promote the major into a synthetic 'major'
 *    pseudo-tour slide and evict it from its native tour bucket.
 *  - TourSwitcherAffordance: to render the pinned gold MAJORS row.
 */

import { useMemo } from 'react';
import { useTournamentsCache } from '@/hooks/useTournamentsCache';
import { getMajorType } from '../utils/majorScope';

export const MAJOR_WINDOW_DAYS = 10;

export interface ActiveMensMajor {
  id: string;
  name: string;
  startDate: string;
  status: 'live' | 'upcoming';
}

export function useActiveMensMajor(): ActiveMensMajor | null {
  const { data: cache } = useTournamentsCache();
  return useMemo(() => {
    if (!cache) return null;
    const now = Date.now();

    const live = cache.live.find(t => getMajorType(t.name || '') === 'mens');
    if (live) {
      return { id: live.id, name: live.name, startDate: live.start_date, status: 'live' };
    }

    const soon = cache.upcoming
      .filter(t => getMajorType(t.name || '') === 'mens')
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .find(t => {
        const start = new Date(t.start_date + 'T12:00:00Z').getTime();
        return (start - now) <= MAJOR_WINDOW_DAYS * 86_400_000;
      });
    if (soon) {
      return { id: soon.id, name: soon.name, startDate: soon.start_date, status: 'upcoming' };
    }
    return null;
  }, [cache]);
}
