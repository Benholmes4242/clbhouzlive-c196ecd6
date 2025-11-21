import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { adaptClubMediaArrayToExploreItems, ExploreContentItem } from '@/lib/adapters/clubMediaToExplore';
import { Image as ImageIcon, Video } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { IoFilter } from 'react-icons/io5';
// MediaGrid imports
import { MediaGrid, GRID_PRESETS, adaptExploreContentToMediaItems } from '@/components/media-grid';
import type { ExtendedMediaItem as NewMediaItem } from '@/components/media-grid';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem as StandardMediaItem } from '@/types/media';
import { FLAGS } from '@/config/flags';

interface CourseMediaTabProps {
  courseId: string;
  portalTarget?: HTMLElement | null;
}

import { MediaItem } from '@/types/media';

interface LocalMediaItem {
  id: string;
  source: 'post' | 'review';
  sourceId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
  };
}

type MediaFilterType = 'all' | 'videos' | 'photos';

const CourseMediaTab = ({ courseId, portalTarget }: CourseMediaTabProps) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [modalPortalTarget, setModalPortalTarget] = useState<HTMLElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<MediaFilterType>('all');

  // Vertical feed for consistent UX
  const { 
    isOpen: isFeedOpen, 
    posts: feedPosts,
    initialItem, 
    openFeed, 
    closeFeed,
    setPosts
  } = useVerticalMediaFeed();

  // Get portal target for fullscreen modal
  useEffect(() => {
    const target = document.getElementById('modal-portal');
    setModalPortalTarget(target);
  }, []);

  const { data: mediaResp, isLoading } = useQuery({
    queryKey: ['course-media', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-club-media', {
        body: { clubId: courseId, limit: 30 }
      });

      if (error) throw error;
      return data?.edges ?? [];
    },
    enabled: !!courseId,
  });

  // Use memo so remounts don't flash empty
  const exploreItems = useMemo(
    () => adaptClubMediaArrayToExploreItems(mediaResp ?? []),
    [mediaResp]
  );

  // Filter media items based on active filter
  const filteredExploreItems = useMemo(() => {
    switch (activeFilter) {
      case 'videos':
        return exploreItems.filter(item => item.type === 'video');
      case 'photos':
        return exploreItems.filter(item => item.type === 'image');
      default:
        return exploreItems;
    }
  }, [exploreItems, activeFilter]);

  // Adapt for new MediaGrid using filtered items
  const mediaItems = useMemo(
    () => adaptExploreContentToMediaItems(filteredExploreItems),
    [filteredExploreItems]
  );

  const handleMediaClick = (item: NewMediaItem) => {
    if (FLAGS.USE_VERTICAL_FEED_FOR_PROFILE_MEDIA) {
      const index = filteredExploreItems.findIndex(media => media.id === item.id);
      if (index !== -1) {
        setPosts(filteredExploreItems);
        openFeed(filteredExploreItems[index]);
      }
    } else {
      const index = filteredExploreItems.findIndex(media => media.id === item.id);
      setSelectedMediaIndex(index);
    }
  };

  const handleLike = (contentId: string) => {
    // Handle like functionality for vertical feed
  };

  const handleLoadMore = () => {
    // Handle load more for vertical feed if needed
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (exploreItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 pt-10 pb-24 text-center text-muted-foreground gap-3">
        <div className="w-14 h-14 rounded-full bg-surface-alt flex items-center justify-center">
          <ImageIcon className="w-7 h-7" />
        </div>

        <div>
          <p className="text-base font-medium text-foreground">No media yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Share photos and videos of this course in your posts or reviews!
          </p>
        </div>
      </div>
    );
  }

  if (filteredExploreItems.length === 0 && exploreItems.length > 0) {
    return (
      <div className="space-y-6">
        {/* Filter Dropdown */}
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-2 hover:bg-muted/50 transition-colors rounded-md"
              >
                <IoFilter className="w-5 h-5 text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-background border border-border z-[1100]"
            >
              <DropdownMenuItem 
                onClick={() => setActiveFilter('all')}
                className={`cursor-pointer ${activeFilter === 'all' ? 'bg-accent' : ''}`}
              >
                <span className="mr-2">📱</span>
                All Media
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveFilter('videos')}
                className={`cursor-pointer ${activeFilter === 'videos' ? 'bg-accent' : ''}`}
              >
                <Video className="mr-2 h-4 w-4" />
                Videos only
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveFilter('photos')}
                className={`cursor-pointer ${activeFilter === 'photos' ? 'bg-accent' : ''}`}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Photos only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No {activeFilter === 'all' ? 'media' : activeFilter} found</h3>
          <p className="text-muted-foreground">
            {activeFilter === 'all' 
              ? 'Share photos and videos of this course in your posts or reviews!' 
              : `No ${activeFilter} available for this course. Try changing the filter.`
            }
          </p>
        </div>
      </div>
    );
  }

  const renderFullscreenModal = () => {
    if (selectedMediaIndex === null || !filteredExploreItems[selectedMediaIndex]) return null;

    // Transform filteredExploreItems to StandardMediaItem[] with proper poster URLs
    const standardizedMediaItems: StandardMediaItem[] = filteredExploreItems.map(item => {
      if (item.type === 'video') {
        const streamId = getStreamIdFromUrl(item.src);
        return {
          id: item.id,
          type: 'video' as const,
          url: item.src,
          streamId,
          posterUrl: getStreamPoster(item.src, '1s') ?? undefined,
          alt: item.title || 'Video'
        };
      }
      return {
        id: item.id,
        type: 'image' as const,
        url: item.src,
        alt: item.title || 'Photo'
      };
    });

    const currentItem = filteredExploreItems[selectedMediaIndex];
    const mediaUrls = standardizedMediaItems.map(item => item.url);
    const mediaTypes = standardizedMediaItems.map(item => item.type);

    const modalContent = (
      <FullscreenMediaModal
        isOpen={true}
        onClose={() => setSelectedMediaIndex(null)}
        mediaUrl={mediaUrls}
        mediaType={mediaTypes}
        initialIndex={selectedMediaIndex}
        user={currentItem.user ? {
          id: currentItem.user.id,
          profile_photo_url: currentItem.user.avatar
        } : undefined}
        displayName={currentItem.user?.name}
      />
    );

    // Use modal portal target for proper z-index stacking
    return modalPortalTarget ? createPortal(modalContent, modalPortalTarget) : modalContent;
  };

  return (
    <div className="space-y-6">
      {/* Filter Dropdown */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-2 hover:bg-muted/50 transition-colors rounded-md"
            >
              <IoFilter className="w-5 h-5 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-background border border-border z-[1100]"
          >
            <DropdownMenuItem 
              onClick={() => setActiveFilter('all')}
              className={`cursor-pointer ${activeFilter === 'all' ? 'bg-accent' : ''}`}
            >
              <span className="mr-2">📱</span>
              All Media
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setActiveFilter('videos')}
              className={`cursor-pointer ${activeFilter === 'videos' ? 'bg-accent' : ''}`}
            >
              <Video className="mr-2 h-4 w-4" />
              Videos only
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setActiveFilter('photos')}
              className={`cursor-pointer ${activeFilter === 'photos' ? 'bg-accent' : ''}`}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Photos only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* MediaGrid with modalMedia preset */}
      <MediaGrid
        items={mediaItems}
        config={{
          ...GRID_PRESETS.modalMedia,
          features: {
            ...GRID_PRESETS.modalMedia.features,
            autoplay: false // Disable autoplay to show play icons instead of mute buttons
          },
          interactions: {
            onMediaClick: handleMediaClick
          }
        }}
        isLoading={isLoading}
      />

      {/* Conditional Modal/Feed based on feature flag */}
      {FLAGS.USE_VERTICAL_FEED_FOR_PROFILE_MEDIA ? (
        initialItem && (
          <DiscoverVerticalFeed
            isOpen={isFeedOpen}
            onClose={closeFeed}
            posts={feedPosts}
            onLike={handleLike}
            onLoadMore={handleLoadMore}
            hasMore={false}
            isLoadingMore={false}
            initialItem={initialItem}
          />
        )
      ) : (
        renderFullscreenModal()
      )}
    </div>
  );
};

export default CourseMediaTab;