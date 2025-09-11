import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ExploreGrid from '@/components/explore/ExploreGrid';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { adaptClubMediaArrayToExploreItems, ExploreContentItem } from '@/lib/adapters/clubMediaToExplore';
import { Play, Image as ImageIcon, X } from 'lucide-react';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
// New MediaGrid imports
import { MediaGrid, GRID_PRESETS, adaptExploreContentToMediaItems } from '@/components/media-grid';
import type { MediaItem as NewMediaItem } from '@/components/media-grid';

interface CourseMediaTabProps {
  courseId: string;
  portalTarget?: HTMLElement | null;
}

interface MediaItem {
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
  const [useNewMediaGrid, setUseNewMediaGrid] = useState(true); // Toggle for A/B testing

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

  const handleMediaClick = (item: ExploreContentItem | NewMediaItem) => {
    const index = exploreItems.findIndex(media => media.id === item.id);
    setSelectedMediaIndex(index);
  };

  const handleLike = () => {
    // Club media doesn't have likes - empty function for ExploreGrid compatibility
  };

  const handleFollow = () => {
    // Club media doesn't have follows - empty function for ExploreGrid compatibility
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

    const currentItem = exploreItems[selectedMediaIndex];
    const mediaUrls = exploreItems.map(item => item.src);
    const mediaTypes = exploreItems.map(item => item.type === 'video' ? 'video' : 'image') as ('image' | 'video')[];

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
      {/* Toggle for testing - can be removed in production */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => setUseNewMediaGrid(!useNewMediaGrid)}
          className="underline hover:text-foreground"
        >
          {useNewMediaGrid ? 'Switch to ExploreGrid' : 'Switch to MediaGrid'}
        </button>
        <span>({useNewMediaGrid ? 'New MediaGrid' : 'Original ExploreGrid'})</span>
      </div>

      {useNewMediaGrid ? (
        /* New MediaGrid with modalMedia preset */
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
      ) : (
        /* Original ExploreGrid for comparison */
        <ExploreGrid
          content={exploreItems}
          onLike={handleLike}
          onFollow={handleFollow}
          onMediaClick={handleMediaClick}
          isLoading={false}
          hasMore={false}
          onLoadMore={() => {}}
          hideBadges={true}
        />
      )}

      {/* Fullscreen Modal */}
      {renderFullscreenModal()}
    </div>
  );
};

export default CourseMediaTab;