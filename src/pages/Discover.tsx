import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExploreGrid from '@/components/explore/ExploreGrid';
import VerticalMediaFeed from '@/components/explore/VerticalMediaFeed';
import DiscoverTrendingVideos from '@/components/discover/DiscoverTrendingVideos';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { useFullscreenVideoModal } from '@/hooks/useVideoPlaybackManager';
import FullscreenVideoModal from '@/components/ui/fullscreen-video-modal';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';

const Discover = () => {
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_TYPES.VIDEOS);
  
  // Get content for the active filter (for the tabs section)
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(activeFilter);
  
  // Get static content for Trending Videos (always use Friends filter)
  const { 
    content: trendingContent
  } = useInfiniteExploreContent(FILTER_TYPES.FRIENDS);
  
  const { 
    isOpen: isFeedOpen, 
    initialItem, 
    openFeed, 
    closeFeed 
  } = useVerticalMediaFeed();

  const modalManager = useFullscreenVideoModal();

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

  const handleTrendingVideoClick = (item: any) => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Mobile: open vertical feed
      openFeed(item);
    } else {
      // Desktop: open fullscreen modal
      modalManager.openModal({
        src: item.src,
        user: {
          id: item.user?.id || item.id,
          profile_photo_url: item.user?.avatar || undefined,
          display_name: item.user?.name || undefined,
          username: item.user?.username || undefined
        },
        content: item.title || undefined
      });
    }
  };

  // Apply client-side filtering for non-database filters
  const filteredContent = content.filter(item => {
    // Friends filtering is handled in the database
    if (activeFilter === FILTER_TYPES.FRIENDS) {
      return true;
    }
    
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

  // Remove duplicates based on src URL for tab content
  const uniqueContent = filteredContent.filter((item, index, self) => 
    index === self.findIndex(t => t.src === item.src)
  );

  // Remove duplicates for trending videos (static content)
  const uniqueTrendingContent = trendingContent.filter((item, index, self) => 
    index === self.findIndex(t => t.src === item.src)
  );

  return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pb-20">
          {/* Trending Videos Section - Static content that doesn't change with tabs */}
          <DiscoverTrendingVideos 
            videos={uniqueTrendingContent}
            onVideoClick={handleTrendingVideoClick}
          />

          {/* Your Discover Section */}
          <div className="container pt-6 pb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Discover</h2>
            <ExploreFilters 
              activeFilter={activeFilter} 
              onFilterChange={setActiveFilter}
              excludeFilters={[FILTER_TYPES.FRIENDS]}
            />
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
              activeFilter={activeFilter}
              isDiscoverPage={true}
            />
          </div>
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

        {/* Fullscreen Video Modal */}
        <FullscreenVideoModal
          isOpen={modalManager.isOpen}
          onClose={modalManager.closeModal}
          videoData={modalManager.videoData}
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

export default Discover;