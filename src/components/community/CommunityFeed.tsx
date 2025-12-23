import React, { useEffect, useRef, useCallback, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCommunityFeed, CommunityMediaFilter, CommunitySortOption } from '@/hooks/community/useCommunityFeed';
import CommunityFeedCard from './CommunityFeedCard';
import CommunityEmptyState from './CommunityEmptyState';
import { DateSeparator } from './DateSeparator';
import { useMediaAutoplay } from '@/media';
import { calculateDateSeparators } from '@/utils/dateSeparators';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';

interface CommunityFeedProps {
  onMediaClick: (item: any) => void;
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
 * With unified command center (Search + Sort + Pills)
 */
export default function CommunityFeed({ onMediaClick }: CommunityFeedProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Persist filter/sort in localStorage
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
    items,
    loading,
    hasMore,
    communityCount,
    loadMore,
  } = useCommunityFeed({ mediaFilter, sortOption });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasPreloadedFirst = useRef(false);

  // CRITICAL: Preload first video immediately in layout phase (before paint)
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current) return;
    if (!items.length) return;

    const firstVideo = items.find(item => item.type === 'video');
    if (!firstVideo || !firstVideo.src) return;

    hasPreloadedFirst.current = true;

    const uid = uidFromNode({ src: firstVideo.src });
    if (uid) {
      const hlsUrl = `https://videodelivery.net/${uid}/manifest/video.m3u8`;
      if (import.meta.env.DEV) {
        console.log(`[${performance.now().toFixed(2)}ms] [CommunityFeed] LAYOUT_EFFECT_PRELOAD`, { 
          id: firstVideo.id.slice(0, 8) 
        });
      }
      preloadHlsManifest(hlsUrl);
    }
  }, [items]);

  // Unified media autoplay with consistent thresholds
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    preloadMargin: 300,
    scrollSettleDelay: 200,
    startThreshold: 0.4,   // Play at 40% visible
    stopThreshold: 0.35,   // Pause at 35% visible (provides hysteresis)
  });

  // Calculate date separators
  const dateSeparators = React.useMemo(() => {
    return calculateDateSeparators(items);
  }, [items]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.3 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => { if (sentinel) observer.unobserve(sentinel); };
  }, [hasMore, loading, loadMore]);

  const handleVideoClick = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      if (item.type === 'video') {
        navigate(`/video/${id}`, {
          state: { backgroundLocation: location, fromVideo: true }
        });
      } else {
        onMediaClick(item);
      }
    }
  }, [items, navigate, location, onMediaClick]);

  const handleCreatorClick = useCallback((creatorUserId: string) => {
    navigate(`/golfer/${creatorUserId}`);
  }, [navigate]);

  // Helper to clear filter
  const handleClearFilter = useCallback(() => {
    setMediaFilter('all');
    localStorage.setItem(FILTER_KEY, 'all');
  }, []);

  // Empty state: User has no community (no friends/follows)
  if (!loading && communityCount.friends === 0 && communityCount.following === 0) {
    return (
      <div className="min-h-screen pb-20 bg-[var(--bg-page)]">
        {/* Sticky Command Center */}
        <div className="sticky top-0 z-30 bg-[var(--bg-page)]">
          <DiscoverCommandCenter
            searchPlaceholder="Search posts..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            sortValue={commandCenterSort}
            onSortChange={handleSortChange}
            pills={pills}
            onPillSelect={handleFilterChange}
          />
        </div>
        <CommunityEmptyState variant="no-community" />
      </div>
    );
  }

  // Has community but no posts
  if (!loading && items.length === 0 && (communityCount.friends > 0 || communityCount.following > 0)) {
    // Check if this is due to a filter
    const isFilteredEmpty = mediaFilter !== 'all';
    
    return (
      <div className="min-h-screen pb-20 bg-[var(--bg-page)]">
        {/* Sticky Command Center */}
        <div className="sticky top-0 z-30 bg-[var(--bg-page)]">
          <DiscoverCommandCenter
            searchPlaceholder="Search posts..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            sortValue={commandCenterSort}
            onSortChange={handleSortChange}
            pills={pills}
            onPillSelect={handleFilterChange}
          />
        </div>
        {isFilteredEmpty ? (
          <CommunityEmptyState variant="no-results" onClearFilter={handleClearFilter} />
        ) : (
          <CommunityEmptyState variant="quiet" />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[var(--bg-page)]">
      {/* Sticky Command Center: Search + Sort + Pills + Subtitle */}
      <div className="sticky top-0 z-30 bg-[var(--bg-page)]">
        <DiscoverCommandCenter
          searchPlaceholder="Search posts..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          sortValue={commandCenterSort}
          onSortChange={handleSortChange}
          pills={pills}
          onPillSelect={handleFilterChange}
        />
        {/* Subtitle - tighter spacing: 8px below pills, styled as secondary subheader */}
        <div className="px-4 -mt-2 pb-3">
          <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide truncate">
            Posts from people you follow and play with
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="pt-1">
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {/* Date Separator */}
            {dateSeparators.has(index) && (
              <DateSeparator bucket={dateSeparators.get(index)!} />
            )}
            
            <CommunityFeedCard
              item={item}
              onVideoClick={handleVideoClick}
              onCreatorClick={handleCreatorClick}
              registerVideo={registerMedia}
              isPlaying={playingIds.has(item.id)}
              videoIndex={index}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Loading state */}
      {loading && items.length === 0 && (
        <div className="py-12 px-5">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-card border border-border/30 overflow-hidden">
                <div className="aspect-[16/9] bg-muted" />
                <div className="px-4 py-3">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/3 bg-muted rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4">
        {loading && hasMore && items.length > 0 && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* End of feed */}
      {!hasMore && items.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}
    </div>
  );
}
