import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SocialUser } from '@/hooks/useSocialLists';

const PAGE_SIZE = 50;

type UserProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  home_club: string | null;
  eg_handicap_index: number | null;
  creator_only: boolean | null;
  profile_type: string | null;
  show_handicap: boolean | null;
};

type PageResult = {
  users: SocialUser[];
  hasMore: boolean;
  totalCount: number;
};

function buildRange(pageParam: number) {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  return { from, to };
}

function toSocialUser(profile: UserProfileRow): SocialUser {
  return {
    id: profile.id,
    username: profile.username || '',
    displayName: profile.display_name || profile.username || 'Golfer',
    avatarUrl: profile.profile_photo_url,
    homeClub: profile.home_club,
    handicapIndex: profile.eg_handicap_index,
    showHandicap: profile.show_handicap ?? true,
    creatorOnly: profile.creator_only ?? false,
    profileType: profile.profile_type || 'personal',
  };
}

async function fetchProfilesByIds(ids: string[]): Promise<Map<string, UserProfileRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      'id, username, display_name, profile_photo_url, home_club, eg_handicap_index, creator_only, profile_type, show_handicap',
    )
    .in('id', ids)
    .is('deleted_at', null);
  if (error) throw error;
  return new Map((data || []).map((p) => [p.id, p as UserProfileRow]));
}

// People who follow a business
export function useBusinessFollowersPaginated(businessId: string | undefined) {
  return useInfiniteQuery<PageResult>({
    queryKey: ['business-followers-paginated', businessId],
    enabled: !!businessId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!businessId) return { users: [], hasMore: false, totalCount: 0 };
      const { from, to } = buildRange(pageParam as number);

      const { data: rows, error, count } = await supabase
        .from('business_follows')
        .select('follower_id', { count: 'exact' })
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const followerIds = (rows || [])
        .map((r: { follower_id: string }) => r.follower_id)
        .filter(Boolean);
      if (followerIds.length === 0) {
        return { users: [], hasMore: false, totalCount: count ?? 0 };
      }

      const profilesById = await fetchProfilesByIds(followerIds);
      const users = followerIds
        .map((id) => profilesById.get(id))
        .filter((p): p is NonNullable<typeof p> => p != null)
        .map(toSocialUser);

      const total = count ?? users.length;
      const hasMore = to + 1 < total;
      return { users, hasMore, totalCount: total };
    },
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    staleTime: 60_000,
  });
}

// People a business follows (personal users)
export function useBusinessFollowingPaginated(businessId: string | undefined) {
  return useInfiniteQuery<PageResult>({
    queryKey: ['business-following-paginated', businessId],
    enabled: !!businessId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!businessId) return { users: [], hasMore: false, totalCount: 0 };
      const { from, to } = buildRange(pageParam as number);

      const { data: rows, error, count } = await supabase
        .from('business_outbound_follows')
        .select('following_id', { count: 'exact' })
        .eq('follower_business_id', businessId)
        .eq('following_type', 'personal')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const followingIds = (rows || [])
        .map((r: { following_id: string }) => r.following_id)
        .filter(Boolean);
      if (followingIds.length === 0) {
        return { users: [], hasMore: false, totalCount: count ?? 0 };
      }

      const profilesById = await fetchProfilesByIds(followingIds);
      const users = followingIds
        .map((id) => profilesById.get(id))
        .filter((p): p is NonNullable<typeof p> => p != null)
        .map(toSocialUser);

      const total = count ?? users.length;
      const hasMore = to + 1 < total;
      return { users, hasMore, totalCount: total };
    },
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    staleTime: 60_000,
  });
}

// Lightweight count-only hook for stats pills
export function useBusinessFollowingCount(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-following-count', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return 0;
      const { count, error } = await supabase
        .from('business_outbound_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_business_id', businessId)
        .eq('following_type', 'personal');
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });
}
