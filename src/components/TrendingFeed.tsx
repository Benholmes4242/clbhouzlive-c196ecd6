
import React from 'react';
import LoadingSkeleton from './feed/LoadingSkeleton';
import EmptyFeedMessage from './feed/EmptyFeedMessage';
import MosaicFeedContent from './feed/MosaicFeedContent';
import { useTrendingFeed } from '@/hooks/useTrendingFeed';
import { processFeedContent } from '@/utils/feedContentProcessor';

const TrendingFeed = () => {
  const {
    userPosts,
    userPostsLoading,
    followedUsersPosts,
    followedPostsLoading,
    optimisticPosts,
    externalVideos,
    refetchUserPosts,
    refetchFollowedPosts,
  } = useTrendingFeed();

  // Show skeleton loading only for initial load
  if ((userPostsLoading || followedPostsLoading) && userPosts.length === 0 && followedUsersPosts.length === 0) {
    return <LoadingSkeleton />;
  }

  const sortedContent = processFeedContent(userPosts, followedUsersPosts, externalVideos);

  if (sortedContent.length === 0 && optimisticPosts.length === 0) {
    return <EmptyFeedMessage />;
  }

  const handlePostUpdated = () => {
    refetchUserPosts();
    refetchFollowedPosts();
  };

  const handlePostDeleted = () => {
    refetchUserPosts();
    refetchFollowedPosts();
  };

  return (
    <MosaicFeedContent
      optimisticPosts={optimisticPosts}
      sortedContent={sortedContent}
      onPostUpdated={handlePostUpdated}
      onPostDeleted={handlePostDeleted}
    />
  );
};

export default TrendingFeed;
