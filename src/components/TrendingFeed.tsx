
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
      console.log('🔄 Infinite scroll triggered!', { hasMore, infiniteLoading });
      if (hasMore && !infiniteLoading) {
        console.log('📥 Loading more posts...');
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
      
      {/* Automatic infinite scroll trigger - always visible for debugging */}
      <div 
        ref={loadMoreRef} 
        className="h-20 flex items-center justify-center bg-muted/20 border-2 border-dashed border-muted-foreground/20"
        style={{ 
          position: 'relative',
          marginTop: '20px' // Remove the negative top positioning for now
        }}
      >
        <div className="text-center">
          {hasMore ? (
            infiniteLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <span className="text-sm">Loading more posts...</span>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                Scroll trigger (hasMore: {hasMore.toString()}, loading: {infiniteLoading.toString()})
              </div>
            )
          ) : (
            <div className="text-muted-foreground text-sm">No more posts to load</div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TrendingFeed;
