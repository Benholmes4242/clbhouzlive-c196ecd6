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
import { CategoryPills } from '@/components/shared/CategoryPills';
import { MOMENT_CATEGORIES } from '@/components/post/create-moment/categoryDefinitions';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';

interface CommunityFeedProps {
  onMediaClick?: (item: any) => void; // Optional now - we handle fullscreen internally
}

// Local storage keys
const FILTER_KEY = 'community-media-filter';
const SORT_KEY = 'community-sort-option';
const CATEGORY_KEY = 'community-category-filter';

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
  
  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Persist filter/sort/category in localStorage
  const [mediaFilter, setMediaFilter] = useState<CommunityMediaFilter>(() => {
    const saved = localStorage.getItem(FILTER_KEY);
    return (saved as CommunityMediaFilter) || 'all';
  });
  
  const [sortOption, setSortOption] = useState<CommunitySortOption>(() => {
    const saved = localStorage.getItem(SORT_KEY);
    return (saved as CommunitySortOption) || 'newest';
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const saved = localStorage.getItem(CATEGORY_KEY);
    return saved || 'all';
  });

  const handleFilterChange = useCallback((key: string) => {
    const filter = key as CommunityMediaFilter;
    setMediaFilter(filter);
    localStorage.setItem(FILTER_KEY, filter);
  }, []);
  
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    localStorage.setItem(CATEGORY_KEY, category);
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
    communityCount,
    loadMore,
  } = useCommunityFeed({ mediaFilter, sortOption });

  // Apply client-side search + category filter (comprehensive - matches Watch page implementation)
  const items = useMemo(() => {
    let filtered = rawItems;
    
    // Apply category filter first
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        // Check structured categories array (from Create Moment)
        const itemCategories = (item as any).categories;
        if (itemCategories && Array.isArray(itemCategories) && itemCategories.length > 0) {
          return itemCategories.some((cat: string) => 
            cat.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
        return false;
      });
    }
    
    // Then apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      // Find matching category IDs from search query (for category label matching)
      const matchingCategoryIds = MOMENT_CATEGORIES
        .filter(cat => cat.label.toLowerCase().includes(query))
        .map(cat => cat.id);
      
      filtered = filtered.filter(item => {
        // Post content fields
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const captionMatch = ((item as any).caption || '').toLowerCase().includes(query);
        const descriptionMatch = ((item as any).description || '').toLowerCase().includes(query);
        
        // User fields (legacy structure)
        const userNameMatch = (item.user?.name || '').toLowerCase().includes(query);
        const userUsernameMatch = (item.user?.username || '').toLowerCase().includes(query);
        
        // Creator fields (polymorphic - new structure)
        const creatorNameMatch = ((item as any).creator?.name || '').toLowerCase().includes(query);
        const creatorUsernameMatch = ((item as any).creator?.username || '').toLowerCase().includes(query);
        
        // Business profile name
        const businessMatch = ((item as any).business?.name || '').toLowerCase().includes(query);
        
        // Golf course name (both camelCase and snake_case)
        const courseMatch = ((item as any).golfCourse?.name || '').toLowerCase().includes(query);
        const golfCourseMatch = ((item as any).golf_course?.name || '').toLowerCase().includes(query);
        
        // Category label matching - search "Golf Trip" finds posts tagged with golf-trip
        const categoryLabelMatch = matchingCategoryIds.length > 0 && 
          (item as any).categories?.some((cat: string) => matchingCategoryIds.includes(cat));
        
        return titleMatch || captionMatch || descriptionMatch || 
               userNameMatch || userUsernameMatch || 
               creatorNameMatch || creatorUsernameMatch || 
               businessMatch || courseMatch || golfCourseMatch ||
               categoryLabelMatch;
      });
    }
    
    return filtered;
  }, [rawItems, searchQuery, selectedCategory]);

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

  // Unified media autoplay with consistent thresholds (matches Videos tab)
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    preloadMargin: 300,
    scrollSettleDelay: 200,
    startThreshold: 0.4,   // Play at 40% visible
    stopThreshold: 0.25,   // Pause at 25% visible - consistent with Videos tab
  });

  // Unified fullscreen player for Community content
  const { openFullscreen } = useUnifiedFullscreen('explore', {
    allowLandscape: true,
    onLoadMore: loadMore,
    hasMore,
    isLoadingMore: loading,
  });

  // Infinite scroll observer - uses refs to avoid stale closure
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          loadMore();
        }
      },
      { 
        root: null,
        rootMargin: '400px 0px', // Trigger 400px BEFORE reaching bottom
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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
    setSelectedCategory('all');
    localStorage.setItem(CATEGORY_KEY, 'all');
  }, []);

  // Empty state: User has no community (no friends/follows)
  if (!loading && communityCount.friends === 0 && communityCount.following === 0) {
    return (
      <div className="min-h-screen pb-20 bg-[var(--bg-page)]">
        {/* Command Center */}
        <div className="bg-[var(--bg-page)]">
          <DiscoverCommandCenter
            searchPlaceholder="Search posts..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            sortValue={commandCenterSort}
            onSortChange={handleSortChange}
            pills={pills}
            onPillSelect={handleFilterChange}
          />
          {/* Category Pills */}
          <div className="px-4 pb-2">
            <CategoryPills
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              showIcons={true}
            />
          </div>
        </div>
        <CommunityEmptyState variant="no-community" />
      </div>
    );
  }

  // Has community but no posts (or search returned no results)
  if (!loading && items.length === 0 && (communityCount.friends > 0 || communityCount.following > 0)) {
    // Check if this is due to search or filter
    const isSearchEmpty = searchQuery && searchQuery.trim().length > 0;
    const isFilteredEmpty = mediaFilter !== 'all' || selectedCategory !== 'all';
    
    return (
      <div className="min-h-screen pb-20 bg-[var(--bg-page)]">
        {/* Command Center */}
        <div className="bg-[var(--bg-page)]">
          <DiscoverCommandCenter
            searchPlaceholder="Search posts..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            sortValue={commandCenterSort}
            onSortChange={handleSortChange}
            pills={pills}
            onPillSelect={handleFilterChange}
          />
          {/* Category Pills */}
          <div className="px-4 pb-2">
            <CategoryPills
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              showIcons={true}
            />
          </div>
        </div>
        {isSearchEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <p className="text-muted-foreground text-center">
              No posts found for "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-sm text-primary hover:underline"
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
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[var(--bg-page)]">
      {/* Command Center: Search + Sort + Pills + Category Pills + Subtitle */}
      <div className="bg-[var(--bg-page)]">
        <DiscoverCommandCenter
          searchPlaceholder="Search posts..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          sortValue={commandCenterSort}
          onSortChange={handleSortChange}
          pills={pills}
          onPillSelect={handleFilterChange}
        />
        {/* Category Pills */}
        <div className="px-4 pb-2">
          <CategoryPills
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            showIcons={true}
          />
        </div>
        {/* Subtitle - moved down with more spacing */}
        <div className="px-4 mt-1 pb-3">
          <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide truncate">
            Posts from people you follow and play with
          </p>
        </div>
      </div>

      {/* Feed - Single column layout with CommunityFeedCard */}
      <div className="flex flex-col gap-3 py-3">
        {items.map((item, index) => (
          <CommunityFeedCard
            key={item.id}
            item={item}
            onCardClick={handleCardClick}
            onCreatorClick={handleCreatorClick}
            registerVideo={registerMedia}
            isPlaying={playingIds.has(item.id)}
            videoIndex={index}
          />
        ))}
      </div>

      {/* Loading state */}
      {loading && items.length === 0 && (
        <div className="flex flex-col gap-3 py-3">
          {[1, 2, 3].map((i) => (
            <CommunityFeedCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel - no spinner, seamless loading like Watch tab */}
      <div ref={sentinelRef} className="h-20 w-full" />

      {/* End of feed - polished "All caught up" state */}
      {!hasMore && items.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            You're all caught up
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Check back later for new posts from your community
          </p>
        </div>
      )}
    </div>
  );
}
