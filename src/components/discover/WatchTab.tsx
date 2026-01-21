/**
 * WatchTab - Main container for Watch/Shorts tab
 * 
 * Structure:
 * 1. Hero Video (most viewed with fallback chain)
 * 2. Suggested For You (LiveClubhouseStrip)
 * 3. Shorts Grid (2-column infinite scroll)
 * 
 * NO search bar, NO sort/filter pills - clean viewing experience
 * 
 * SKELETON-UNTIL-READY PATTERN:
 * - Shows full skeleton until both hero AND grid videos are prefetched
 * - Uses useWatchReadyQueue to track ready state
 * - Reveals all content at once for premium experience
 */

import { useCallback, useEffect } from 'react';
import { WatchHeroVideo } from './WatchHeroVideo';
import { WatchShortsGrid } from './WatchShortsGrid';
import { WatchTabSkeleton } from './WatchTabSkeleton';
import { LiveClubhouseStrip } from '@/components/shorts/LiveClubhouseStrip';
import { useWatchHeroVideo, HeroVideo } from '@/hooks/useWatchHeroVideo';
import { useWatchShorts, WatchShort } from '@/hooks/useWatchShorts';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { useWatchReadyQueue } from '@/hooks/useWatchReadyQueue';
import { 
  logWatch, 
  logWatchQueryState, 
  createWatchLifecycleLogger,
  watchTiming,
} from './debug';

// Adapter to convert our types to fullscreen-compatible format
function toFullscreenItem(video: WatchShort | HeroVideo): any {
  const primaryMedia = video.media[0];
  return {
    id: video.id,
    src: primaryMedia?.media_url,
    type: 'video',
    thumbnailSrc: primaryMedia?.poster_url,
    user: video.creator ? {
      id: video.creator.id,
      name: video.creator.display_name || video.creator.username,
      username: video.creator.username,
      avatar: video.creator.profile_photo_url,
    } : undefined,
    title: video.content,
    likes: video.like_count,
    durationSeconds: primaryMedia?.duration_seconds,
    aspectRatio: primaryMedia?.aspect_ratio,
    width: (primaryMedia as any)?.width,
    height: (primaryMedia as any)?.height,
  };
}

