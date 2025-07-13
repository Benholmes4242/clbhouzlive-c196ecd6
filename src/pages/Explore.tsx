
import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExploreGrid from '@/components/explore/ExploreGrid';
import MobileDebugConsole from '@/components/explore/MobileDebugConsole';
import VerticalMediaFeed from '@/components/explore/VerticalMediaFeed';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';

const Explore = () => {
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_TYPES.VIDEOS);
  const [debugVisible, setDebugVisible] = useState(false);
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(activeFilter);
  
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

  // Apply client-side filtering for non-database filters
  const filteredContent = content.filter(item => {
    // Videos and Photos filtering is handled in the database
    if (activeFilter === FILTER_TYPES.VIDEOS || activeFilter === FILTER_TYPES.PHOTOS) {
      return true;
    }
    
    // Hack Shack: Only videos with #hackshack hashtag
    if (activeFilter === FILTER_TYPES.HACK_SHACK) {
      return item.type === MEDIA_TYPES.VIDEO && (
        item.title?.toLowerCase().includes('#hackshack') || 
        item.title?.toLowerCase().includes('hackshack')
      );
    }
    
    return true;
  });

  // Remove duplicates based on src URL
  const uniqueContent = filteredContent.filter((item, index, self) => 
    index === self.findIndex(t => t.src === item.src)
  );

  return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-6 pb-20">
          {/* Sticky Filter Bar */}
          <ExploreFilters 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter} 
          />

          {/* Masonry Grid with Infinite Scroll */}
          <ExploreGrid 
            content={uniqueContent}
            onLike={handleLike}
            onFollow={handleFollow}
            onMediaClick={handleMediaClick}
            isLoading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            activeFilter={activeFilter}
          />
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

export default Explore;
