
import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExploreGrid from '@/components/explore/ExploreGrid';
import VerticalMediaFeed from '@/components/explore/VerticalMediaFeed';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';

const Explore = () => {
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_TYPES.VIDEOS);
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
    
    // Verified Pros: Empty for now (no content yet)
    if (activeFilter === FILTER_TYPES.VERIFIED_PROS) {
      return false; // No content for verified pros yet
    }
    
    // Channels: Empty for now (no content yet)
    if (activeFilter === FILTER_TYPES.CHANNELS) {
      return false; // No content for channels yet
    }
    
    // Hack Shack: Only videos with #hackshack hashtag
    if (activeFilter === FILTER_TYPES.HACK_SHACK) {
      return item.type === MEDIA_TYPES.VIDEO && (
        item.title?.toLowerCase().includes('#hackshack') || 
        item.title?.toLowerCase().includes('hackshack')
      );
    }
    
    // Brain Game: Videos and photos with #braingame hashtag
    if (activeFilter === FILTER_TYPES.BRAIN_GAME) {
      return (item.type === MEDIA_TYPES.VIDEO || item.type === MEDIA_TYPES.IMAGE) && (
        item.title?.toLowerCase().includes('#braingame') || 
        item.title?.toLowerCase().includes('braingame')
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
        
        <main className="pb-20">
          {/* Sticky Filter Bar with padding */}
          <div className="md:container md:mx-auto md:px-0 py-6">
            <ExploreFilters 
              activeFilter={activeFilter} 
              onFilterChange={setActiveFilter}
            />
          </div>

          {/* Edge-to-edge Grid - no container padding */}
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
