/**
 * Real posts fetcher hook - orchestrates feed fetching
 * 
 * This is a thin wrapper that re-exports the modular fetcher functions.
 * The actual implementation is split across:
 * - real-posts-fetcher/fetchers/fetchFriendsPosts.ts
 * - real-posts-fetcher/fetchers/fetchFriendsFirstPosts.ts
 * - real-posts-fetcher/fetchers/fetchRealPosts.ts
 * - real-posts-fetcher/fetchers/fetchClubhouseShorts.ts
 * 
 * Shared utilities:
 * - real-posts-fetcher/utils/postHydration.ts - batch profile/business/course fetching
 * - real-posts-fetcher/utils/postFormatter.ts - single source of truth for post formatting
 * - real-posts-fetcher/utils/verticalFilter.ts - vertical video filtering
 * - real-posts-fetcher/utils/curationAlgorithm.ts - feed curation logic
 */

import {
  fetchFriendsPosts,
  fetchRealPosts,
  fetchClubhouseExploreShorts,
} from './real-posts-fetcher';

export const useRealPostsFetcher = () => {
  return { 
    fetchRealPosts, 
    fetchFriendsPosts, 
    fetchClubhouseExploreShorts 
  };
};

// Re-export types for consumers
export type { 
  FetchOptions, 
  ClubhouseFetchOptions,
  RawPostData,
  HydrationContext,
  CurationBuckets,
} from './real-posts-fetcher';

// Re-export utilities for direct use
export {
  formatPost,
  formatPosts,
  buildHydrationContext,
  passesVerticalFilter,
  categorizePosts,
  curateFeed,
} from './real-posts-fetcher';