export function WatchTab() {
  // Debug lifecycle
  const lifecycleLogger = createWatchLifecycleLogger('WatchTab');
  
  useEffect(() => {
    watchTiming.start('WatchTab-mount-to-ready');
    lifecycleLogger.onMount();
    
    return () => {
      lifecycleLogger.onUnmount();
    };
  }, []);
  
  // Fullscreen player hook
  const { openFullscreen } = useUnifiedFullscreen('explore', {
    allowLandscape: true,
  });

  // Hero video data
  const { 
    heroVideo, 
    trendingPeriod, 
    isLoading: isLoadingHero,
  } = useWatchHeroVideo();

  // Shorts grid data (exclude hero from grid)
  const {
    shorts,
    isLoading: isLoadingShorts,
    isError: isGridError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchShorts,
  } = useWatchShorts(heroVideo?.id);

  // Ready queue for skeleton-until-ready pattern
  const { 
    isFeedReady, 
    isHeroReady, 
    isGridReady,
    gridReadyCount,
    gridTotalCount,
    debugInfo 
  } = useWatchReadyQueue(heroVideo, shorts);

  // Debug query states
  useEffect(() => {
    logWatchQueryState('heroVideo', {
      isLoading: isLoadingHero,
      isSuccess: !!heroVideo,
    });
  }, [isLoadingHero, heroVideo]);

  useEffect(() => {
    logWatchQueryState('shorts', {
      isLoading: isLoadingShorts,
      isFetching: isFetchingNextPage,
      isSuccess: shorts.length > 0,
      isError: isGridError,
    });
    
    if (shorts.length > 0) {
      logWatch('data', 'WatchTab', `📊 Shorts loaded: ${shorts.length} items`, {
        hasNextPage,
        firstShortId: shorts[0]?.id?.slice(0, 8),
      });
    }
  }, [isLoadingShorts, shorts.length, isFetchingNextPage, isGridError, hasNextPage]);

  // Mark ready when both loaded AND ready queue signals ready
  useEffect(() => {
    if (isFeedReady && !isLoadingHero && !isLoadingShorts) {
      watchTiming.end('WatchTab-mount-to-ready');
      logWatch('lifecycle', 'WatchTab', '✅ READY', {
        heroLoaded: !!heroVideo,
        shortsCount: shorts.length,
        gridReadyCount,
      });
    }
  }, [isFeedReady, isLoadingHero, isLoadingShorts, heroVideo, shorts.length, gridReadyCount]);

  // Handle hero video tap - open fullscreen with hero as first item
  const handleHeroTap = useCallback(() => {
    if (!heroVideo) return;
    
    logWatch('interaction', 'WatchTab', '👆 Hero tapped', {
      heroId: heroVideo.id?.slice(0, 8),
      trendingPeriod,
    });

    // Build playlist: hero first, then all shorts
    const heroItem = toFullscreenItem(heroVideo);
    const shortsItems = shorts.map(toFullscreenItem);
    const playlist = [heroItem, ...shortsItems];

    openFullscreen(playlist, 0, heroVideo.id);
  }, [heroVideo, shorts, openFullscreen, trendingPeriod]);

  // Handle grid video tap - open fullscreen at tapped index
  const handleVideoTap = useCallback((video: WatchShort, index: number, allVideos: WatchShort[]) => {
    logWatch('interaction', 'WatchTab', '👆 Grid video tapped', {
      videoId: video.id?.slice(0, 8),
      index,
      totalVideos: allVideos.length,
    });
    
    // Build playlist: hero (if exists) + all grid videos
    const playlist: any[] = [];
    
    if (heroVideo) {
      playlist.push(toFullscreenItem(heroVideo));
    }
    
    allVideos.forEach(v => {
      playlist.push(toFullscreenItem(v));
    });

    // Adjust index to account for hero
    const adjustedIndex = heroVideo ? index + 1 : index;

    openFullscreen(playlist, adjustedIndex, video.id);
  }, [heroVideo, openFullscreen]);

  // Handle infinite scroll load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      logWatch('data', 'WatchTab', '📥 Load more triggered', {
        currentCount: shorts.length,
        hasNextPage,
      });
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, shorts.length]);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    logWatch('interaction', 'WatchTab', '🔄 Retry requested');
    refetchShorts();
  }, [refetchShorts]);

  // Skeleton visibility: Show until videos are prefetched and ready
  // This covers both initial data load AND prefetch phase
  const shouldShowSkeleton = !isFeedReady;
  
  // Debug log skeleton state
  useEffect(() => {
    console.log('[WatchTab] shouldShowSkeleton:', shouldShowSkeleton, { 
      isFeedReady, 
      isLoadingHero, 
      isLoadingShorts,
      shortsCount: shorts.length,
      isHeroReady,
      isGridReady,
    });
  }, [shouldShowSkeleton, isFeedReady, isLoadingHero, isLoadingShorts, shorts.length, isHeroReady, isGridReady]);

  if (shouldShowSkeleton) {
    return <WatchTabSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-page)]">
      {/* Hero Video - Most Viewed */}
      <WatchHeroVideo 
        video={heroVideo}
        trendingPeriod={trendingPeriod}
        isLoading={isLoadingHero}
        onTap={handleHeroTap}
      />

      {/* Gap between hero and suggested - reduced from h-4 (16px) to h-2 (8px) */}
      <div className="h-2" />

      {/* Suggested For You */}
      <LiveClubhouseStrip />

      {/* Gap between suggested and grid - reduced from h-4 (16px) to h-2 (8px) */}
      <div className="h-2" />

      {/* Shorts Grid */}
      <WatchShortsGrid
        shorts={shorts}
        isLoading={isLoadingShorts}
        isError={isGridError}
        onRetry={handleRetry}
        onVideoTap={handleVideoTap}
        onLoadMore={handleLoadMore}
        hasMore={hasNextPage}
        isLoadingMore={isFetchingNextPage}
      />
    </div>
  );
}

export default WatchTab;
