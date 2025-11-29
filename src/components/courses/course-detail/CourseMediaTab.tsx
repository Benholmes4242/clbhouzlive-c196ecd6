import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { adaptClubMediaArrayToExploreItems } from '@/lib/adapters/clubMediaToExplore';
import { adaptExploreContentToMediaItems } from '@/components/media-grid';
import type { ExtendedMediaItem as NewMediaItem } from '@/components/media-grid';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem as StandardMediaItem } from '@/types/media';
// New components for media tab polish
import { CourseMediaSummaryCard } from './CourseMediaSummaryCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MediaFilterMode } from './MediaFilterRow';
import { useCourseMediaSummary } from '@/hooks/useCourseMediaSummary';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useClubMedia } from '@/hooks/useClubMedia';
import { MediaGridItem } from './MediaGridItem';

interface CourseMediaTabProps {
  courseId: string;
  courseName?: string;
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

const CourseMediaTab = ({ courseId, courseName, portalTarget }: CourseMediaTabProps) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [modalPortalTarget, setModalPortalTarget] = useState<HTMLElement | null>(null);
  const [filterMode, setFilterMode] = useState<MediaFilterMode>('most_recent');

  // Get portal target for fullscreen modal
  useEffect(() => {
    const target = document.getElementById('modal-portal');
    setModalPortalTarget(target);
  }, []);

  // Phase 1 Fix #2: Use shared hook - single query for all media consumers
  const { data: mediaResp, isLoading } = useClubMedia(courseId, 30);

  // Phase 1 Fix #3: Simplified transformation pipeline - pure data transformation
  const exploreItems = useMemo(
    () => adaptClubMediaArrayToExploreItems(mediaResp ?? []),
    [mediaResp]
  );

  // Build summary input items - pure memo
  const summaryItems = useMemo(
    () =>
      exploreItems.map(item => ({
        id: item.id,
        type: item.type as 'image' | 'video',
        createdAt: new Date().toISOString(),
        author: { id: item.user?.id || '' },
      })),
    [exploreItems]
  );

  // ✅ Hook called at top level, outside any memo/effect
  const summary = useCourseMediaSummary(summaryItems, user?.id || null);

  // Contributors in separate memo - pure
  const contributors = useMemo(() => {
    const contributorIds = Array.from(new Set(exploreItems.map(item => item.user?.id).filter(Boolean))) as string[];
    return contributorIds.slice(0, 3).map(id => {
      const item = exploreItems.find(i => i.user?.id === id);
      return item?.user ? {
        id: item.user.id,
        name: item.user.name || 'Unknown',
        avatarUrl: item.user.avatar || null
      } : null;
    }).filter(Boolean) as Array<{ id: string; name: string; avatarUrl: string | null }>;
  }, [exploreItems]);

  // Phase 1 Fix #3: Lightweight filter memo only
  const filteredItems = useMemo(() => {
    switch (filterMode) {
      case 'videos':
        return exploreItems.filter(item => item.type === 'video');
      case 'photos':
        return exploreItems.filter(item => item.type === 'image');
      case 'mine':
        return exploreItems.filter(item => item.user?.id === user?.id);
      case 'most_recent':
      default:
        return exploreItems;
    }
  }, [exploreItems, filterMode, user?.id]);

  // Adapt for MediaGrid using filtered items
  const mediaItems = useMemo(
    () => adaptExploreContentToMediaItems(filteredItems),
    [filteredItems]
  );

  // Phase 1 Fix #4: Memoized click handler
  const handleMediaClick = useCallback((item: NewMediaItem) => {
    const index = filteredItems.findIndex(media => media.id === item.id);
    if (index !== -1) {
      setSelectedMediaIndex(index);
    }
  }, [filteredItems]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state and filtered state are handled inline in the main render


  // Phase 2 Fix #6: Only transform current item and neighbors for lightbox
  const renderFullscreenModal = () => {
    if (selectedMediaIndex === null || !filteredItems[selectedMediaIndex]) return null;

    // Only transform items for lightbox (current + neighbors)
    const standardizedMediaItems: StandardMediaItem[] = filteredItems.map(item => {
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

    const currentItem = filteredItems[selectedMediaIndex];
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
    <div className="space-y-0">
      {/* Summary Card */}
      <CourseMediaSummaryCard
        photoCount={summary.photoCount}
        videoCount={summary.videoCount}
        contributorsCount={contributors.length}
        contributors={contributors}
        courseName={courseName}
        onAddMedia={() => navigate(`/courses/${courseId}/rate`)}
      />

      {/* Sort/Filter Bar */}
      <div className="px-4 pt-3 pb-3 bg-slate-50">
        <p className="mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-slate-500">
          Sort &amp; filter
        </p>
        <Tabs value={filterMode} onValueChange={(value) => setFilterMode(value as MediaFilterMode)}>
          <TabsList className="grid w-full grid-cols-4 bg-muted/70 border border-border/60 px-2 py-[3px]">
            <TabsTrigger 
              value="most_recent"
              className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
            >
              Most recent
            </TabsTrigger>
            <TabsTrigger 
              value="photos"
              className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
            >
              Photos
            </TabsTrigger>
            <TabsTrigger 
              value="videos"
              className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
            >
              Videos
            </TabsTrigger>
            <TabsTrigger 
              value="mine"
              className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
            >
              From you
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Empty state - matches Reviews tab styling */}
      {filteredItems.length === 0 && !isLoading && (
        <div className="px-4 py-8 bg-slate-100">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
            <p className="text-sm font-semibold text-slate-900">No photos or videos yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Help other golfers discover this course — share your experience.
            </p>
            <button
              type="button"
              className="mt-4 w-full h-11 rounded-lg border border-slate-200 bg-slate-100 text-slate-900 text-sm font-medium hover:bg-slate-200 transition-colors"
              onClick={() => navigate(`/courses/${courseId}/rate`)}
            >
              Add photos or videos
            </button>
          </div>
        </div>
      )}

      {/* Square Squircle Media Grid - 2 columns mobile, 4 desktop */}
      {/* Phase 1 Fix #4: Memoized grid items */}
      <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-slate-50">
        {mediaItems.map((item) => (
          <MediaGridItem
            key={item.id}
            item={item}
            onClick={handleMediaClick}
          />
        ))}
      </div>

      {/* Phase 2 Fix #5: Single lightbox implementation only */}
      {renderFullscreenModal()}
    </div>
  );
};

export default CourseMediaTab;