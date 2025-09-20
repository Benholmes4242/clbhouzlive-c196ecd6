import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import MediaSearch from '@/components/discover/MediaSearch';
import DiscoverPillRow from '@/components/discover/DiscoverPillRow';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import SuggestedUsersRedesigned from '@/components/discover/SuggestedUsersRedesigned';
import SubpillBar from '@/components/discover/SubpillBar';
import DiscoverContent from '@/components/discover/DiscoverContent';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';

const Discover = () => {
  // Use vertical feed for consistency with Activity tab
  const USE_MODAL_DISCOVER = false; // using DiscoverVerticalFeed for consistency
  
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_TYPES.VIDEOS);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { main, sub } = useDiscoverQuery();
  
  // Sync activeFilter with URL state
  React.useEffect(() => {
    const mainToFilter: Record<string, string> = {
      'friends': FILTER_TYPES.FRIENDS,
      'videos': FILTER_TYPES.VIDEOS,
      'photos': FILTER_TYPES.PHOTOS,
      'trending': FILTER_TYPES.TRENDING,
      'verified-pros': FILTER_TYPES.VERIFIED_PROS,
      'channels': FILTER_TYPES.CHANNELS,
      'hack-shack': FILTER_TYPES.HACK_SHACK,
    };
    const newFilter = mainToFilter[main] || FILTER_TYPES.VIDEOS;
    if (newFilter !== activeFilter) {
      setActiveFilter(newFilter);
    }
  }, [main]);
  
  // Get content for the vertical feed (we'll use the new DiscoverContent component for the grid)
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(activeFilter === FILTER_TYPES.TRENDING ? FILTER_TYPES.FRIENDS : activeFilter);

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
      setPosts(content || []);
      openFeed(item);
    }
  };

  const handleUserFollow = (userId: string) => {
    console.log('User followed:', userId);
    // In real app: API call to follow user
  };

  // Transform content to MediaItem[] for FullscreenMediaModal
  const mediaItems: MediaItem[] = useMemo(() => {
    const currentContent = content || [];
    return currentContent.flatMap((post, postIndex) => {
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
  }, [content]);


  return (
      <div className="min-h-screen bg-white">
        <Header />
        
        <main className="pb-20">
          {/* Media Search - Discover Only */}
          <div className="px-4 md:container md:mx-auto md:px-6 pt-4">
            <MediaSearch 
              placeholder="Search videos and photos..." 
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Filter Pills Row */}
          <div className="mt-3">
            <DiscoverPillRow 
              activeFilter={activeFilter} 
              onFilterChange={setActiveFilter}
            />
          </div>

          {/* Suggested Users */}
          <div className="mt-4">
            <SuggestedUsersRedesigned onUserFollow={handleUserFollow} />
          </div>

          {/* Dynamic Subpill Bar */}
          <div className="mt-4">
            <SubpillBar />
          </div>

          {/* Main Grid with Container */}
          <div className="md:container md:mx-auto md:px-0 mt-4">
            <DiscoverContent
              onLike={handleLike}
              onFollow={handleFollow}
              onMediaClick={handleMediaClick}
              searchQuery={searchQuery}
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