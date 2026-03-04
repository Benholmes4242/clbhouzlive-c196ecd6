/**
 * WatchTab - Main container for Watch/Shorts tab
 * 
 * Structure:
 * 1. Search bar (filters shorts in real-time)
 * 2. Shorts Grid (2-column infinite scroll)
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { WatchShortsGrid } from './WatchShortsGrid';
import { WatchTabSkeleton } from './WatchTabSkeleton';
import { useWatchShorts, WatchShort } from '@/hooks/useWatchShorts';
// REMOVED: useUnifiedFullscreen — Phase 5 fullscreen system deleted
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  logWatch, 
  logWatchQueryState, 
  createWatchLifecycleLogger,
  watchTiming,
} from './debug';

// Adapter to convert our types to fullscreen-compatible format
function toFullscreenItem(video: WatchShort): any {
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
  const [searchInput, setSearchInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);

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

  // Shorts grid data
  const {
    shorts,
    likedPostIds,
    isLoading: isLoadingShorts,
    isError: isGridError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchShorts,
  } = useWatchShorts();

  // Client-side search filtering
  const filteredShorts = useMemo(() => {
    if (!debouncedSearch.trim()) return shorts;
    const q = debouncedSearch.toLowerCase();
    return shorts.filter(short => {
      const caption = short.content?.toLowerCase() || '';
      const creatorName = short.creator?.display_name?.toLowerCase() || '';
      const creatorUsername = short.creator?.username?.toLowerCase() || '';
      const courseName = (short as any).golf_courses?.name?.toLowerCase() || '';
      return caption.includes(q) || creatorName.includes(q) || creatorUsername.includes(q) || courseName.includes(q);
    });
  }, [shorts, debouncedSearch]);

  // Debug query states
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

  // Mark ready when loaded
  useEffect(() => {
    if (!isLoadingShorts) {
      watchTiming.end('WatchTab-mount-to-ready');
      logWatch('lifecycle', 'WatchTab', '✅ READY', {
        shortsCount: shorts.length,
      });
    }
  }, [isLoadingShorts, shorts.length]);

  // Handle grid video tap - open fullscreen at tapped index
  const handleVideoTap = useCallback((video: WatchShort, index: number, allVideos: WatchShort[]) => {
    logWatch('interaction', 'WatchTab', '👆 Grid video tapped', {
      videoId: video.id?.slice(0, 8),
      index,
      totalVideos: allVideos.length,
    });
    
    const playlist = allVideos.map(toFullscreenItem);
    openFullscreen(playlist, index, video.id);
  }, [openFullscreen]);

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
      queryClient.invalidateQueries({ queryKey: ['watch-shorts-base'] }),
      queryClient.invalidateQueries({ queryKey: ['watch-shorts-user-likes'] }),
    ]);
  }, [queryClient]);

  // Full page skeleton when loading initially
  if (isLoadingShorts) {
    return <WatchTabSkeleton />;
  }

  const isSearchActive = debouncedSearch.trim().length > 0;

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
      <div className="flex flex-col min-h-screen" style={{ background: '#F8FAFC' }}>
        {/* Search Bar - matches Videos tab DiscoverCommandCenter styling */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative h-11">
            <div 
              className={cn(
                "absolute inset-0 rounded-xl border transition-all duration-200",
                "bg-white",
                isFocused 
                  ? "border-[#e2e8f0] ring-2 ring-[#e2e8f0]" 
                  : "border-[#e2e8f0]"
              )}
            />
            <div className="relative h-full flex items-center">
              <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
                <Search 
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isFocused ? "text-[#1e293b]" : "text-[#94a3b8]"
                  )} 
                  strokeWidth={2} 
                />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search shorts…"
                className="w-full h-full pl-12 pr-12 text-base text-[#1e293b] placeholder:text-[#94a3b8] rounded-xl bg-transparent font-medium focus:outline-none focus:ring-0"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 inset-y-0 flex items-center p-1.5 hover:bg-[#f1f5f9] rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-[#64748b]" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty search state */}
        {isSearchActive && filteredShorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <VideoOff className="h-10 w-10 text-[#94a3b8] mb-3" strokeWidth={1.5} />
            <p className="text-base font-medium text-[#64748b]">No shorts found</p>
            <p className="text-sm text-[#94a3b8] mt-1">Try a different search term</p>
          </div>
        ) : (
          <>
            {/* Section Label - only show for search results */}
            {isSearchActive && (
              <div className="mb-3 px-4">
                <span className="text-base font-semibold" style={{ color: '#374151' }}>
                  {`Results for "${debouncedSearch}"`}
                </span>
              </div>
            )}

            {/* Shorts Grid */}
            <WatchShortsGrid
              shorts={filteredShorts}
              likedPostIds={likedPostIds}
              isLoading={isLoadingShorts}
              isError={isGridError}
              onRetry={handleRetry}
              onVideoTap={handleVideoTap}
              onLoadMore={handleLoadMore}
              hasMore={isSearchActive ? false : hasNextPage}
              isLoadingMore={isFetchingNextPage}
              showSuggestedStrip={!isSearchActive}
            />
          </>
        )}
      </div>
    </PullToRefreshContainer>
  );
}

export default WatchTab;
