import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreGrid from '@/components/explore/ExploreGrid';
import MobileDebugConsole from '@/components/explore/MobileDebugConsole';
import VerticalMediaFeed from '@/components/explore/VerticalMediaFeed';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { FILTER_TYPES } from '@/components/explore/types';

const Clubhouse = () => {
  const [debugVisible, setDebugVisible] = useState(false);
  
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
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pb-20">

          {/* Your Clubhouse Section */}
          <div className="container pt-6 pb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Clubhouse</h2>
          </div>

          {/* Main Grid with Container */}
          <div className="container">
            <ExploreGrid 
              content={uniqueContent}
              onLike={handleLike}
              onFollow={handleFollow}
              onMediaClick={handleMediaClick}
              isLoading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              activeFilter={FILTER_TYPES.FRIENDS}
              isClubhousePage={true}
            />
          </div>
        </main>
        
        <BottomNavigation />

        {/* Mobile Debug Console */}
        <MobileDebugConsole 
          isVisible={debugVisible}
          onToggle={() => setDebugVisible(!debugVisible)}
        />

        {/* Vertical Media Feed */}
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