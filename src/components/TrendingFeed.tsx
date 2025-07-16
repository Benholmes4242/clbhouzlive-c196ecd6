
import React, { useMemo, useCallback } from 'react';
import LoadingSkeleton from './feed/LoadingSkeleton';
import EmptyFeedMessage from './feed/EmptyFeedMessage';
import MosaicFeedContent from './feed/MosaicFeedContent';
import { useTrendingFeed } from '@/hooks/useTrendingFeed';
import { useInfiniteTrendingFeed } from '@/hooks/useInfiniteTrendingFeed';
import { processFeedContent } from '@/utils/feedContentProcessor';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

const TrendingFeed = React.memo(() => {
  const {
    userPosts,
    userPostsLoading,
    optimisticPosts,
    externalVideos,
    refetchUserPosts,
  } = useTrendingFeed();

  // Use infinite feed for followed posts
  const {
    posts: infinitePosts,
    loading: infiniteLoading,
    hasMore,
    loadMore
  } = useInfiniteTrendingFeed();

  // Memoize the expensive feed content processing - MUST be before early returns
  const sortedContent = useMemo(() => 
    processFeedContent(userPosts, infinitePosts, externalVideos),
    [userPosts, infinitePosts, externalVideos]
  );

  // Memoize callbacks to prevent unnecessary re-renders - MUST be before early returns  
  const handlePostUpdated = useCallback(() => {
    refetchUserPosts();
  }, [refetchUserPosts]);

  const handlePostDeleted = useCallback(() => {
    refetchUserPosts();
  }, [refetchUserPosts]);

  // Infinite scroll trigger
  const { ref: loadMoreRef } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    onIntersect: () => {
      if (hasMore && !infiniteLoading) {
        loadMore();
      }
    }
  });

  // Show skeleton loading only for initial load - AFTER all hooks
  if ((userPostsLoading || infiniteLoading) && userPosts.length === 0 && infinitePosts.length === 0) {
    return <LoadingSkeleton />;
  }

  if (sortedContent.length === 0 && optimisticPosts.length === 0) {
    return <EmptyFeedMessage />;
  }

  return (
    <div>
      <MosaicFeedContent
        optimisticPosts={optimisticPosts}
        sortedContent={sortedContent}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
      />
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {infiniteLoading && (
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          )}
        </div>
      )}
    </div>
  );
});

export default TrendingFeed;
