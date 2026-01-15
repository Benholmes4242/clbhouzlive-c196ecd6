/**
 * WatchTab - Main container for Watch/Shorts tab
 * 
 * Structure:
 * 1. Hero Video (most viewed with fallback chain)
 * 2. Suggested For You (LiveClubhouseStrip)
 * 3. Shorts Grid (2-column infinite scroll)
 * 
 * NO search bar, NO sort/filter pills - clean viewing experience
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WatchHeroVideo } from './WatchHeroVideo';
import { WatchShortsGrid } from './WatchShortsGrid';
import { LiveClubhouseStrip } from '@/components/shorts/LiveClubhouseStrip';
import { useWatchHeroVideo, HeroVideo } from '@/hooks/useWatchHeroVideo';
import { useWatchShorts, WatchShort } from '@/hooks/useWatchShorts';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';

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
  const navigate = useNavigate();
  
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
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useWatchShorts(heroVideo?.id);

  // Handle hero video tap - open fullscreen with hero as first item
  const handleHeroTap = useCallback(() => {
    if (!heroVideo) return;

    // Build playlist: hero first, then all shorts
    const heroItem = toFullscreenItem(heroVideo);
    const shortsItems = shorts.map(toFullscreenItem);
    const playlist = [heroItem, ...shortsItems];

    console.log('[WatchTab] Hero tapped, opening fullscreen:', {
      heroId: heroVideo.id.slice(0, 8),
      playlistLength: playlist.length,
    });

    openFullscreen(playlist, 0, heroVideo.id);
  }, [heroVideo, shorts, openFullscreen]);

  // Handle grid video tap - open fullscreen at tapped index
  const handleVideoTap = useCallback((video: WatchShort, index: number, allVideos: WatchShort[]) => {
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

    console.log('[WatchTab] Grid video tapped:', {
      videoId: video.id.slice(0, 8),
      gridIndex: index,
      adjustedIndex,
      playlistLength: playlist.length,
    });

    openFullscreen(playlist, adjustedIndex, video.id);
  }, [heroVideo, openFullscreen]);

  // Handle infinite scroll load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-page)]">
      {/* Hero Video - Most Viewed */}
      <WatchHeroVideo 
        video={heroVideo}
        trendingPeriod={trendingPeriod}
        isLoading={isLoadingHero}
        onTap={handleHeroTap}
      />

      {/* Gap between hero and suggested */}
      <div className="h-4" />

      {/* Suggested For You */}
      <LiveClubhouseStrip />

      {/* Gap between suggested and grid */}
      <div className="h-4" />

      {/* Shorts Grid */}
      <WatchShortsGrid
        shorts={shorts}
        isLoading={isLoadingShorts}
        onVideoTap={handleVideoTap}
        onLoadMore={handleLoadMore}
        hasMore={hasNextPage}
        isLoadingMore={isFetchingNextPage}
      />
    </div>
  );
}

export default WatchTab;
