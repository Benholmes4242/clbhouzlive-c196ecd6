/**
 * useActiveGameCounts - fetch active game counts by course ID
 * Returns a map of courseId -> count of active games
 * 
 * V3: Used by leaderboard to show "X games" badge on course rows
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UseActiveGameCountsResult {
  counts: Record<string, number>;
  isLoading: boolean;
  isError: boolean;
}

export function useActiveGameCounts(courseIds: string[]): UseActiveGameCountsResult {
  const query = useQuery({
    queryKey: ['active-game-counts', courseIds.slice().sort().join(',')],
    enabled: courseIds.length > 0,
    staleTime: 30_000, // 30 second cache
    gcTime: 60_000, // keep in cache 1 minute
    queryFn: async (): Promise<Record<string, number>> => {
      if (courseIds.length === 0) return {};

      const now = new Date().toISOString();
      
      // Get games that are upcoming (start_time > now) and have open slots
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

      // Count games per course
      const counts: Record<string, number> = {};
      (data || []).forEach((game) => {
        if (game.course_id) {
          counts[game.course_id] = (counts[game.course_id] || 0) + 1;
        }
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
