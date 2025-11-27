import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 30;

export type SocialUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  homeClub: string | null;
  handicapIndex: number | null;
};

type PageResult = {
  users: SocialUser[];
  hasMore: boolean;
};

function buildRange(pageParam: number) {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  return { from, to };
}

// Followers of userId
export function usePaginatedFollowers(userId: string | undefined) {
  return useInfiniteQuery<PageResult>({
    queryKey: ['followers-paginated', userId],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!userId) return { users: [], hasMore: false };

      const { from, to } = buildRange(pageParam as number);

      const { data, error, count } = await supabase
        .from('user_follows')
        .select(`
          follower_id,
          user_profiles!user_follows_follower_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url,
            home_club,
            handicap_index
          )
        `, { count: 'exact' })
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const users: SocialUser[] = (data || [])
        .map((row: any) => {
          const profile = row.user_profiles;
          if (!profile) return null;
          return {
            id: profile.id,
            username: profile.username || '',
            displayName: profile.display_name || profile.username || 'Golfer',
            avatarUrl: profile.profile_photo_url,
            homeClub: profile.home_club,
            handicapIndex: profile.handicap_index,
          };
        })
        .filter(Boolean) as SocialUser[];

      const total = count ?? users.length;
      const hasMore = to + 1 < total;

      return { users, hasMore };
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : undefined,
    staleTime: 60_000,
  });
}

// Following for userId
export function usePaginatedFollowing(userId: string | undefined) {
  return useInfiniteQuery<PageResult>({
    queryKey: ['following-paginated', userId],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!userId) return { users: [], hasMore: false };

      const { from, to } = buildRange(pageParam as number);

      const { data, error, count } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          user_profiles!user_follows_following_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url,
            home_club,
            handicap_index
          )
        `, { count: 'exact' })
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const users: SocialUser[] = (data || [])
        .map((row: any) => {
          const profile = row.user_profiles;
          if (!profile) return null;
          return {
            id: profile.id,
            username: profile.username || '',
            displayName: profile.display_name || profile.username || 'Golfer',
            avatarUrl: profile.profile_photo_url,
            homeClub: profile.home_club,
            handicapIndex: profile.handicap_index,
          };
        })
        .filter(Boolean) as SocialUser[];

      const total = count ?? users.length;
      const hasMore = to + 1 < total;

      return { users, hasMore };
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : undefined,
    staleTime: 60_000,
  });
}

// Friends for userId
export function usePaginatedFriends(userId: string | undefined) {
  return useInfiniteQuery<PageResult>({
    queryKey: ['friends-paginated', userId],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!userId) return { users: [], hasMore: false };

      const { from, to } = buildRange(pageParam as number);

      // Fetch friendships where user is either party and status is accepted
      const { data, error, count } = await supabase
        .from('user_friends')
        .select(`
          user_id,
          friend_id,
          user_profiles!user_friends_user_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url,
            home_club,
            handicap_index
          ),
          friend_profiles:user_profiles!user_friends_friend_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url,
            home_club,
            handicap_index
          )
        `, { count: 'exact' })
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const users: SocialUser[] = (data || [])
        .map((row: any) => {
          // If current user is user_id, friend is in friend_profiles
          // If current user is friend_id, friend is in user_profiles
          const profile = row.user_id === userId ? row.friend_profiles : row.user_profiles;
          if (!profile) return null;

          return {
            id: profile.id,
            username: profile.username || '',
            displayName: profile.display_name || profile.username || 'Golfer',
            avatarUrl: profile.profile_photo_url,
            homeClub: profile.home_club,
            handicapIndex: profile.handicap_index,
          };
        })
        .filter(Boolean) as SocialUser[];

      const total = count ?? users.length;
      const hasMore = to + 1 < total;

      return { users, hasMore };
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : undefined,
    staleTime: 60_000,
  });
}
