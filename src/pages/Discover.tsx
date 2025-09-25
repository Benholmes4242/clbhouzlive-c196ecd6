import React, { useState, useMemo } from 'react';


import MediaSearch from '@/components/discover/MediaSearch';
import DiscoverPillRow from '@/components/discover/DiscoverPillRow';
import TrendingTagsBar from '@/components/discover/TrendingTagsBar';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import SuggestedUsersRedesigned from '@/components/discover/SuggestedUsersRedesigned';
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


  return (
    <div className="min-h-screen bg-background text-foreground page-with-header">
      <main className="pb-20">
          {/* Suggested Users - Top Section */}
          <div className="mt-2">
            <SuggestedUsersRedesigned onUserFollow={handleUserFollow} />
          </div>

          {/* Search + Filter Pills Divider */}
          <div className="pt-3 pb-2 md:pt-4 md:pb-3">
            <div className="backdrop-blur-md bg-white/60 border-l-0 border-r-0 border-white/20 px-4 md:px-6 py-4 md:py-6 space-y-3 md:space-y-4"
                 style={{ boxShadow: 'var(--hud-shadow, 0 4px 20px rgba(0, 0, 0, 0.1))' }}>
              
              {/* Search */}
              <div className="w-full">
                <MediaSearch 
                  placeholder="Search videos and photos..." 
                  onSearchChange={setSearchQuery}
                />
              </div>

              {/* Main Filter Pills - larger size */}
              <div className="space-y-2">
                <DiscoverPillRow 
                  activeFilter={activeFilter} 
                  onFilterChange={setActiveFilter}
                />
              </div>

              {/* Hashtag Pills - smaller size */}
              <div className="space-y-2">
                <TrendingTagsBar onTagsChange={setSelectedTags} />
              </div>
            </div>
          </div>

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