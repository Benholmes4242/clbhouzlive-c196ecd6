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
import { SegmentedTabs, SegmentedTabOption } from '@/components/ui/SegmentedTabs';
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
  const { data: mediaResp, isLoading, isError, refetch } = useClubMedia(courseId, 30);

  // A3: Pre-warm HLS.js when media tab mounts with videos
  useEffect(() => {
    if (mediaResp && mediaResp.length > 0) {
      const hasVideos = mediaResp.some(item => item.media_type === 'video');
      if (hasVideos) {
        import('@/hooks/useHlsUrlCache').then(({ warmHlsJs }) => {
          warmHlsJs();
        });
      }
    }
  }, [mediaResp]);

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

  // Filter options with clear option when filter active
  const isFilterActive = filterMode === 'photos' || filterMode === 'videos';
  
  const filterOptions: SegmentedTabOption[] = [
    { value: 'most_recent', label: 'Most recent' },
    { value: 'photos', label: 'Photos' },
    { value: 'videos', label: 'Videos' },
  ];

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

  // F2: Clear transformed media arrays on lightbox close
  const handleLightboxClose = useCallback(() => {
    setSelectedMediaIndex(null);
  }, []);

  // Loading state with proper skeleton placeholders
  if (isLoading) {
    return (
      <div className="space-y-0">
        {/* Header skeleton */}
        <section className="px-4 pt-6 pb-6">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-28 bg-muted rounded animate-pulse" />
          </div>
        </section>
        {/* Filter skeleton */}
        <div className="px-4 pt-4 pb-4 bg-muted/30">
          <div className="h-3 w-20 bg-muted rounded animate-pulse mb-3" />
          <div className="h-10 w-full bg-muted rounded-sq-md animate-pulse" />
        </div>
        {/* Grid skeleton - 2 tiles matching final aspect ratio */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-muted/30 pt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="px-4 py-8">
        <div className="rounded-sq-lg border border-border/60 bg-card px-4 py-6 text-center">
          <p className="text-sm font-semibold text-foreground">Couldn't load media</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-sq-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all"
          >
            Tap to retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state and filtered state are handled inline in the main render


  // A1: Lazy window transformation for lightbox performance
  const renderFullscreenModal = () => {
    if (selectedMediaIndex === null || !filteredItems[selectedMediaIndex]) return null;

    // Transform only visible window (current + 1 neighbor on each side)
    const transformWindow = (centerIdx: number, radius = 1): StandardMediaItem[] => {
      const start = Math.max(0, centerIdx - radius);
      const end = Math.min(filteredItems.length, centerIdx + radius + 1);
      
      return filteredItems.slice(start, end).map((item, localIdx) => {
        const absoluteIdx = start + localIdx;
        
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
    };

    // Start with initial window
    const standardizedMediaItems = transformWindow(selectedMediaIndex, 2);
    
    // Build full arrays for lightbox (will lazy-load on swipe)
    const allItems: StandardMediaItem[] = filteredItems.map(item => ({
      id: item.id,
      type: item.type as 'image' | 'video',
      url: item.src,
      alt: item.title || (item.type === 'video' ? 'Video' : 'Photo'),
      streamId: item.type === 'video' ? getStreamIdFromUrl(item.src) : undefined,
      posterUrl: item.type === 'video' ? getStreamPoster(item.src, '1s') ?? undefined : undefined,
    }));

    const currentItem = filteredItems[selectedMediaIndex];
    const mediaUrls = allItems.map(item => item.url);
    const mediaTypes = allItems.map(item => item.type);

    const modalContent = (
      <FullscreenMediaModal
        isOpen={true}
        onClose={handleLightboxClose}
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

  // Calculate overflow count for "+X" indicator on last visible tile
  const totalMediaCount = exploreItems.length;
  const visibleCount = 4; // Show 4 tiles in preview
  const overflowCount = Math.max(0, mediaItems.length - visibleCount);

  return (
    <div className="space-y-0">
      {/* Summary Card - 24px section spacing */}
      <CourseMediaSummaryCard
        photoCount={summary.photoCount}
        videoCount={summary.videoCount}
        contributorsCount={contributors.length}
        courseName={courseName}
        onAddMedia={() => navigate(`/courses/${courseId}/rate`)}
      />

      {/* Sort/Filter Bar - 24px from header, 12px label→pills, 24px to grid */}
      <div className="px-4 pt-6 pb-6 bg-muted/30">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
          Sort &amp; filter
        </p>
        <div className="flex items-center gap-2">
          <SegmentedTabs
            options={filterOptions}
            value={filterMode}
            onChange={(value) => setFilterMode(value as MediaFilterMode)}
            className="flex-1"
          />
          {/* Clear button - only when filter active */}
          {isFilterActive && (
            <button
              type="button"
              onClick={() => setFilterMode('most_recent')}
              className="flex items-center gap-1 rounded-sq-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.97] transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Empty state after filtering */}
      {filteredItems.length === 0 && !isLoading && (
        <div className="px-4 py-8">
          <div className="rounded-sq-lg border border-border/60 bg-card px-4 py-6 text-center">
            <p className="text-sm font-semibold text-foreground">
              {filterMode === 'photos' ? 'No photos yet' : filterMode === 'videos' ? 'No videos yet' : 'No media yet'}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {filterMode === 'most_recent' 
                ? 'Be the first to share media for this course.'
                : `Try a different filter or add your own ${filterMode === 'photos' ? 'photos' : 'videos'}.`
              }
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 rounded-sq-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              onClick={() => navigate(`/courses/${courseId}/rate`)}
            >
              Add a photo or video
            </button>
          </div>
        </div>
      )}

      {/* Square Media Grid - 2 columns mobile, 4 desktop */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-muted/30">
          {mediaItems.map((item, index) => (
            <MediaGridItem
              key={item.id}
              item={item}
              onClick={handleMediaClick}
              // Show overflow count on 4th tile (index 3) if there's more
              overflowCount={index === visibleCount - 1 && overflowCount > 0 ? overflowCount : undefined}
            />
          ))}
        </div>
      )}

      {/* Phase 2 Fix #5: Single lightbox implementation only */}
      {renderFullscreenModal()}
    </div>
  );
};

export default CourseMediaTab;