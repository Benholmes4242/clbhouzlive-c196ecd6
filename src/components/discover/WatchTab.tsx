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
 * DEBUG MODE (Jan 2026):
 * - Comprehensive logging matching profile page debug system
 * - Tracks lifecycle, data fetching, and playback coordination
 */

import { useCallback, useEffect } from 'react';
import { WatchHeroVideo } from './WatchHeroVideo';
import { WatchShortsGrid } from './WatchShortsGrid';
import { WatchTabSkeleton } from './WatchTabSkeleton';
import { useWatchHeroVideo, HeroVideo } from '@/hooks/useWatchHeroVideo';
import { useWatchShorts, WatchShort } from '@/hooks/useWatchShorts';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

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
    likedPostIds,
    isLoading: isLoadingShorts,
    isError: isGridError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchShorts,
  } = useWatchShorts(heroVideo?.id);

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

  // Mark ready when both loaded
  useEffect(() => {
    if (!isLoadingHero && !isLoadingShorts) {
      watchTiming.end('WatchTab-mount-to-ready');
      logWatch('lifecycle', 'WatchTab', '✅ READY', {
        heroLoaded: !!heroVideo,
        shortsCount: shorts.length,
      });
    }
  }, [isLoadingHero, isLoadingShorts, heroVideo, shorts.length]);

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

  // Pull-to-refresh handler
  const handlePullToRefresh = useCallback(async () => {
    logWatch('interaction', 'WatchTab', '🔄 Pull-to-refresh');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['watch-hero-video'] }),
      queryClient.invalidateQueries({ queryKey: ['watch-shorts-base'] }),
      queryClient.invalidateQueries({ queryKey: ['watch-shorts-user-likes'] }),
    ]);
  }, [queryClient]);

  // Full page skeleton when both are loading initially
  if (isLoadingHero && isLoadingShorts) {
    return <WatchTabSkeleton />;
  }

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
      <div className="flex flex-col min-h-screen" style={{ background: '#F8FAFC' }}>
        {/* Hero Video - Most Viewed */}
        <WatchHeroVideo 
          video={heroVideo}
          trendingPeriod={trendingPeriod}
          isLoading={isLoadingHero}
          onTap={handleHeroTap}
        />

        {/* Section Label */}
        <div className="mt-6 mb-3 px-4">
          <span className="text-base font-semibold" style={{ color: '#374151' }}>
            Latest Shorts
          </span>
        </div>

        {/* Shorts Grid - LiveClubhouseStrip is injected after 8 tiles */}
        <WatchShortsGrid
          shorts={shorts}
          likedPostIds={likedPostIds}
          isLoading={isLoadingShorts}
          isError={isGridError}
          onRetry={handleRetry}
          onVideoTap={handleVideoTap}
          onLoadMore={handleLoadMore}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          showSuggestedStrip={true}
        />
      </div>
    </PullToRefreshContainer>
  );
}

export default WatchTab;
