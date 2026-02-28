import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { adaptClubMediaArrayToExploreItems } from '@/lib/adapters/clubMediaToExplore';
import { adaptExploreContentToMediaItems } from '@/components/media-grid';
import type { ExtendedMediaItem as NewMediaItem } from '@/components/media-grid';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { CourseMediaSummaryCard } from './CourseMediaSummaryCard';
import { SegmentedTabOption } from '@/components/ui/SegmentedTabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourseMediaSummary } from '@/hooks/useCourseMediaSummary';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCourseMediaPaginated } from '@/hooks/useCourseMediaPaginated';
import { MediaGridItem } from './MediaGridItem';
import { LazyMediaGridItem } from './LazyMediaGridItem';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { useLazyTiles } from '@/components/shared/grid/useLazyTiles';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { toast } from 'sonner';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { MediaItem } from '@/types/media';

export type MediaFilterMode = 'most_recent' | 'photos' | 'videos' | 'friends' | 'mine';

interface CourseMediaTabProps {
  courseId: string;
  courseName?: string;
  portalTarget?: HTMLElement | null;
}

const CourseMediaTab = ({ courseId, courseName, portalTarget }: CourseMediaTabProps) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterMode, setFilterMode] = useState<MediaFilterMode>('most_recent');
  const hasPreloadedFirst = useRef(false);
  
  // Track current fullscreen post for engagement
  const [currentFullscreenPostId, setCurrentFullscreenPostId] = useState<string | null>(null);

  // Fix 2: Use paginated hook instead of hard-capped useClubMedia
  const {
    data: paginatedData,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCourseMediaPaginated(courseId, 30);

  // Flatten all pages into a single array
  const mediaResp = useMemo(
    () => paginatedData?.pages.flatMap(page => page.edges) ?? [],
    [paginatedData]
  );

  // Eager preload first video's HLS manifest on mount (before paint)
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current || !mediaResp?.length) return;
    
    const firstVideo = mediaResp.find(item => item.media_type === 'video');
    if (firstVideo?.media_url) {
      const uid = uidFromNode({ media_url: firstVideo.media_url });
      if (uid) {
        preloadHlsManifest(generateStreamHlsUrl(uid));
        hasPreloadedFirst.current = true;
      }
    }
  }, [mediaResp]);

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

  // Fix 4: Preload links for first 4 tile poster/image URLs
  useEffect(() => {
    if (!mediaResp?.length) return;
    const first4 = mediaResp.slice(0, 4);
    const links: HTMLLinkElement[] = [];

    first4.forEach(item => {
      const url = item.thumbnailUrl || item.media_url;
      if (!url) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
      links.push(link);
    });

    return () => {
      links.forEach(link => document.head.removeChild(link));
    };
  }, [mediaResp]);

  // Phase 1 Fix #3: Simplified transformation pipeline
  const exploreItems = useMemo(
    () => adaptClubMediaArrayToExploreItems(mediaResp ?? []),
    [mediaResp]
  );

  // Build summary input items
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

  const summary = useCourseMediaSummary(summaryItems, user?.id || null);

  // Contributors
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

  const isFilterActive = filterMode === 'photos' || filterMode === 'videos';
  
  const filterOptions: SegmentedTabOption[] = [
    { value: 'most_recent', label: 'Most recent' },
    { value: 'photos', label: 'Photos' },
    { value: 'videos', label: 'Videos' },
  ];

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

  const mediaItems = useMemo(
    () => adaptExploreContentToMediaItems(filteredItems),
    [filteredItems]
  );

  // Lazy loading
  const { visibleIndices, registerTile } = useLazyTiles({
    totalItems: mediaItems.length,
    initialVisible: 8,
    preloadViewports: 2,
    estimatedRowHeight: 150,
  });

  // Engagement hook for fullscreen
  const { toggleLike } = usePostEngagement(currentFullscreenPostId);

  // Share handler
  const handleShareReview = useCallback((reviewId: string) => {
    const shareUrl = `${window.location.origin}/courses/${courseId}?review=${reviewId}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Review on ${courseName || 'course'}`,
        url: shareUrl,
      }).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Copied to clipboard');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  }, [courseId, courseName]);

  // Fix 6: Use 'course' source type instead of 'explore'
  const { openFullscreen } = useUnifiedFullscreen('course', {
    allowLandscape: true,
    
    onIndexChange: (index) => {
      const currentItem = filteredItems[index];
      setCurrentFullscreenPostId(currentItem?.id || null);
    },
    
    onLike: (itemId) => {
      toggleLike();
    },
    
    onComment: (itemId) => {
      // CommentsPage opens automatically
    },
    
    onShare: (itemId) => {
      handleShareReview(itemId);
    },
    
    onClose: () => {
      setCurrentFullscreenPostId(null);
    },
  });

  const handleMediaClick = useCallback((item: NewMediaItem) => {
    const index = filteredItems.findIndex(media => media.id === item.id);
    if (index !== -1) {
      setCurrentFullscreenPostId(item.id);
      openFullscreen(filteredItems, index);
    }
  }, [filteredItems, openFullscreen]);

  // Fix 5: Pull-to-refresh handler
  const handlePullToRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['club-media-paginated', courseId] });
  }, [queryClient, courseId]);

  // Fix 2: Load more handler
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const photoCount = summary.photoCount;
  const videoCount = summary.videoCount;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col">
        {/* Header skeleton */}
        <section className="px-4 pt-6 pb-6 bg-muted">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-3 w-28 bg-muted-foreground/10 rounded animate-pulse" />
          </div>
        </section>
        {/* Filter skeleton */}
        <section className="px-4 pt-4 pb-4 bg-muted">
          <div className="h-3 w-20 bg-muted-foreground/10 rounded animate-pulse mb-3" />
          <div className="h-10 w-full bg-muted-foreground/10 rounded-sq-md animate-pulse" />
        </section>
        {/* Fix 7: Grid skeleton matches 2-col mobile layout */}
        <section className="bg-muted">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-border">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <section className="px-4 py-8 bg-muted">
        <div className="rounded-sq-lg border border-border bg-card px-4 py-6 text-center">
          <p className="text-sm font-semibold text-foreground">Couldn't load media</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-sq-md bg-muted text-foreground px-4 py-2 text-sm font-medium hover:bg-muted/80 active:scale-[0.98] transition-all min-h-[44px]"
          >
            Tap to retry
          </button>
        </div>
      </section>
    );
  }

  const hasAnyMedia = exploreItems.length > 0;

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
      <div className="flex flex-col">
        {/* Summary Card */}
        {hasAnyMedia && (
          <section className="bg-muted">
            <CourseMediaSummaryCard
              photoCount={summary.photoCount}
              videoCount={summary.videoCount}
              contributorsCount={contributors.length}
              courseName={courseName}
              onAddMedia={() => navigate(`/courses/${courseId}/rate`)}
            />
          </section>
        )}

        {/* Sort/Filter Bar */}
        {hasAnyMedia && (
          <section className="px-4 pt-8 pb-6 bg-muted">
            <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as MediaFilterMode)} className="w-full">
              <TabsList className="bg-transparent border-0 px-0 py-0 gap-0 w-full flex justify-center">
                {filterOptions.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none min-h-[44px] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out active:scale-[0.97] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:rounded-full after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]"
                  >
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </section>
        )}

        {/* Empty state - no media at all */}
        {!hasAnyMedia && !isLoading && (
          <section className="px-4 py-8 bg-muted flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-foreground mb-1">No media yet</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
              Be the first to share photos or videos of {courseName || 'this course'}.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/courses/${courseId}/rate`)}
              className="inline-flex items-center gap-2 rounded-sq-pill bg-muted text-foreground ring-1 ring-border px-5 py-2.5 text-sm font-medium hover:bg-muted/80 active:scale-[0.98] transition-all min-h-[44px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add a photo or video
            </button>
            <p className="text-xs text-muted-foreground mt-3">
              Reviews help other golfers discover great courses
            </p>
          </section>
        )}

        {/* Filtered empty state */}
        {hasAnyMedia && filteredItems.length === 0 && !isLoading && (
          <section className="px-4 py-8 bg-muted flex flex-col items-center text-center">
            <p className="text-sm font-semibold text-foreground mb-1">
              {filterMode === 'photos' ? 'No photos yet' : 'No videos yet'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Try a different filter or add your own.
            </p>
            <button
              type="button"
              onClick={() => setFilterMode('most_recent')}
              className="inline-flex items-center gap-1.5 rounded-sq-sm bg-muted text-foreground ring-1 ring-border px-4 py-2 text-sm font-medium hover:bg-muted/80 active:scale-[0.98] transition-all min-h-[44px]"
            >
              Clear filter
            </button>
          </section>
        )}

        {/* Square Media Grid — Fix 3: pass index for fetchPriority */}
        {filteredItems.length > 0 && (
          <section className="bg-muted">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-border">
              {mediaItems.map((item, index) => {
                const isVisible = visibleIndices.has(index);
                
                if (!isVisible) {
                  return (
                    <LazyMediaGridItem
                      key={`placeholder-${item.id}`}
                      index={index}
                      registerTile={registerTile}
                    />
                  );
                }
                
                return (
                  <MediaGridItem
                    key={item.id}
                    item={item}
                    index={index}
                    onClick={handleMediaClick}
                  />
                );
              })}
            </div>

            {/* Fix 2: Load More button */}
            {hasNextPage && filterMode === 'most_recent' && (
              <div className="flex justify-center py-6">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground px-6 py-2.5 hover:bg-muted active:scale-[0.98] transition-all min-h-[44px] disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </section>
        )}

        {/* End-of-content indicator */}
        {filteredItems.length > 0 && !isLoading && !hasNextPage && (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              That's everything — {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
              {videoCount > 0 && ` · ${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`}
            </p>
          </div>
        )}

        <ScrollToTopGlass />
      </div>
    </PullToRefreshContainer>
  );
};

export default CourseMediaTab;
