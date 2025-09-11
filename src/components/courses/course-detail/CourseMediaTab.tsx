import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { adaptClubMediaArrayToExploreItems, ExploreContentItem } from '@/lib/adapters/clubMediaToExplore';
import { Image as ImageIcon } from 'lucide-react';
// MediaGrid imports
import { MediaGrid, GRID_PRESETS, adaptExploreContentToMediaItems } from '@/components/media-grid';
import type { MediaItem as NewMediaItem } from '@/components/media-grid';
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

const CourseMediaTab = ({ courseId, portalTarget }: CourseMediaTabProps) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [modalPortalTarget, setModalPortalTarget] = useState<HTMLElement | null>(null);

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

  // Adapt for new MediaGrid
  const mediaItems = useMemo(
    () => adaptExploreContentToMediaItems(exploreItems),
    [exploreItems]
  );

  const handleMediaClick = (item: NewMediaItem) => {
    if (FLAGS.USE_VERTICAL_FEED_FOR_PROFILE_MEDIA) {
      const index = exploreItems.findIndex(media => media.id === item.id);
      if (index !== -1) {
        setPosts(exploreItems);
        openFeed(exploreItems[index]);
      }
    } else {
      const index = exploreItems.findIndex(media => media.id === item.id);
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
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No media yet</h3>
        <p className="text-muted-foreground">Share photos and videos of this course in your posts or reviews!</p>
      </div>
    );
  }

  const renderFullscreenModal = () => {
    if (selectedMediaIndex === null || !exploreItems[selectedMediaIndex]) return null;

    // Transform exploreItems to StandardMediaItem[] with proper poster URLs
    const standardizedMediaItems: StandardMediaItem[] = exploreItems.map(item => {
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

    const currentItem = exploreItems[selectedMediaIndex];
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
      {/* MediaGrid with modalMedia preset */}
      <MediaGrid
        items={mediaItems}
        config={{
          ...GRID_PRESETS.modalMedia,
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