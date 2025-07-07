
import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExploreGrid from '@/components/explore/ExploreGrid';
import MobileDebugConsole from '@/components/explore/MobileDebugConsole';
import VerticalMediaFeed from '@/components/explore/VerticalMediaFeed';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';

import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';

const Explore = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [debugVisible, setDebugVisible] = useState(false);
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent();
  
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

  const filteredContent = content.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Videos') return item.type === 'video';
    if (activeFilter === 'Photos') return item.type === 'image';
    if (activeFilter === 'Pros') return item.user?.verified;
    if (activeFilter === 'Tips') return item.label === 'Pro Tip';
    if (activeFilter === 'Trending') return item.label === 'Trending';
    if (activeFilter === 'Clubs') return item.label === 'From Clubhouse';
    if (activeFilter === 'Shank Tank') {
      return item.type === 'video' && item.title?.toLowerCase().includes('#shanktank');
    }
    return true;
  });

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
            content={filteredContent}
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
            allContent={content}
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
