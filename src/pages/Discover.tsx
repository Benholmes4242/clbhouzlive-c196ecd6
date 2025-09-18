import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExploreGrid from '@/components/explore/ExploreGrid';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import SuggestedUsersRedesigned from '@/components/discover/SuggestedUsersRedesigned';
import TrendingNow from '@/components/discover/TrendingNow';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';

import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';

const Discover = () => {
  // Use vertical feed for consistency with Activity tab
  const USE_MODAL_DISCOVER = false; // using DiscoverVerticalFeed for consistency
  
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_TYPES.VIDEOS);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  
  // Get content for the active filter (for the tabs section)
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(activeFilter === FILTER_TYPES.TRENDING ? FILTER_TYPES.FRIENDS : activeFilter);
  
  // Get trending content specifically for the trending tab
  const { 
    content: trendingContent
  } = useInfiniteExploreContent(FILTER_TYPES.FRIENDS);
  
  const { 
    isOpen: isFeedOpen, 
    posts: feedPosts,
    initialItem, 
    openFeed, 
    closeFeed,
    setPosts
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
    if (USE_MODAL_DISCOVER) {
      // Find the index of the clicked item in our flattened media array
      const clickedIndex = mediaItems.findIndex(mediaItem => 
        mediaItem.url === item.src || mediaItem.id === item.id
      );
      if (clickedIndex !== -1) {
        setModalStartIndex(clickedIndex);
        setModalOpen(true);
      }
    } else {
      // Use vertical feed - set posts and open feed
      setPosts(uniqueContent);
      openFeed(item);
    }
  };

  const handleUserFollow = (userId: string) => {
    console.log('User followed:', userId);
    // In real app: API call to follow user
  };

  const handleHashtagClick = (tag: string) => {
    // Filter content by hashtag
    console.log('Filter by hashtag:', tag);
  };

  const handleAudioClick = (audioId: string) => {
    // Show posts using this audio or preview the audio
    console.log('Audio clicked:', audioId);
  };

  // Apply client-side filtering for non-database filters
  const filteredContent = (activeFilter === FILTER_TYPES.TRENDING ? trendingContent : content).filter(item => {
    // First apply existing filter logic
    let passesFilter = true;
    
    // Friends filtering is handled in the database
    if (activeFilter === FILTER_TYPES.FRIENDS || activeFilter === FILTER_TYPES.TRENDING) {
      passesFilter = true;
    }
    // Videos and Photos filtering is handled in the database
    else if (activeFilter === FILTER_TYPES.VIDEOS || activeFilter === FILTER_TYPES.PHOTOS) {
      passesFilter = true;
    }
    // Verified Pros: Empty for now (no content yet)
    else if (activeFilter === FILTER_TYPES.VERIFIED_PROS) {
      passesFilter = false; // No content for verified pros yet
    }
    // Channels: Empty for now (no content yet)
    else if (activeFilter === FILTER_TYPES.CHANNELS) {
      passesFilter = false; // No content for channels yet
    }
    // Hack Shack: Only videos with #hackshack hashtag
    else if (activeFilter === FILTER_TYPES.HACK_SHACK) {
      passesFilter = item.type === MEDIA_TYPES.VIDEO && (
        item.title?.toLowerCase().includes('#hackshack') || 
        item.title?.toLowerCase().includes('hackshack')
      );
    }
    // Brain Game: Videos and photos with #braingame hashtag
    else if (activeFilter === FILTER_TYPES.BRAIN_GAME) {
      passesFilter = (item.type === MEDIA_TYPES.VIDEO || item.type === MEDIA_TYPES.IMAGE) && (
        item.title?.toLowerCase().includes('#braingame') || 
        item.title?.toLowerCase().includes('braingame')
      );
    }

    return passesFilter;
  });

  // Remove duplicates based on src URL for tab content
  const uniqueContent = filteredContent.filter((item, index, self) => 
    index === self.findIndex(t => t.src === item.src)
  );

  // Transform content to MediaItem[] for FullscreenMediaModal
  const mediaItems: MediaItem[] = useMemo(() => {
    return uniqueContent.flatMap((post, postIndex) => {
      // Handle posts with media array vs single media
      const mediaArray = post.media && post.media.length > 0 ? post.media : [{ 
        id: `${post.id}-single`, 
        media_type: post.type, 
        media_url: post.src 
      }];
      
      return mediaArray.map((media, mediaIndex) => {
        if (media.media_type === 'video') {
          const streamId = getStreamIdFromUrl(media.media_url);
          return {
            id: `${post.id}-${mediaIndex}`,
            type: 'video' as const,
            url: media.media_url,
            streamId,
            posterUrl: getStreamPoster(media.media_url, '1s') ?? undefined,
            alt: post.title || 'Video'
          };
        }
        return {
          id: `${post.id}-${mediaIndex}`,
          type: 'image' as const,
          url: media.media_url,
          alt: post.title || 'Photo'
        };
      });
    });
  }, [uniqueContent]);


  return (
      <div className="min-h-screen bg-white">
        <Header />
        
        <main className="pb-20">
          {/* Your Discover Section - 16px gap from header */}
          <div className="md:container md:mx-auto md:px-0 pt-4">
            <ExploreFilters 
              activeFilter={activeFilter} 
              onFilterChange={setActiveFilter}
            />
          </div>

          {/* Suggested Users - 8px gap from pills on mobile, 32px on desktop */}
          <div className="mt-4">
            <SuggestedUsersRedesigned onUserFollow={handleUserFollow} />
          </div>

          {/* Trending Now Section - 0px gap from Suggested Users cards */}
          <div className="mt-4">
            <TrendingNow 
              onHashtagClick={handleHashtagClick}
              onAudioClick={handleAudioClick}
            />
          </div>

          {/* Main Grid with Container - 16px gap from Trending Now pills */}
          <div className="md:container md:mx-auto md:px-0 mt-0">
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

        {/* Conditional Modal/Feed based on feature flag */}
        {USE_MODAL_DISCOVER ? (
          // New FullscreenMediaModal approach
          <FullscreenMediaModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            mediaUrl={mediaItems.map(item => item.url)}
            mediaType={mediaItems.map(item => item.type)}
            initialIndex={modalStartIndex}
            // Optional: Add user info if available from posts
          />
        ) : (
          // DiscoverVerticalFeed approach
          initialItem && (
            <DiscoverVerticalFeed
              isOpen={isFeedOpen}
              onClose={closeFeed}
              posts={feedPosts}
              onLike={handleLike}
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoadingMore={loading}
              initialItem={initialItem}
            />
          )
        )}


        <style>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
  );
};

export default Discover;