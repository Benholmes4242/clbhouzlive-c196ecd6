import { useUserTopLegends } from './useUserTopLegends';
import type { LegendWindow } from '@/lib/gam/types';

/**
 * Returns the number of #1 "title" positions the viewer currently holds
 * across all courses, scoped to the given time window. Drives the hero
 * headline "You hold N titles" in the Course Legends section.
 */
export function useUserLegendTitleCount(
  userId: string | undefined,
  window: LegendWindow,
) {
  const query = useUserTopLegends(userId, {
    limit: 500,
    maxRank: 1,
    window,
  });
  return { ...query, data: query.data?.length ?? 0 };
}
