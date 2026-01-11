import React, { useEffect, useRef, useCallback, useState, useLayoutEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCommunityFeed, CommunityMediaFilter, CommunitySortOption, CommunityContentItem } from '@/hooks/community/useCommunityFeed';
import CommunityFeedCard from './CommunityFeedCard';
import CommunityEmptyState from './CommunityEmptyState';
import { DateSeparator } from './DateSeparator';
import { useMediaAutoplay } from '@/media';
import { calculateDateSeparators } from '@/utils/dateSeparators';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { CategoryPills } from '@/components/shared/CategoryPills';
import { MOMENT_CATEGORIES } from '@/components/post/create-moment/categoryDefinitions';

interface CommunityFeedProps {
  onMediaClick: (item: any) => void;
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
  const location = useLocation();
  
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

  // Calculate date separators
  const dateSeparators = React.useMemo(() => {
    return calculateDateSeparators(items);
  }, [items]);

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
    setSelectedCategory('all');
    localStorage.setItem(CATEGORY_KEY, 'all');
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
      {/* Sticky Command Center: Search + Sort + Pills + Category Pills + Subtitle */}
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
        {/* Category Pills */}
        <div className="px-4 pb-2">
          <CategoryPills
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            showIcons={true}
          />
        </div>
        {/* Subtitle - tighter spacing: 8px below pills, styled as secondary subheader */}
        <div className="px-4 -mt-1 pb-3">
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

      {/* Loading state - full bleed, dynamic heights, square corners */}
      {loading && items.length === 0 && (
        <div className="w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full mb-4 animate-pulse">
              {/* Media skeleton - vary heights for visual interest */}
              <div 
                className="w-full bg-muted"
                style={{ aspectRatio: i % 2 === 0 ? 16/9 : 4/5 }}
              />
              {/* Meta area skeleton */}
              <div className="px-4 py-3 flex items-start gap-3">
                {/* Avatar squircle */}
                <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0" />
                {/* Text lines */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted/60 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel - no spinner, seamless loading like Watch tab */}
      <div ref={sentinelRef} className="h-20 w-full" />

      {/* End of feed */}
      {!hasMore && items.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}
    </div>
  );
}
