// Canonical post query keys - single source of truth

import type { ActorType } from '@/events/postEvents';

export const postKeys = {
  // Actor-scoped posts (personal profile, business profile)
  actorPosts: (actorType: ActorType, actorId: string) =>
    ['actor-posts', actorType, actorId] as const,

  // Profile page posts query
  profilePosts: (actorType: ActorType, actorId: string) =>
    ['profile-posts', actorType, actorId] as const,

  // Actor post count
  actorPostsCount: (actorType: ActorType, actorId: string) =>
    ['actor-posts-count', actorType, actorId] as const,

  // Trending/discover feed
  trending: () => ['trending-posts'] as const,

  // Followed users feed (used by useTrendingFeed)
  followedUsersPosts: (userId: string) => ['followedUsersPosts', userId] as const,

  // User posts (legacy, used by useUserPosts)
  userPosts: (userId: string) => ['userPosts', userId] as const,

  // Activity posts (legacy key for personal feed)
  activityPosts: (userId: string) => ['activity-posts', userId] as const,
};
