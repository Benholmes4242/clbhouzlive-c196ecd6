
import React from 'react';
import LoadingSkeleton from './feed/LoadingSkeleton';
import TrendingFeedContent from './feed/TrendingFeedContent';
import EmptyFeedState from './feed/EmptyFeedState';

import { useUserPosts } from '@/hooks/useUserPosts';
import { useOptimisticPosts } from '@/hooks/useOptimisticPosts';
import { useExternalVideos } from '@/hooks/useExternalVideos';
import { useTrendingFeedData } from '@/hooks/useTrendingFeedData';
import { useFeedRefreshEvents } from '@/hooks/useFeedRefreshEvents';
import { sortContentByTime } from '@/utils/contentSorting';
import { UserPostWithType } from './feed/types';

const TrendingFeed = () => {
  const { posts: userPosts, loading: userPostsLoading, refetch: refetchUserPosts } = useUserPosts();
  const { optimisticPosts } = useOptimisticPosts();
  const { videos: externalVideos, loading: externalVideosLoading } = useExternalVideos();
  const { followedUsersPosts, followedPostsLoading, refetchFollowedPosts } = useTrendingFeedData();

  // Set up feed refresh event listeners
  useFeedRefreshEvents({ refetchUserPosts, refetchFollowedPosts });

  if (userPostsLoading || externalVideosLoading || followedPostsLoading) {
    return <LoadingSkeleton />;
  }

  // Filter out example friend videos
  const realFriendVideos = externalVideos.filter(video => 
    video.type === 'friend' &&
    video.user.username !== '@mikej_golf' && 
    video.user.username !== '@sarahgolf' &&
    !video.user.name.includes('Mike Johnson') &&
    !video.user.name.includes('Sarah Chen') &&
    !video.content.description.includes('Hole in one at my local course') &&
    !video.content.description.includes('Working on my swing at the driving range')
  );

  // Convert posts to the correct type and include ALL user posts (including current user's)
  const allUserPosts: UserPostWithType[] = [
    ...userPosts.map(post => ({ ...post, type: 'user_post' as const })),
    ...followedUsersPosts.map(post => ({ ...post, type: 'user_post' as const }))
  ];

  // Deduplicate posts by ID to prevent showing the same post twice
  const uniqueUserPosts = allUserPosts.reduce((acc, post) => {
    if (!acc.find(existingPost => existingPost.id === post.id)) {
      acc.push(post);
    }
    return acc;
  }, [] as UserPostWithType[]);

  // Combine all content
  const allContent = [
    ...uniqueUserPosts,
    ...realFriendVideos
  ];

  const sortedContent = sortContentByTime(allContent);

  if (sortedContent.length === 0 && optimisticPosts.length === 0) {
    return <EmptyFeedState />;
  }

  return (
    <TrendingFeedContent
      sortedContent={sortedContent}
      optimisticPosts={optimisticPosts}
      refetchUserPosts={refetchUserPosts}
      refetchFollowedPosts={refetchFollowedPosts}
    />
  );
};

export default TrendingFeed;
