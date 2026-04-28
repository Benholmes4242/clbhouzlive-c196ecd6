import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

const PAGE_SIZE = 20;

/**
 * Fetch IDs of users blocked by or blocking the given user.
 * Returns a Set for O(1) lookups.
 */
async function fetchBlockedIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
    .limit(1000); // guards against unbounded fetch; users with >1000 blocks are edge cases

  if (error) {
    AppLog.error('[useSocialLists]', 'Failed to fetch blocks:', error);
    return new Set();
  }

  const ids = new Set<string>();
  for (const row of data || []) {
    if (row.blocker_id !== userId) ids.add(row.blocker_id);
    if (row.blocked_id !== userId) ids.add(row.blocked_id);
  }
  return ids;
}

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

export type SocialUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  homeClub: string | null;
  handicapIndex: number | null;
  showHandicap: boolean;
  creatorOnly: boolean;
  profileType: string;
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
    .select('id, username, display_name, profile_photo_url, home_club, eg_handicap_index, creator_only, profile_type, show_handicap')
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
      if (!userId) return { users: [], hasMore: false, totalCount: 0 };

      const [blockedIds, { from, to }] = await Promise.all([
        fetchBlockedIds(userId),
        Promise.resolve(buildRange(pageParam as number)),
      ]);

      const { data: followRows, error, count } = await supabase
        .from('user_follows')
        .select('follower_id', { count: 'exact' })
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const followerIds = (followRows || [])
        .map((r: { follower_id: string }) => r.follower_id)
        .filter((id: string) => id && !blockedIds.has(id));
      if (followerIds.length === 0) return { users: [], hasMore: false, totalCount: count ?? 0 };

      const profilesById = await fetchProfilesByIds(followerIds);
      const users = followerIds
        .map((id) => profilesById.get(id))
        .filter((p): p is NonNullable<typeof p> => p != null)
        .map(toSocialUser);

      const total = count ?? users.length;
      const hasMore = to + 1 < total;

      return { users, hasMore, totalCount: total };
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
      if (!userId) return { users: [], hasMore: false, totalCount: 0 };

      const [blockedIds, { from, to }] = await Promise.all([
        fetchBlockedIds(userId),
        Promise.resolve(buildRange(pageParam as number)),
      ]);

      const { data: followRows, error, count } = await supabase
        .from('user_follows')
        .select('following_id', { count: 'exact' })
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const followingIds = (followRows || [])
        .map((r: { following_id: string }) => r.following_id)
        .filter((id: string) => id && !blockedIds.has(id));
      if (followingIds.length === 0) return { users: [], hasMore: false, totalCount: count ?? 0 };

      const profilesById = await fetchProfilesByIds(followingIds);
      const users = followingIds
        .map((id) => profilesById.get(id))
        .filter((p): p is NonNullable<typeof p> => p != null)
        .map(toSocialUser);

      const total = count ?? users.length;
      const hasMore = to + 1 < total;

      return { users, hasMore, totalCount: total };
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
      if (!userId) return { users: [], hasMore: false, totalCount: 0 };

      const [blockedIds, { from, to }] = await Promise.all([
        fetchBlockedIds(userId),
        Promise.resolve(buildRange(pageParam as number)),
      ]);

      const { data: rows, error, count } = await supabase
        .from('user_friends')
        .select('user_id, friend_id', { count: 'exact' })
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const friendIds = (rows || [])
        .map((row: { user_id: string; friend_id: string }) =>
          row.user_id === userId ? row.friend_id : row.user_id
        )
        .filter((id: string) => id && !blockedIds.has(id));

      if (friendIds.length === 0) return { users: [], hasMore: false, totalCount: count ?? 0 };

      const profilesById = await fetchProfilesByIds(friendIds);
      const users = friendIds
        .map((id) => profilesById.get(id))
        .filter((p): p is NonNullable<typeof p> => p != null)
        .map(toSocialUser);

      const total = count ?? users.length;
      const hasMore = to + 1 < total;

      return { users, hasMore, totalCount: total };
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : undefined,
    staleTime: 60_000,
  });
}
