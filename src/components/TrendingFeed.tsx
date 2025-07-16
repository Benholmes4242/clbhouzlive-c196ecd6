
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

  // Infinite scroll trigger - automatic detection at 80-90% scroll
  const { ref: loadMoreRef } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px', // Trigger when 200px before element comes into view
    onIntersect: () => {
      console.log('🔄 Infinite scroll triggered!', { hasMore, infiniteLoading, postsCount: sortedContent.length });
      if (hasMore && !infiniteLoading) {
        console.log('📥 Loading more posts...');
        loadMore();
      }
    }
  });

  // Show skeleton loading only for initial load - AFTER all hooks
  if ((userPostsLoading || infiniteLoading) && userPosts.length === 0 && infinitePosts.length === 0 && optimisticPosts.length === 0) {
    return <LoadingSkeleton />;
  }

  // Only show empty message if we've finished loading and truly have no content
  if (sortedContent.length === 0 && optimisticPosts.length === 0 && !userPostsLoading && !infiniteLoading && !hasMore) {
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
      
      {/* Automatic infinite scroll trigger - positioned after content */}
      {sortedContent.length > 0 && (
        <div 
          ref={loadMoreRef} 
          className="h-16 flex items-center justify-center my-4 bg-muted/10 border border-dashed border-muted-foreground/20"
        >
          <div className="text-center">
            {hasMore ? (
              infiniteLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-sm">Loading more posts...</span>
                </div>
              ) : (
                <div className="text-muted-foreground text-xs opacity-50">
                  Scroll trigger - Posts: {sortedContent.length}
                </div>
              )
            ) : (
              <div className="text-muted-foreground text-sm">You've reached the end!</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default TrendingFeed;
