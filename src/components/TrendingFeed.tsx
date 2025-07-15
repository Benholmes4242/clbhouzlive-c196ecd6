
import React, { useMemo, useCallback } from 'react';
import LoadingSkeleton from './feed/LoadingSkeleton';
import EmptyFeedMessage from './feed/EmptyFeedMessage';
import MosaicFeedContent from './feed/MosaicFeedContent';
import { useTrendingFeed } from '@/hooks/useTrendingFeed';
import { processFeedContent } from '@/utils/feedContentProcessor';

const TrendingFeed = React.memo(() => {
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

  // Memoize the expensive feed content processing
  const sortedContent = useMemo(() => 
    processFeedContent(userPosts, followedUsersPosts, externalVideos),
    [userPosts, followedUsersPosts, externalVideos]
  );

  if (sortedContent.length === 0 && optimisticPosts.length === 0) {
    return <EmptyFeedMessage />;
  }

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePostUpdated = useCallback(() => {
    refetchUserPosts();
    refetchFollowedPosts();
  }, [refetchUserPosts, refetchFollowedPosts]);

  const handlePostDeleted = useCallback(() => {
    refetchUserPosts();
    refetchFollowedPosts();
  }, [refetchUserPosts, refetchFollowedPosts]);

  return (
    <MosaicFeedContent
      optimisticPosts={optimisticPosts}
      sortedContent={sortedContent}
      onPostUpdated={handlePostUpdated}
      onPostDeleted={handlePostDeleted}
    />
  );
});

export default TrendingFeed;
