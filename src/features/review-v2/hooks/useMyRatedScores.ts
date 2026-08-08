/**
 * useMyRatedScores - the member's own overall ratings, fetched ONCE when the
 * score step mounts. Used only to tell the member where the value they are
 * dragging would sit among their OWN rated courses.
 *
 * It reveals nothing about this course, this community, or any other member.
 * The rating for the course being reviewed is excluded server-side so an edit
 * never ranks the member against themselves.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMyRatedScores(userId: string | null, courseId: string | null) {
  return useQuery({
    queryKey: ['rv2-my-rated-scores', userId, courseId],
    enabled: !!userId && !!courseId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await (supabase.from('course_ratings') as any)
        .select('rating')
        .eq('user_id', userId!)
        .neq('course_id', courseId!)
        .not('rating', 'is', null);
      return ((data as Array<{ rating: number | null }> | null) ?? [])
        .map((r) => Number(r.rating))
        .filter((n) => Number.isFinite(n));
    },
  });
}

/** Minimum peers before the calibration line says anything useful. */
export const CALIBRATION_MIN_PEERS = 5;

/**
 * Where `value` would land among `peers` (peers exclude this course).
 * Returns null when there is not enough of the member's own scale to compare.
 */
export function calibrationRank(
  value: number | null,
  peers: number[] | undefined,
): { ordinal: number; total: number } | null {
  if (value == null || !peers || peers.length < CALIBRATION_MIN_PEERS) return null;
  const above = peers.filter((p) => p > value).length;
  return { ordinal: above + 1, total: peers.length + 1 };
}
