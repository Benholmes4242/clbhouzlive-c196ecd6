import React, { useState, useMemo, lazy, Suspense } from 'react';
import DiscoverHeaderLight from '@/components/header/DiscoverHeaderLight';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';

import SegmentedControl from '@/components/discover/SegmentedControl';
import SlidingPanels from '@/components/ui/SlidingPanels';

// Phase 1 Components
import DiscoverHero, { useDiscoverHero } from '@/components/discover/DiscoverHero';
import CreatorSpotlightRail, { useSpotlightCreators } from '@/components/discover/CreatorSpotlightRail';
import LongFormHighlight, { useLongFormHighlights } from '@/components/discover/LongFormHighlight';

import DiscoverContent from '@/components/discover/DiscoverContent';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { FILTER_TYPES } from '@/components/explore/types';
import { LEGACY_TO_NEW_TAB, DiscoverTab } from '@/constants/discoverTabs';

// Import light theme CSS
import '@/styles/discover-light.css';

// Lazy load heavy/inactive components for better initial bundle size
const FollowingFeed = lazy(() => import('@/components/discover/FollowingFeed'));

type TabKey = 'watch' | 'learn' | 'explore' | 'following';

const Discover = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { main } = useDiscoverQuery();
  
  // Map legacy main values to new tab system
  const currentTab: TabKey = (LEGACY_TO_NEW_TAB[main] || 'watch') as TabKey;

  // Phase 1 hooks for Watch tab
  const { hero, isLoading: heroLoading } = useDiscoverHero();
  const { creators, isLoading: creatorsLoading } = useSpotlightCreators();
  const { items: longFormItems, isLoading: longFormLoading } = useLongFormHighlights();

  // Get content for the vertical feed
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(FILTER_TYPES.VIDEOS, undefined, undefined);

  const { optimisticPosts } = useOptimisticPostInsertion();

  // Combine optimistic posts with regular content
  const allContent = useMemo(() => {
    return [...optimisticPosts, ...(content || [])];
  }, [optimisticPosts, content]);

  // Transform content to MediaItem[] for FullscreenMediaModal
  const mediaItems: MediaItem[] = useMemo(() => {
    const currentContent = allContent || [];
    return currentContent.flatMap((post, postIndex) => {
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

  // Render Watch tab content
  const renderWatchTab = () => (
    <div className="md:container md:mx-auto md:px-0">
      {/* Hero - Single, no carousel */}
      <DiscoverHero item={hero} isLoading={heroLoading} />
      
      {/* Creator Spotlight Rail - Suggested golfers after hero */}
      <CreatorSpotlightRail 
        creators={creators} 
        isLoading={creatorsLoading} 
      />
      
      {/* Shorts Grid - Primary Feed */}
      <DiscoverContent
        onLike={handleLike}
        onFollow={handleFollow}
        onMediaClick={handleMediaClick}
        searchQuery={searchQuery}
        selectedTags={selectedTags}
      />
      
      {/* Long-Form Highlight - Another interruption */}
      <LongFormHighlight 
        items={longFormItems} 
        isLoading={longFormLoading} 
      />
    </div>
  );

  // Render stub for Learn tab (Phase 2)
  const renderLearnTab = () => (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-6xl mb-4">📚</div>
      <h2 className="text-xl font-semibold text-[--discover-text-primary] mb-2">
        Learn Tab Coming Soon
      </h2>
      <p className="text-[--discover-text-secondary] max-w-sm">
        Improve your game with trusted advice, tailored to your level.
      </p>
    </div>
  );

  // Render stub for Explore tab (Phase 3)
  const renderExploreTab = () => (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-6xl mb-4">🌍</div>
      <h2 className="text-xl font-semibold text-[--discover-text-primary] mb-2">
        Explore Tab Coming Soon
      </h2>
      <p className="text-[--discover-text-secondary] max-w-sm">
        Discover courses and content from around the world.
      </p>
    </div>
  );

  // Render Following tab (existing functionality)
  const renderFollowingTab = () => (
    <div className="md:container md:mx-auto md:px-0 mt-4">
      <Suspense fallback={null}>
        <FollowingFeed onMediaClick={handleMediaClick} />
      </Suspense>
    </div>
  );

  return (
    <PageRoot className="min-h-screen" style={{ background: '#F4F5F7' }}>
      <DiscoverHeaderLight />
      <FadeInContent>
        <main className="pb-20 compact-header-offset">
          {/* Tabs - integrated with canvas, no separate container */}
          <SegmentedControl />

          {/* Tab Content */}
          <SlidingPanels
            activeKey={currentTab}
            order={['watch', 'learn', 'explore', 'following'] as const}
          >
            {(key: TabKey) => {
              switch (key) {
                case 'watch':
                  return renderWatchTab();
                case 'learn':
                  return renderLearnTab();
                case 'explore':
                  return renderExploreTab();
                case 'following':
                  return renderFollowingTab();
                default:
                  return renderWatchTab();
              }
            }}
          </SlidingPanels>
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
