import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFollowsPage } from './_followsListShared';

const PAGE_SIZE = 20;

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
  /** 'personal' | 'business' — drives row navigation in UserListPage */
  actorType?: 'personal' | 'business';
  /** business slug when actorType === 'business' */
  slug?: string | null;
};

type PageResult = {
  users: SocialUser[];
  hasMore: boolean;
  totalCount: number;
};

/**
 * Phase 2b — followers of a PERSONAL profile read from the unified `follows`
 * table and may include both personal AND business followers.
 */
export function usePaginatedFollowers(userId: string | undefined) {
  return useInfiniteQuery<PageResult>({
    queryKey: ['followers-paginated', 'personal', userId],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!userId) return { users: [], hasMore: false, totalCount: 0 };
      return fetchFollowsPage({
        profileActorType: 'personal',
        profileActorId: userId,
        direction: 'followers',
        pageParam: pageParam as number,
      });
    },
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    staleTime: 60_000,
  });
}

export function usePaginatedFollowing(userId: string | undefined) {
  return useInfiniteQuery<PageResult>({
    queryKey: ['following-paginated', 'personal', userId],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!userId) return { users: [], hasMore: false, totalCount: 0 };
      return fetchFollowsPage({
        profileActorType: 'personal',
        profileActorId: userId,
        direction: 'following',
        pageParam: pageParam as number,
      });
    },
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    staleTime: 60_000,
  });
}

// Re-export page size for symmetry with the rest of the codebase.
export const SOCIAL_LIST_PAGE_SIZE = PAGE_SIZE;
