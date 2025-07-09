import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExploreGrid from '@/components/explore/ExploreGrid';
import MobileDebugConsole from '@/components/explore/MobileDebugConsole';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';

const Explore = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [debugVisible, setDebugVisible] = useState(false);
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent();

  const handleLike = (contentId: string) => {
    // Update likes optimistically - could be enhanced with actual API call
    console.log('Liked content:', contentId);
  };

  const handleFollow = (contentId: string) => {
    // Update follow status optimistically - could be enhanced with actual API call
    console.log('Followed user from content:', contentId);
  };

  const handleMediaClick = (item: any) => {
    // Media click handler - could open full screen viewer
    console.log('Media clicked:', item);
  };

  const filteredContent = content.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Videos') return item.type === 'video';
    if (activeFilter === 'Photos') return item.type === 'image';
    if (activeFilter === 'Pros') return item.user?.verified;
    if (activeFilter === 'Tips') return item.label === 'Pro Tip';
    if (activeFilter === 'Trending') return item.label === 'Trending';
    if (activeFilter === 'Clubs') return item.label === 'From Clubhouse';
    if (activeFilter === 'Hack Shack') {
      // Only videos with #hackshack hashtag
      return item.type === 'video' && (
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