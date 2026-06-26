import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchFollowsPage } from './_followsListShared';

// People who follow a business (Phase 2b: unified `follows` table)
export function useBusinessFollowersPaginated(businessId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['followers-paginated', 'business', businessId],
    enabled: !!businessId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!businessId) return { users: [], hasMore: false, totalCount: 0 };
      return fetchFollowsPage({
        profileActorType: 'business',
        profileActorId: businessId,
        direction: 'followers',
        pageParam: pageParam as number,
      });
    },
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    staleTime: 60_000,
  });
}

// Who a business is following (Phase 2b: unified `follows` table — both kinds)
export function useBusinessFollowingPaginated(businessId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['following-paginated', 'business', businessId],
    enabled: !!businessId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!businessId) return { users: [], hasMore: false, totalCount: 0 };
      return fetchFollowsPage({
        profileActorType: 'business',
        profileActorId: businessId,
        direction: 'following',
        pageParam: pageParam as number,
      });
    },
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    staleTime: 60_000,
  });
}

// Lightweight count-only hook for stats pills (reads unified follows)
export function useBusinessFollowingCount(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-following-count', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return 0;
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_actor_type', 'business')
        .eq('follower_actor_id', businessId);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });
}
