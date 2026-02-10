import React, { useEffect, useRef, useCallback, useState, useLayoutEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunityFeed, CommunityMediaFilter, CommunitySortOption, CommunityContentItem } from '@/hooks/community/useCommunityFeed';
import CommunityFeedCard from './CommunityFeedCard';
import CommunityFeedCardSkeleton from './CommunityFeedCardSkeleton';
import CommunityEmptyState from './CommunityEmptyState';
import { useMediaAutoplay } from '@/media';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { AlertCircle, CheckCircle2, ChevronUp } from 'lucide-react';

interface CommunityFeedProps {
  onMediaClick?: (item: any) => void;
}

// Local storage keys
const FILTER_KEY = 'community-media-filter';
const SORT_KEY = 'community-sort-option';

const COMMUNITY_PILLS: { id: CommunityMediaFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'videos', label: 'Videos' },
  { id: 'photos', label: 'Photos' },
];

/**
 * CommunityFeed - Posts from friends and followed users only
 * TikTok-Level Implementation:
 * - Adaptive prefetch (3-20 ahead) based on network/battery/scroll
 * - 50% start / 10% stop autoplay hysteresis
 * - Scroll velocity tracking via EWMA
 * - Priority manifest preloading
 */
export default function CommunityFeed({ onMediaClick }: CommunityFeedProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Scroll-to-top
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Persist filter/sort/category in localStorage
  const [mediaFilter, setMediaFilter] = useState<CommunityMediaFilter>(() => {
    const saved = localStorage.getItem(FILTER_KEY);
    return (saved as CommunityMediaFilter) || 'all';
  });
  
  const [sortOption, setSortOption] = useState<CommunitySortOption>(() => {
    const saved = localStorage.getItem(SORT_KEY);
    return (saved as CommunitySortOption) || 'newest';
  });

  const handleFilterChange = useCallback((key: string) => {
    const filter = key as CommunityMediaFilter;
    setMediaFilter(filter);
    localStorage.setItem(FILTER_KEY, filter);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    const communitySortMap: Record<SortOption, CommunitySortOption> = {
      'newest': 'newest',
      'most-liked': 'most-liked',
      'most-discussed': 'most-discussed',
      'friends-first': 'friends-first',
    };
    const mappedSort = communitySortMap[sort];
    setSortOption(mappedSort);
    localStorage.setItem(SORT_KEY, mappedSort);
  }, []);

  // Build pills for command center
  const pills: Pill[] = COMMUNITY_PILLS.map(p => ({
    key: p.id,
    label: p.label,
    selected: mediaFilter === p.id,
  }));

  // Map community sort to command center sort
  const commandCenterSort: SortOption = sortOption as SortOption;

  const {
    items: rawItems,
    loading,
    hasMore,
    error,
    communityCount,
    loadMore,
    reset,
  } = useCommunityFeed({ mediaFilter, sortOption });

  // Apply client-side search filter with debounce
  const items = useMemo(() => {
    let filtered = rawItems;
    
    // Apply search filter using debounced value
    if (debouncedSearch && debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      
      filtered = filtered.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const captionMatch = ((item as any).caption || '').toLowerCase().includes(query);
        const descriptionMatch = ((item as any).description || '').toLowerCase().includes(query);
        const userNameMatch = (item.user?.name || '').toLowerCase().includes(query);
        const userUsernameMatch = (item.user?.username || '').toLowerCase().includes(query);
        const creatorNameMatch = ((item as any).creator?.name || '').toLowerCase().includes(query);
        const creatorUsernameMatch = ((item as any).creator?.username || '').toLowerCase().includes(query);
        const businessMatch = ((item as any).business?.name || '').toLowerCase().includes(query);
        const courseMatch = ((item as any).golfCourse?.name || '').toLowerCase().includes(query);
        const golfCourseMatch = ((item as any).golf_course?.name || '').toLowerCase().includes(query);
        
        return titleMatch || captionMatch || descriptionMatch || 
               userNameMatch || userUsernameMatch || 
               creatorNameMatch || creatorUsernameMatch || 
               businessMatch || courseMatch || golfCourseMatch;
      });
    }
    
    return filtered;
  }, [rawItems, debouncedSearch]);

  // ============ TikTok-Level: Adaptive Prefetch (3-20 ahead based on conditions) ============
  const { config: prefetchConfig, onIndexChange } = useAdaptivePrefetch();
  const lastPrefetchedIndex = useRef(-1);

  // Track current scroll position for prefetch window
  const [currentIndex, setCurrentIndex] = useState(0);

  // Create videoUrlMap for HLS prefetching
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach(item => {
      const mediaUrl = item.src;
      const isVideo = item.type === 'video';
      if (item.id && mediaUrl && isVideo) {
        const streamId = uidFromNode({ src: mediaUrl });
        if (streamId) {
          map.set(item.id, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [items]);

  const videoIds = useMemo(() => 
    items.filter(p => p.type === 'video').map(p => p.id), 
    [items]
  );

  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasPreloadedFirst = useRef(false);
  
  // Refs to avoid stale closure in IntersectionObserver callback
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  
  // Keep refs in sync with state
  useEffect(() => {
    hasMoreRef.current = hasMore;
    loadingRef.current = loading;
  }, [hasMore, loading]);

  // TikTok-level: Adaptive prefetch on mount using dynamic window
  useEffect(() => {
    if (items.length === 0 || !prefetchConfig.preloadManifests) return;
    
    const videoMoments = items
      .slice(0, Math.min(prefetchConfig.prefetchAhead, items.length))
      .filter(m => m.type === 'video' && m.src);
    
    videoMoments.forEach((item) => {
      const uid = uidFromNode({ src: item.src! });
      if (uid) {
        const hlsUrl = generateStreamHlsUrl(uid);
        preloadHlsManifest(hlsUrl);
      }
    });
    
    lastPrefetchedIndex.current = Math.min(prefetchConfig.prefetchAhead - 1, items.length - 1);
  }, [items, prefetchConfig.prefetchAhead, prefetchConfig.preloadManifests]);

  // CRITICAL: Preload first video immediately in layout phase (before paint)
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current) return;
    if (!items.length) return;

    const firstVideo = items.find(item => item.type === 'video');
    if (!firstVideo || !firstVideo.src) return;

    hasPreloadedFirst.current = true;

    const uid = uidFromNode({ src: firstVideo.src });
    if (uid) {
      const hlsUrl = generateStreamHlsUrl(uid);
      if (import.meta.env.DEV) {
        console.log(`[${performance.now().toFixed(2)}ms] [CommunityFeed] LAYOUT_EFFECT_PRELOAD`, { 
          id: firstVideo.id.slice(0, 8) 
        });
      }
      preloadHlsManifest(hlsUrl);
    }
  }, [items]);

  // P0: Unified media autoplay with TikTok-level thresholds (50% start / 10% stop)
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    preloadMargin: 300,
    scrollSettleDelay: 200,
    startThreshold: 0.5,
    stopThreshold: 0.1,
  });

  // Unified fullscreen player for Community content
  const { openFullscreen } = useUnifiedFullscreen('explore', {
    allowLandscape: true,
    onLoadMore: loadMore,
    hasMore,
    isLoadingMore: loading,
  });

  // Paced loading state (Watch tab standard)
  const MIN_LOADING_DISPLAY_MS = 600;
  const loadStartTimeRef = useRef<number>(0);
  const [isPacingDelay, setIsPacingDelay] = useState(false);
  const prevItemsCountRef = useRef(items.length);
  const [newlyLoadedStartIndex, setNewlyLoadedStartIndex] = useState<number | null>(null);
  const loadingMoreRef = useRef(false);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          loadStartTimeRef.current = Date.now();
          loadMore();
          setTimeout(() => { loadingMoreRef.current = false; }, 1000);
        }
      },
      { root: null, rootMargin: '0px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Handle paced loading when new items arrive
  useEffect(() => {
    const prevCount = prevItemsCountRef.current;
    const newCount = items.length;
    
    if (newCount > prevCount && loadStartTimeRef.current > 0) {
      const elapsed = Date.now() - loadStartTimeRef.current;
      const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed);
      
      if (remaining > 0) {
        setIsPacingDelay(true);
        const timer = setTimeout(() => {
          setNewlyLoadedStartIndex(prevCount);
          setIsPacingDelay(false);
          loadStartTimeRef.current = 0;
          setTimeout(() => setNewlyLoadedStartIndex(null), 500);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setNewlyLoadedStartIndex(prevCount);
        loadStartTimeRef.current = 0;
        setTimeout(() => setNewlyLoadedStartIndex(null), 500);
      }
    }
    
    prevItemsCountRef.current = newCount;
  }, [items.length]);

  // Show loading indicator
  const showBottomLoader = loading || isPacingDelay;

  // Track scroll position for prefetch window with scroll velocity tracking
  useEffect(() => {
    const cards = document.querySelectorAll('[data-community-card-id]');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute('data-community-card-id');
            const index = items.findIndex(p => p.id === postId);
            if (index !== -1 && index !== currentIndex) {
              setCurrentIndex(index);
              onIndexChange();
              
              if (prefetchConfig.preloadManifests && index > lastPrefetchedIndex.current - 3) {
                const prefetchStart = lastPrefetchedIndex.current + 1;
                const prefetchEnd = Math.min(prefetchStart + prefetchConfig.prefetchAhead, items.length);
                
                for (let i = prefetchStart; i < prefetchEnd; i++) {
                  const item = items[i];
                  if (item?.type === 'video' && item.src) {
                    const uid = uidFromNode({ src: item.src });
                    if (uid) {
                      preloadHlsManifest(generateStreamHlsUrl(uid));
                    }
                  }
                }
                
                lastPrefetchedIndex.current = prefetchEnd - 1;
              }
            }
          }
        });
      },
      { root: null, rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [items, currentIndex, onIndexChange, prefetchConfig]);

  // Scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fullscreen click handler
  const handleCardClick = useCallback((id: string, index: number) => {
    openFullscreen(items, index);
  }, [items, openFullscreen]);

  const handleCreatorClick = useCallback((creatorUserId: string) => {
    navigate(`/golfer/${creatorUserId}`);
  }, [navigate]);

  // Helper to clear filter
  const handleClearFilter = useCallback(() => {
    setMediaFilter('all');
    localStorage.setItem(FILTER_KEY, 'all');
  }, []);

  // Pull-to-refresh handler
  const handlePullToRefresh = useCallback(async () => {
    reset();
  }, [reset]);

  // Command center block (shared across all states)
  const commandCenterBlock = (
    <div style={{ background: '#F8FAFC' }}>
      <DiscoverCommandCenter
        searchPlaceholder="Search posts..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        sortValue={commandCenterSort}
        onSortChange={handleSortChange}
        pills={pills}
        onPillSelect={handleFilterChange}
      />
      {/* Section subtitle — Polish 1 */}
      <div className="px-4 pt-2 pb-3">
        <p className="text-xs font-medium text-gray-400">
          Posts from people you follow
        </p>
      </div>
    </div>
  );

  // Fix 5: Error state
  if (error && !loading && items.length === 0) {
    return (
      <PullToRefreshContainer onRefresh={handlePullToRefresh}>
        <div className="min-h-screen pb-20" style={{ background: '#F8FAFC' }}>
          {commandCenterBlock}
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-600 mb-1">Something went wrong</h3>
            <p className="text-sm text-gray-400 text-center mb-6">We couldn't load your feed. Please try again.</p>
            <button
              onClick={() => reset()}
              className="rounded-full bg-emerald-600 text-white text-sm font-medium px-6 py-2.5 active:scale-[0.97] transition-transform"
            >
              Try again
            </button>
          </div>
        </div>
      </PullToRefreshContainer>
    );
  }

  // Empty state: User has no community (no friends/follows)
  if (!loading && communityCount.friends === 0 && communityCount.following === 0) {
    return (
      <PullToRefreshContainer onRefresh={handlePullToRefresh}>
        <div className="min-h-screen pb-20" style={{ background: '#F8FAFC' }}>
          {commandCenterBlock}
          <CommunityEmptyState variant="no-community" />
        </div>
      </PullToRefreshContainer>
    );
  }

  // Has community but no posts (or search returned no results)
  if (!loading && items.length === 0 && (communityCount.friends > 0 || communityCount.following > 0)) {
    const isSearchEmpty = debouncedSearch && debouncedSearch.trim().length > 0;
    const isFilteredEmpty = mediaFilter !== 'all';
    
    return (
      <PullToRefreshContainer onRefresh={handlePullToRefresh}>
        <div className="min-h-screen pb-20" style={{ background: '#F8FAFC' }}>
          {commandCenterBlock}
          {isSearchEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <p className="text-sm text-gray-400 text-center">
                No posts found for "{debouncedSearch}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-sm text-emerald-600 font-medium hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : isFilteredEmpty ? (
            <CommunityEmptyState variant="no-results" onClearFilter={handleClearFilter} />
          ) : (
            <CommunityEmptyState variant="quiet" />
          )}
        </div>
      </PullToRefreshContainer>
    );
  }

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
      <div className="min-h-screen pb-20" style={{ background: '#F8FAFC' }}>
        {/* Command Center */}
        {commandCenterBlock}

        {/* Feed - Single column layout with premium card spacing */}
        <div className="flex flex-col gap-4 py-2">
          {items.map((item, index) => {
            const isNewlyLoaded = newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex;
            const entranceDelay = isNewlyLoaded ? (index - newlyLoadedStartIndex) * 30 : 0;
            
            return (
              <div 
                key={item.id} 
                data-community-card-id={item.id}
                className={isNewlyLoaded 
                  ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:fill-mode-backwards' 
                  : undefined
                }
                style={isNewlyLoaded ? { animationDelay: `${entranceDelay}ms` } : undefined}
              >
                <CommunityFeedCard
                  item={item}
                  onCardClick={handleCardClick}
                  onCreatorClick={handleCreatorClick}
                  registerVideo={registerMedia}
                  isPlaying={playingIds.has(item.id)}
                  videoIndex={index}
                  isPriorityItem={index < 6}
                />
              </div>
            );
          })}
        </div>

        {/* Loading state */}
        {loading && items.length === 0 && (
          <div className="flex flex-col gap-4 py-2">
            {[1, 2, 3].map((i) => (
              <CommunityFeedCardSkeleton key={i} index={i - 1} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {/* Orange brand spinner for paced infinite scroll */}
        {showBottomLoader && items.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* End of feed — Polish 9 */}
        {!hasMore && items.length > 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-xs text-gray-400 font-medium text-center">
              You're all caught up
            </p>
          </div>
        )}

        {/* Scroll-to-top FAB */}
        {showScrollTop && (
          <button
            onClick={handleScrollToTop}
            className="fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 animate-in fade-in zoom-in-90"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
    </PullToRefreshContainer>
  );
}
