import React, { useState, useMemo, lazy, Suspense } from 'react';
import CompactHeader from '@/components/header/CompactHeader';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';

import SegmentedControl from '@/components/discover/SegmentedControl';
import DiscoverContent from '@/components/discover/DiscoverContent';
import { DiscoverHero } from '@/components/discover/DiscoverHero';
import { useDiscoverHero } from '@/hooks/useDiscoverHero';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { FILTER_TYPES } from '@/components/explore/types';
import { useNavigate } from 'react-router-dom';

// Lazy load heavy components
const FollowingFeed = lazy(() => import('@/components/discover/FollowingFeed'));

// New tab type for Phase 1
type DiscoverTab = 'watch' | 'learn' | 'explore' | 'following';

const Discover = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { main } = useDiscoverQuery();
  
  // Hero data for Watch tab
  const { data: heroItem, isLoading: heroLoading } = useDiscoverHero();

  // Determine current tab from main param
  const currentTab: DiscoverTab = useMemo(() => {
    if (['shorts', 'videos', 'channels', 'watch'].includes(main)) {
      return 'watch';
    }
    if (['learn', 'explore', 'following'].includes(main)) {
      return main as DiscoverTab;
    }
    return 'watch';
  }, [main]);

  // For Watch tab, we use the videos filter (shorts)
  const activeFilter = FILTER_TYPES.VIDEOS;

  // Reset tags when switching main pill
  React.useEffect(() => {
    setSelectedTags([]);
  }, [main]);
  
  // Get content for the feed
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(activeFilter);

  const { optimisticPosts } = useOptimisticPostInsertion();

  // Combine optimistic posts with regular content
  const allContent = React.useMemo(() => {
    return [...optimisticPosts, ...(content || [])];
  }, [optimisticPosts, content]);

  // Transform content to MediaItem[] for FullscreenMediaModal
  const mediaItems: MediaItem[] = useMemo(() => {
    const currentContent = allContent || [];
    return currentContent.flatMap((post) => {
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

  const handleLike = (contentId: string) => {
    // Update likes optimistically
  };

  const handleFollow = (contentId: string) => {
    // Update follow status optimistically
  };

  const handleMediaClick = (item: any) => {
    const clickedIndex = mediaItems.findIndex(mediaItem => 
      mediaItem.url === item.src || mediaItem.id === item.id
    );
    if (clickedIndex !== -1) {
      setModalStartIndex(clickedIndex);
      setModalOpen(true);
    }
  };

  // Render content based on current tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'watch':
        return (
          <>
            {/* Hero at top of Watch */}
            <div className="px-3 md:px-4 pt-4 pb-2">
              <DiscoverHero item={heroItem || null} isLoading={heroLoading} />
            </div>

            {/* Shorts grid (existing DiscoverContent handles this) */}
            <div className="md:container md:mx-auto md:px-0">
              <DiscoverContent
                onLike={handleLike}
                onFollow={handleFollow}
                onMediaClick={handleMediaClick}
                searchQuery={searchQuery}
                selectedTags={selectedTags}
              />
            </div>
          </>
        );

      case 'learn':
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Learn</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Improve your game with trusted advice, tailored to your level. Coming soon.
            </p>
          </div>
        );

      case 'explore':
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Explore</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Discover the world's best courses and plan your golf journey. Coming soon.
            </p>
          </div>
        );

      case 'following':
        return (
          <div className="md:container md:mx-auto md:px-0 mt-4">
            <Suspense fallback={null}>
              <FollowingFeed onMediaClick={handleMediaClick} />
            </Suspense>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageRoot className="min-h-screen bg-background text-foreground">
      <CompactHeader />
      <FadeInContent>
        <main className="pb-20 compact-header-offset">
          {/* Tabs */}
          <div className="relative z-30">
            <SegmentedControl 
              activeTab={activeFilter}
              onTabChange={() => {}}
            />
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </main>
      </FadeInContent>

      {/* Fullscreen Media Modal */}
      <FullscreenMediaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mediaUrl={mediaItems.map(item => item.url)}
        mediaType={mediaItems.map(item => item.type)}
        initialIndex={modalStartIndex}
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
    </PageRoot>
  );
};

export default Discover;
