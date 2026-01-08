/**
 * useActiveGameCounts - fetch active game counts by course ID
 * Returns a map of courseId -> count of active games
 *
 * V3: Used by leaderboard to show "X games" badge on course rows
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UseActiveGameCountsResult {
  counts: Record<string, number>;
  isLoading: boolean;
  isError: boolean;
}

export function useActiveGameCounts(courseIds: string[]): UseActiveGameCountsResult {
  // NEVER mutate incoming props (courseIds.sort() mutates)
  const key = useMemo(() => courseIds.slice().sort().join(','), [courseIds]);

  const query = useQuery({
    queryKey: ['active-game-counts', key],
    enabled: courseIds.length > 0,
    staleTime: 30_000, // 30s cache
    gcTime: 60_000, // keep cache 1 min
    queryFn: async (): Promise<Record<string, number>> => {
      if (courseIds.length === 0) return {};

      const now = new Date().toISOString();

      // Upcoming games with open slots
      const { data, error } = await supabase
        .from('games')
        .select('course_id')
        .in('course_id', courseIds)
        .gt('start_time', now)
        .gt('slots_open', 0)
        .eq('status', 'open');

      if (error) {
        console.error('[useActiveGameCounts] Error:', error);
        return {};
      }

      const counts: Record<string, number> = {};
      (data ?? []).forEach((row: { course_id: string | null }) => {
        if (!row.course_id) return;
        counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
      });

      return counts;
    },
  });

  return {
    counts: query.data ?? {},
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
