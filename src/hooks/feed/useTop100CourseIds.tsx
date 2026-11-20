/** Feed hosts batch loaded review courses; cards only consume context. Per-course
 * query-cache entries survive pagination, and failed/loading batches expose no stamp.
 * ReviewBottomSheet deliberately retains its independent open-sheet read. */
import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { activeTop100CourseIds, type Top100MembershipRow } from '@/components/courses/browse/playedRings';
import type { FeedPost } from '@/components/media-system/types/media';

const Top100Context = createContext<ReadonlySet<string>>(new Set());
const courseKey = (id: string) => ['courses', 'feed-top100-course', id] as const;
export function useTop100CourseIds(posts: readonly FeedPost[]) {
  const client = useQueryClient();
  const ids = Array.from(new Set(posts.filter(p => p.isReview).map(p => p.review?.courseId ?? p.courseId).filter((id): id is string => !!id))).sort();
  const query = useQuery({
    queryKey: ['courses', 'feed-review-top100', ids],
    enabled: ids.length > 0,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const missing = ids.filter(id => {
        const state = client.getQueryState(courseKey(id));
        return !state || Date.now() - state.dataUpdatedAt >= 60_000;
      });
      if (missing.length) {
        const { data, error } = await supabase.from('course_top100_memberships')
          .select('course_id, top100_lists!inner(slug, is_active)')
          .eq('top100_lists.is_active', true).in('course_id', missing);
        if (error) throw error;
        const active = activeTop100CourseIds((data ?? []) as unknown as Top100MembershipRow[]);
        for (const id of missing) client.setQueryData(courseKey(id), active.has(id));
      }
      return ids.filter(id => client.getQueryData(courseKey(id)) === true);
    },
  });
  return new Set(!query.isPending && !query.isError ? query.data ?? [] : []);
}
export function FeedReviewTop100Provider({ posts, children }: { posts: readonly FeedPost[]; children: React.ReactNode }) {
  const ids = useTop100CourseIds(posts);
  return <Top100Context.Provider value={ids}>{children}</Top100Context.Provider>;
}
export const useFeedReviewTop100 = () => useContext(Top100Context);