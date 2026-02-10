import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Paginated version of useClubMedia for the Course Media Tab.
 * Uses cursor-based pagination via the get-club-media edge function.
 */
export const useCourseMediaPaginated = (clubId: string, pageSize: number = 30) => {
  return useInfiniteQuery({
    queryKey: ['club-media-paginated', clubId],
    queryFn: async ({ pageParam }) => {
      const body: Record<string, unknown> = { clubId, limit: pageSize };
      if (pageParam) {
        body.cursor = pageParam;
      }

      const { data, error } = await supabase.functions.invoke('get-club-media', {
        body,
      });

      if (error) throw error;
      return {
        edges: data?.edges ?? [],
        pageInfo: data?.pageInfo ?? { hasMore: false, nextCursor: null },
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore ? lastPage.pageInfo.nextCursor : undefined,
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
