import { useQuery } from '@tanstack/react-query';

import { fetchCircleCount } from '@/lib/social/circle';

/**
 * DOES THIS MEMBER HAVE A CIRCLE AT ALL?
 * (BRIEF_EXPLORE_FIXED_ENTRY_STATE §2 C1 vs C2.)
 *
 * An empty circle board has TWO different causes and they need different
 * answers: a quiet fortnight (C1) is not a problem to solve, while an empty
 * circle (C2) is the cold start. One head-count read separates them; it is only
 * asked for when the board comes back empty.
 *
 * IT USED TO COUNT EVERY ROW OF `follows` (BRIEF_CIRCLE_DEFINITION §6). That
 * included follows of BUSINESS profiles, so 48 of 101 members were told they
 * had a circle when the circle pool - which only ever contained people - found
 * nobody. The count now comes from src/lib/social/circle.ts, the one definition,
 * so this answer and the pool's answer cannot disagree.
 */
export function useCircleSize(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['amateur', 'circle-size', userId],
    enabled: !!userId && enabled,
    staleTime: 5 * 60_000,
    queryFn: () => fetchCircleCount(userId!),
  });
}
