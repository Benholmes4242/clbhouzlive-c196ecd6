import React, { useState, useMemo } from 'react';
import ClbhouzPageSpinner from '@/components/ui/ClbhouzPageSpinner';

import MediaSearch from '@/components/discover/MediaSearch';
import SegmentedControl from '@/components/discover/SegmentedControl';
import ExploreFilters from '@/components/explore/ExploreFilters';

import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
// import SuggestedUsersRedesigned from '@/components/discover/SuggestedUsersRedesigned'; // Stored for future use
import DiscoverContent from '@/components/discover/DiscoverContent';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';

const Discover = () => {
  // Use vertical feed for consistency with Activity tab
  const USE_MODAL_DISCOVER = false; // using DiscoverVerticalFeed for consistency
  
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_TYPES.VIDEOS);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { main } = useDiscoverQuery();
  
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
      // Reset tags when switching main pill
      setSelectedTags([]);
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

  const { optimisticPosts } = useOptimisticPostInsertion();

  // Combine optimistic posts with regular content
  const allContent = React.useMemo(() => {
    return [...optimisticPosts, ...(content || [])];
  }, [optimisticPosts, content]);

  // Transform content to MediaItem[] for FullscreenMediaModal - use allContent
  const mediaItems: MediaItem[] = useMemo(() => {
    const currentContent = allContent || [];
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
  }, [allContent]);

  // Show loader on first paint if no content yet
  if (loading && allContent.length === 0) {
    return <ClbhouzPageSpinner label="Loading videos…" />;
  }

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
      // Use vertical feed - set posts and open feed, using allContent instead of content
      setPosts(allContent || []);
      openFeed(item);
    }
  };

  const handleUserFollow = (userId: string) => {
    console.log('User followed:', userId);
    // In real app: API call to follow user
  };

  return (
    <div className="min-h-screen bg-background text-foreground page-with-header">
      <main className="pb-20">
          {/* Static Tabs and Search */}
          <div className="relative z-30 bg-white">
            {/* Segmented Control Tabs */}
            <SegmentedControl 
              activeTab={activeFilter} 
              onTabChange={setActiveFilter}
            />
            
            {/* Search Bar */}
            <div className="px-1 pt-2 pb-1 bg-white">
              <div className="mx-1">
                <MediaSearch 
                  placeholder="Search" 
                  onSearchChange={setSearchQuery}
                  className="w-full border-0 rounded-full px-4 py-2 text-sm placeholder:text-gray-500 focus:shadow-sm transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Filter Pills Row */}
            <div className="pt-1 pb-3 border-b border-gray-50 pl-1.5">
              <ExploreFilters 
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </div>
          </div>

          {/* Suggested Users - Below Tabs/Search */}
          {/* <div className="pt-1">
            <SuggestedUsersRedesigned onUserFollow={handleUserFollow} />
          </div> */}
          {/* Commented out for future use - SuggestedUsersRedesigned component is stored in /components/discover/ */}

          {/* Main Grid with Container */}
          <div className="md:container md:mx-auto md:px-0 mt-4">
            <DiscoverContent
              onLike={handleLike}
              onFollow={handleFollow}
              onMediaClick={handleMediaClick}
              searchQuery={searchQuery}
              selectedTags={selectedTags}
            />
          </div>
      </main>
        
        

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