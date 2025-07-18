import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import VerticalMediaFeed from '@/components/explore/VerticalMediaFeed';
import FullscreenPostFeed from '@/components/clubhouse/FullscreenPostFeed';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { FILTER_TYPES } from '@/components/explore/types';

const Clubhouse = () => {
  
  // Get content for Friends filter only
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(FILTER_TYPES.FRIENDS);
  
  const { 
    isOpen: isFeedOpen, 
    initialItem, 
    openFeed, 
    closeFeed 
  } = useVerticalMediaFeed();

  const handleLike = (contentId: string) => {
    // Update likes optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleFollow = (contentId: string) => {
    // Update follow status optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleMediaClick = (item: any) => {
    openFeed(item);
  };

  // Remove duplicates based on src URL
  const uniqueContent = content.filter((item, index, self) => 
    index === self.findIndex(t => t.src === item.src)
  );

  return (
      <div className="h-screen bg-black overflow-hidden">
        <main className="h-full">
          {/* Fullscreen Post Feed */}
          {uniqueContent.length > 0 ? (
            <FullscreenPostFeed 
              content={uniqueContent}
              onLike={handleLike}
              onMediaClick={handleMediaClick}
              isLoading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/70">Loading posts...</p>
            </div>
          )}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <BottomNavigation />
        </div>

        {/* Vertical Media Feed - Keep the existing modal */}
        {initialItem && (
          <VerticalMediaFeed
            isOpen={isFeedOpen}
            onClose={closeFeed}
            initialItem={initialItem}
            allContent={uniqueContent}
            onLike={handleLike}
            onFollow={handleFollow}
          />
        )}

        <style>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
  );
};

export default Clubhouse;