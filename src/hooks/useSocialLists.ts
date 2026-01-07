import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getMockSocialUsers } from '@/mocks/mockSocialUsers';

const PAGE_SIZE = 20;

type UserProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  home_club: string | null;
  eg_handicap_index: number | null;
};

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

function toSocialUser(profile: UserProfileRow): SocialUser {
  return {
    id: profile.id,
    username: profile.username || '',
    displayName: profile.display_name || profile.username || 'Golfer',
    avatarUrl: profile.profile_photo_url,
    homeClub: profile.home_club,
    handicapIndex: profile.eg_handicap_index,
  };
}

function getMockSocialUsersMapped(): SocialUser[] {
  return getMockSocialUsers().map((m) => ({
    id: m.id,
    username: m.username,
    displayName: m.display_name,
    avatarUrl: m.avatar_url,
    homeClub: m.home_club,
    handicapIndex: null,
  }));
}

async function fetchProfilesByIds(ids: string[]): Promise<Map<string, UserProfileRow>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, profile_photo_url, home_club, eg_handicap_index')
    .in('id', ids)
    .is('deleted_at', null);

  if (error) throw error;

  return new Map((data || []).map((p) => [p.id, p as UserProfileRow]));
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

      // NOTE: Avoid FK-join syntax here; this project doesn't expose a
      // relationship between user_follows -> user_profiles in PostgREST schema cache.
      const { data: followRows, error, count } = await supabase
        .from('user_follows')
        .select('follower_id', { count: 'exact' })
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const followerIds = (followRows || []).map((r: any) => r.follower_id).filter(Boolean) as string[];
      
      const profilesById = await fetchProfilesByIds(followerIds);
      const realUsers = followerIds
        .map((id) => profilesById.get(id))
        .filter(Boolean)
        .map((p) => toSocialUser(p!));

      // Inject mock users for testing
      const mockUsers = getMockSocialUsersMapped();
      const allUsers = [...realUsers, ...mockUsers];

      const total = (count ?? realUsers.length) + mockUsers.length;
      const hasMore = to + 1 < total;

      // Paginate from combined list
      const paginatedUsers = allUsers.slice(from, to + 1);

      return { users: paginatedUsers, hasMore };
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

      // NOTE: Avoid FK-join syntax here for the same reason as followers.
      const { data: followRows, error, count } = await supabase
        .from('user_follows')
        .select('following_id', { count: 'exact' })
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const followingIds = (followRows || []).map((r: any) => r.following_id).filter(Boolean) as string[];
      
      const profilesById = await fetchProfilesByIds(followingIds);
      const realUsers = followingIds
        .map((id) => profilesById.get(id))
        .filter(Boolean)
        .map((p) => toSocialUser(p!));

      // Inject mock users for testing
      const mockUsers = getMockSocialUsersMapped();
      const allUsers = [...realUsers, ...mockUsers];

      const total = (count ?? realUsers.length) + mockUsers.length;
      const hasMore = to + 1 < total;

      // Paginate from combined list
      const paginatedUsers = allUsers.slice(from, to + 1);

      return { users: paginatedUsers, hasMore };
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

      // Fetch friendships where user is either party and status is accepted.
      // NOTE: Avoid FK-join syntax here; it may not exist in PostgREST schema cache.
      const { data: rows, error, count } = await supabase
        .from('user_friends')
        .select('user_id, friend_id', { count: 'exact' })
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const friendIds = (rows || [])
        .map((row: any) => (row.user_id === userId ? row.friend_id : row.user_id))
        .filter(Boolean) as string[];

      const profilesById = await fetchProfilesByIds(friendIds);
      const realUsers = friendIds
        .map((id) => profilesById.get(id))
        .filter(Boolean)
        .map((p) => toSocialUser(p!));

      // Inject mock users for testing
      const mockUsers = getMockSocialUsersMapped();
      const allUsers = [...realUsers, ...mockUsers];

      const total = (count ?? realUsers.length) + mockUsers.length;
      const hasMore = to + 1 < total;

      // Paginate from combined list
      const paginatedUsers = allUsers.slice(from, to + 1);

      return { users: paginatedUsers, hasMore };
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : undefined,
    staleTime: 60_000,
  });
}
