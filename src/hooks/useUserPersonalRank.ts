import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Manages a user's personal course-rank ordering.
 *
 * - Loads the personal_rank rows for the user.
 * - Provides `applyPersonalOrder(ratedCourses)` to reorder a list of
 *   rated courses according to personal_rank, appending unranked
 *   courses at the end.
 * - Seeds personal_rank table on first activation.
 * - Persists reorders via the bulk-upsert RPC.
 */
export function useUserPersonalRank(userId: string | undefined) {
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['user-personal-rank', userId], [userId]);

  const { data: personalRanks = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return [] as Array<{ course_id: string; personal_rank: number }>;
      const { data, error } = await supabase
        .from('user_course_personal_rank')
        .select('course_id, personal_rank')
        .eq('user_id', userId)
        .order('personal_rank', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const rankMap = useMemo(() => {
    const m = new Map<string, number>();
    personalRanks.forEach((r) => m.set(r.course_id, r.personal_rank));
    return m;
  }, [personalRanks]);

  /**
   * Returns courses sorted by personal_rank. Courses without a stored
   * rank are appended in their incoming (rating-cascade) order.
   */
  const applyPersonalOrder = useCallback(
    <T extends { course_id: string }>(rows: T[]): { ordered: T[]; newCount: number } => {
      const ranked: T[] = [];
      const unranked: T[] = [];
      for (const row of rows) {
        if (rankMap.has(row.course_id)) ranked.push(row);
        else unranked.push(row);
      }
      ranked.sort(
        (a, b) => (rankMap.get(a.course_id) ?? 0) - (rankMap.get(b.course_id) ?? 0)
      );
      return { ordered: [...ranked, ...unranked], newCount: unranked.length };
    },
    [rankMap]
  );

  /** Seeds the table from the rating cascade (no-op if rows exist). */
  const seedIfEmpty = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase.rpc('seed_user_personal_ranks', {
      p_user_id: userId,
    });
    if (error) {
      console.error('seed_user_personal_ranks failed:', error);
      throw error;
    }
    await queryClient.invalidateQueries({ queryKey });
  }, [userId, queryClient, queryKey]);

  /** Persists a new full ordering. */
  const persistOrder = useCallback(
    async (orderedCourseIds: string[]) => {
      if (!userId) return;
      const { error } = await supabase.rpc('update_user_personal_rank_order', {
        p_user_id: userId,
        p_ordered_course_ids: orderedCourseIds,
      });
      if (error) {
        console.error('update_user_personal_rank_order failed:', error);
        throw error;
      }
      await queryClient.invalidateQueries({ queryKey });
    },
    [userId, queryClient, queryKey]
  );

  return {
    personalRanks,
    rankMap,
    isLoading,
    applyPersonalOrder,
    seedIfEmpty,
    persistOrder,
  };
}

/** Persists a sort-mode preference for the courses tab to sessionStorage. */
export function useSessionSortMode(key: string, defaultMode: 'rating' | 'personal' = 'rating') {
  const [mode, setMode] = useState<'rating' | 'personal'>(() => {
    if (typeof window === 'undefined') return defaultMode;
    try {
      const stored = window.sessionStorage.getItem(key);
      return stored === 'personal' || stored === 'rating' ? stored : defaultMode;
    } catch {
      return defaultMode;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, mode);
    } catch {
      /* noop */
    }
  }, [key, mode]);

  return [mode, setMode] as const;
}
