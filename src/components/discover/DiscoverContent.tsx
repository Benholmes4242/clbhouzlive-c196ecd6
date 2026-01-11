import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import ExploreGrid from '@/components/explore/ExploreGrid';
import VideosGrid from '@/components/discover/VideosGrid';
import PhotosGrid from '@/components/discover/PhotosGrid';
import WatchGridV2 from '@/components/discover/WatchGridV2';
import SlidingPanels from '@/components/ui/SlidingPanels';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { FILTER_TYPES } from '@/components/explore/types';
import type { ExploreContentItem } from '@/components/explore/types';
import CreatorHighlightShelf from '@/components/discover/CreatorHighlightShelf';
import CreatorHighlightTile from '@/components/discover/CreatorHighlightTile';
import { CreatorHighlight } from '@/hooks/useCreatorHighlights';
import { LiveClubhouseStrip } from '@/components/shorts/LiveClubhouseStrip';
import { getDurationFilter } from '@/constants/videoFilters';
import type { LengthKey } from '@/components/videos/VideoChipRail';
import { useChannelSuggestions } from '@/hooks/useChannelSuggestions';
import { useShortsSuggestions } from '@/hooks/useShortsSuggestions';
import { buildInterleavedFeed, InterleavedItem } from '@/utils/interleaveFeed';
import { toast } from 'sonner';
import DiscoverHero, { createHeroItem } from '@/components/discover/DiscoverHero';
import { DiscoverCommandCenter, SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { MOMENT_CATEGORIES } from '@/components/post/create-moment/categoryDefinitions';
import { useHeroPreload } from '@/hooks/useHeroPreload';
// Wrapper to avoid useMemo inside render callback (fixes setState during render warning)
function VideosGridWrapper({
  durationKey,
  currentContent,
  getNextShort,
  getNextChannel,
  recentHistory,
  shortsContentLength,
  onMediaClick,
  isLoading,
  hasMore,
  onLoadMore,
  duration,
}: {
  durationKey: LengthKey;
  currentContent: ExploreContentItem[] | null;
  getNextShort: () => ExploreContentItem | null;
  getNextChannel: () => any | null;
  recentHistory: Set<string>;
  shortsContentLength: number;
  onMediaClick: (item: any) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  duration: string;
}) {
  const itemsForKey = currentContent || [];
  
  // Build interleaved feed for "All" tab only - now in a proper component
  const interleavedFeed = React.useMemo(() => {
    if (durationKey !== 'all') return null;
    
    const feed = buildInterleavedFeed(
      itemsForKey,
      getNextShort,
      getNextChannel,
      0,
      recentHistory
    );
    
    if (import.meta.env.DEV) {
      const shortsBlocks = feed.filter(i => i.kind === 'shorts_block').length;
      const channelSuggs = feed.filter(i => i.kind === 'channel_suggestion').length;
      console.debug('[Interleave]', {
        totalVideos: itemsForKey.length,
        shortsBlocks,
        channelSuggs,
        totalItems: feed.length,
        sampleKinds: feed.slice(0, 20).map(i => i.kind)
      });
    }
    
    return feed;
  }, [durationKey, itemsForKey.length, shortsContentLength]);

  return (
    <VideosGrid
      content={itemsForKey}
      onMediaClick={onMediaClick}
      isLoading={isLoading}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      isShorts={false}
      activeTab={duration}
      interleavedFeed={durationKey === 'all' ? interleavedFeed : undefined}
    />
  );
}

interface DiscoverContentProps {
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick: (item: any, index?: number) => void;
  searchQuery?: string;
  selectedTags?: string[];
}

// Map main pill to filter types for API calls
function getFilterTypeFromPills(main: string): string {
  // Map main pill to base filter type
  const mainToFilter: Record<string, string> = {
    'shorts': FILTER_TYPES.VIDEOS,
    'videos': FILTER_TYPES.VIDEOS,
    'channels': FILTER_TYPES.CHANNELS,
    'following': FILTER_TYPES.FOLLOWING,
    'friends': FILTER_TYPES.FOLLOWING, // Back-compat
    'verified-pros': FILTER_TYPES.VERIFIED_PROS,
    'hack-shack': FILTER_TYPES.HACK_SHACK,
  };
  
  return mainToFilter[main] || FILTER_TYPES.VIDEOS;
}


// Apply tag filtering to content using posts.categories array
function applyTagFilter(content: ExploreContentItem[], selectedTags: string[]): ExploreContentItem[] {
  if (!selectedTags.length) return content;
  
  return content.filter(item => {
    // Primary: Check structured categories array (from Create Moment)
    if (item.categories && item.categories.length > 0) {
      return selectedTags.some(tag => 
        item.categories!.some(cat => 
          cat.toLowerCase() === tag.toLowerCase()
        )
      );
    }
    
    // Fallback: Text search for legacy posts without categories
    const title = item.title?.toLowerCase() || '';
    const description = item.ctaDescription?.toLowerCase() || '';
    
    return selectedTags.some(tag => 
      title.includes(tag.toLowerCase()) || 
      description.includes(tag.toLowerCase())
    );
  });
}

// Shorts filter pills - dynamically built from discover-enabled categories (excluding 'other')
// Uses Lucide icons instead of emojis for consistency with Videos and Community pages
import { getDiscoverCategories } from '@/components/post/create-moment/categoryDefinitions';

const SHORTS_PILLS = [
  { key: 'all', label: 'All', icon: undefined as React.ComponentType<{ className?: string }> | undefined },
  ...getDiscoverCategories().map((cat) => ({
    key: cat.id,
    label: cat.label,
    icon: cat.icon,
  })),
];

export default function DiscoverContent({ onLike, onFollow, onMediaClick, searchQuery: externalSearchQuery, selectedTags = [] }: DiscoverContentProps) {
  const navigate = useNavigate();
  const { main, sub, duration } = useDiscoverQuery();
  const [currentContent, setCurrentContent] = useState<ExploreContentItem[] | null>(null);
  const [recentHistory, setRecentHistory] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  
  // Watch tab local state for command center
  const [watchSearchQuery, setWatchSearchQuery] = useState('');
  const [watchSortOption, setWatchSortOption] = useState<SortOption>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('watch-sort') as SortOption) || 'newest';
    }
    return 'newest';
  });
  const [watchActiveFilter, setWatchActiveFilter] = useState('all');
  
  // Persist sort preference
  useEffect(() => {
    localStorage.setItem('watch-sort', watchSortOption);
  }, [watchSortOption]);
  
  // Use external search query if provided, otherwise use local
  const searchQuery = externalSearchQuery || watchSearchQuery;
  
  // Convert pills to DiscoverCommandCenter format with Lucide icons
  const watchPills: Pill[] = SHORTS_PILLS.map((pill) => {
    const IconComponent = pill.icon;
    return {
      key: pill.key,
      label: pill.label,
      selected: watchActiveFilter === pill.key,
      icon: IconComponent ? <IconComponent className="h-4 w-4" /> : undefined,
    };
  });
  
  // Fetch real Shorts data for inline blocks (only when on Videos tab)
  const { content: shortsContent, hasMore: hasMoreShorts, loadMore: loadMoreShorts } = useInfiniteExploreContent(
    FILTER_TYPES.VIDEOS,
    undefined,
    getDurationFilter('shorts')
  );
  
  // Suggestions hooks with real data
  const { next: getNextChannel } = useChannelSuggestions();
  const { next: getNextShort } = useShortsSuggestions(shortsContent || [], {
    hasMore: hasMoreShorts,
    prefetch: () => {
      if (hasMoreShorts) {
        // Fire and forget
        loadMoreShorts();
      }
    }
  });
  
  // Detect Shorts mode for compact view
  const isShorts = main === 'shorts' || duration === 'shorts';
  
  // Get the filter type based on main pill
  const filterType = getFilterTypeFromPills(main);
  
  // Prepare duration filter for Videos/Shorts
  const durationFilter = React.useMemo(() => {
    if (main !== 'videos' && main !== 'shorts') return undefined;
    // If main is 'shorts', use shorts filter regardless of duration param
    if (main === 'shorts') return getDurationFilter('shorts');
    return getDurationFilter(duration);
  }, [main, duration]);
  
  // Use existing hook to fetch content with filters and sort
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(filterType, sub, durationFilter, watchSortOption);

  // CRITICAL: Preload hero video manifest as soon as content arrives
  // This eliminates the 2.2s delay where preload only starts when Hero mounts
  useHeroPreload(content);

  // Apply search filtering and tag filtering whenever content changes
  useEffect(() => {
    if (content) {
      let filtered = content;
      
      // Apply search filter if query exists
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.title?.toLowerCase().includes(query) ||
          item.ctaDescription?.toLowerCase().includes(query) ||
          item.user?.name?.toLowerCase().includes(query) ||
          item.user?.username?.toLowerCase().includes(query)
        );
      }

      // Apply tag filter if tags are selected
      if (selectedTags.length > 0) {
        filtered = applyTagFilter(filtered, selectedTags);
      }
      
      // Remove duplicates and enrich with like state
      const unique = filtered.filter((item, index, self) => 
        index === self.findIndex(t => t.src === item.src)
      ).map(item => ({
        ...item,
        isLiked: likedItems[item.id] ?? false
      }));
      
      setCurrentContent(unique);
    } else {
      setCurrentContent(null);
    }
  }, [content, main, searchQuery, selectedTags, likedItems]);

  // Handle like toggle with optimistic updates
  const handleLikeToggle = useCallback((itemId: string) => {
    // For shorts tab, check in content directly since we use gridContent now
    const item = content?.find(i => i.id === itemId) || currentContent?.find(i => i.id === itemId);
    if (!item) return;

    const currentlyLiked = likedItems[itemId] ?? false;
    const newLikedState = !currentlyLiked;

    // Optimistic update
    setLikedItems(prev => ({ ...prev, [itemId]: newLikedState }));
    
    // Also update currentContent for non-shorts tabs
    setCurrentContent(prev => 
      prev?.map(i =>
        i.id === itemId
          ? {
              ...i,
              isLiked: newLikedState,
              likes: newLikedState ? (i.likes ?? 0) + 1 : Math.max(0, (i.likes ?? 0) - 1)
            }
          : i
      ) ?? null
    );

    // Haptics on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Call parent handler if exists
    onLike?.(itemId);

    // TODO: Replace with actual API call
    // Simulate API with timeout for demo
    setTimeout(() => {
      const success = Math.random() > 0.05; // 95% success rate
      
      if (!success) {
        // Rollback on failure
        setLikedItems(prev => ({ ...prev, [itemId]: currentlyLiked }));
        setCurrentContent(prev =>
          prev?.map(i =>
            i.id === itemId
              ? {
                  ...i,
                  isLiked: currentlyLiked,
                  likes: currentlyLiked ? (i.likes ?? 0) + 1 : Math.max(0, (i.likes ?? 0) - 1)
                }
              : i
          ) ?? null
        );
        toast.error('Failed to update like. Please try again.');
      }
    }, 300);
  }, [content, currentContent, likedItems, onLike]);

  // Handle profile navigation
  const handleAuthorClick = useCallback((authorId: string) => {
    if (!authorId) return;
    navigate(`/u/${authorId}`);
  }, [navigate]);


  const handleCreatorClick = (creator: CreatorHighlight) => {
    console.log('Navigate to creator profile:', creator);
    // TODO: Implement navigation to creator profile or highlight detail
  };

  // Reset recent history when tab changes
  useEffect(() => {
    setRecentHistory(new Set());
  }, [main, duration]);

  // Chip order for slide animation
  const CHIP_ORDER = ['all', 'shorts', 'under4', '4to20', 'over20'] as const;

  // Create hero item using 3-TIER FALLBACK algorithm from UNFILTERED content
  // Priority 1: Most liked from last 24h
  // Priority 2: Most liked from last 7 days
  // Priority 3: Most recent landscape video
  // IMPORTANT: Hero is NEVER affected by search/tags - only grid is filtered
  const heroItem = useMemo(() => {
    // Use UNFILTERED content for hero selection
    if (!content || content.length === 0) return null;
    
    const LANDSCAPE_THRESHOLD = 1.25;
    const MIN_DURATION = 1; // Has duration (not 0)
    const MAX_DURATION = 240; // Match Watch grid (<4 min)
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter landscape videos with duration requirements
    const landscapeVideos = content.filter(item => {
      if (item.type !== 'video') return false;
      const aspectRatio = item.aspectRatio || 
        (item.width && item.height && item.height > 0 ? item.width / item.height : 0);
      if (aspectRatio < LANDSCAPE_THRESHOLD && !item.landscapeSuitable) return false;
      const duration = item.durationSeconds || 0;
      if (duration > 0 && (duration < MIN_DURATION || duration > MAX_DURATION)) return false;
      return true;
    });

    if (landscapeVideos.length === 0) {
      // No landscape videos at all - hero section will hide
      return null;
    }

    // Helper to get age in hours
    const getAgeHours = (item: ExploreContentItem) => {
      const createdAt = item.createdAt || (item as any).created_at;
      if (!createdAt) return 24 * 7; // Default to 1 week if no date
      return (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    };

    // PRIORITY 1: Most liked video from last 24 hours
    const todayVideos = landscapeVideos
      .filter(item => {
        const createdAt = item.createdAt || (item as any).created_at;
        if (!createdAt) return false;
        return new Date(createdAt) >= oneDayAgo;
      })
      .filter(item => (item.likes || 0) > 0)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0));

    if (todayVideos.length > 0) {
      const heroVideo = todayVideos[0];
      const ageHours = getAgeHours(heroVideo);
      // Use high score to trigger "TRENDING NOW" label
      return createHeroItem(heroVideo, 300, ageHours);
    }

    // PRIORITY 2: Most liked video from last 7 days
    const weekVideos = landscapeVideos
      .filter(item => {
        const createdAt = item.createdAt || (item as any).created_at;
        if (!createdAt) return false;
        return new Date(createdAt) >= oneWeekAgo;
      })
      .filter(item => (item.likes || 0) > 0)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0));

    if (weekVideos.length > 0) {
      const heroVideo = weekVideos[0];
      const ageHours = getAgeHours(heroVideo);
      // Use medium score for "POPULAR THIS WEEK" label
      return createHeroItem(heroVideo, 250, ageHours);
    }

    // PRIORITY 3: Any landscape video (most recent)
    const mostRecentLandscape = [...landscapeVideos]
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || (a as any).created_at || 0).getTime();
        const bDate = new Date(b.createdAt || (b as any).created_at || 0).getTime();
        return bDate - aDate;
      })[0];

    if (mostRecentLandscape) {
      const ageHours = getAgeHours(mostRecentLandscape);
      // Use low score for "FEATURED" or generic label
      return createHeroItem(mostRecentLandscape, 50, ageHours);
    }

    return null;
  }, [content]); // Uses UNFILTERED content - hero never changes with search/tags

  // Grid content: Start with unfiltered content, remove hero, THEN apply search/tag filters
  // This ensures hero stays constant while grid responds to filters
  const gridContent = useMemo(() => {
    if (!content || content.length === 0) return [];

    // STEP 1: Start with all content
    let filtered = [...content];

    // STEP 2: Remove hero item first (before filtering)
    if (heroItem) {
      filtered = filtered.filter(item => item.id !== heroItem.id);
    }

    // STEP 3: Apply search filter (with category label matching)
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      // Find matching category IDs from search query (for category label matching)
      const matchingCategoryIds = MOMENT_CATEGORIES
        .filter(cat => cat.label.toLowerCase().includes(query))
        .map(cat => cat.id);
      
      filtered = filtered.filter(item => {
        // Video/post title and description fields
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const descMatch = (item.ctaDescription || '').toLowerCase().includes(query);
        
        // User/creator fields (polymorphic - check both legacy user and new creator)
        const userNameMatch = (item.user?.name || '').toLowerCase().includes(query);
        const userUsernameMatch = (item.user?.username || '').toLowerCase().includes(query);
        const creatorNameMatch = (item.creator?.name || '').toLowerCase().includes(query);
        const creatorUsernameMatch = (item.creator?.username || '').toLowerCase().includes(query);
        
        // Business profile name
        const businessMatch = (item.business?.name || '').toLowerCase().includes(query);
        
        // Golf course name
        const courseMatch = (item.golfCourse?.name || '').toLowerCase().includes(query);
        
        // Category label matching - search "Golf Trip" finds posts tagged with golf-trip
        const categoryLabelMatch = matchingCategoryIds.length > 0 && 
          item.categories?.some(cat => matchingCategoryIds.includes(cat));
        
        return titleMatch || descMatch || userNameMatch || userUsernameMatch || 
               creatorNameMatch || creatorUsernameMatch || businessMatch || courseMatch ||
               categoryLabelMatch;
      });
    }

    // STEP 4: Apply tag filter (watchActiveFilter for shorts tab)
    const activeTags = watchActiveFilter !== 'all' ? [watchActiveFilter] : selectedTags;
    if (activeTags.length > 0) {
      filtered = applyTagFilter(filtered, activeTags);
    }

    // STEP 5: Remove duplicates and enrich with like state
    const unique = filtered.filter((item, index, self) => 
      index === self.findIndex(t => t.src === item.src)
    ).map(item => ({
      ...item,
      isLiked: likedItems[item.id] ?? false
    }));

    return unique;
  }, [content, heroItem, searchQuery, selectedTags, watchActiveFilter, likedItems]);

  // Apply course clustering when 3+ items from same course in top 15 (for Shorts tab)
  // MUST be called unconditionally to satisfy React hooks rules
  const clusteredGridContent = React.useMemo(() => {
    if (!gridContent || gridContent.length === 0) return gridContent;
    
    // Check top 15 items for course clustering
    const topItems = gridContent.slice(0, 15);
    const courseCounts = new Map<string, { count: number; name: string; firstIndex: number }>();
    
    topItems.forEach((item, index) => {
      const courseId = item.golfCourse?.id;
      const courseName = item.golfCourse?.name;
      if (courseId && courseName) {
        if (!courseCounts.has(courseId)) {
          courseCounts.set(courseId, { count: 1, name: courseName, firstIndex: index });
        } else {
          courseCounts.get(courseId)!.count++;
        }
      }
    });
    
    // Find courses with 3+ items
    const clusterCourses = Array.from(courseCounts.entries())
      .filter(([, data]) => data.count >= 3)
      .sort((a, b) => a[1].firstIndex - b[1].firstIndex);
    
    if (clusterCourses.length === 0) return gridContent;
    
    // Mark the first occurrence of each clustered course
    const clusterHeaders = new Set(clusterCourses.map(([id]) => id));
    return gridContent.map((item, index) => {
      const courseId = item.golfCourse?.id;
      if (courseId && clusterHeaders.has(courseId)) {
        const courseData = courseCounts.get(courseId);
        if (courseData && courseData.firstIndex === index) {
          return { ...item, _clusterHeader: courseData.name };
        }
      }
      return item;
    });
  }, [gridContent]);

  // Handle Shorts tab directly (no sliding panels needed)
  if (main === 'shorts') {
    
    return (
      <div className="watch-tab-content min-h-screen">
        {/* Sticky Command Center - Search + Sort + Pills */}
        <div className="sticky top-0 z-30 bg-[var(--bg-page)]">
          <DiscoverCommandCenter
            searchPlaceholder="Search shorts, creators, courses…"
            searchValue={watchSearchQuery}
            onSearchChange={setWatchSearchQuery}
            sortValue={watchSortOption}
            onSortChange={setWatchSortOption}
            pills={watchPills}
            onPillSelect={setWatchActiveFilter}
            defaultSortValue="newest"
          />
        </div>
        
        {/* Watch Section Gap Token: 16px between all major sections */}
        <div className="h-4" /> {/* 16px gap: CommandCenter → Hero */}
        
        {/* Watch Hero - single featured item (uses unfiltered content) */}
        <DiscoverHero 
          item={heroItem}
          isLoading={loading && !content}
          onWatch={(item) => {
            // Hero click: find the item in unfiltered content and open fullscreen
            // Pass the full content array to maintain proper playlist order
            if (content && content.length > 0) {
              const index = content.findIndex(c => c.id === item.id);
              if (index !== -1) {
                onMediaClick(content[index], index);
              }
            }
          }}
        />
        
        <div className="h-4" /> {/* 16px gap: Hero → Suggested Golfers */}
        
        {/* Suggested Golfers */}
        <LiveClubhouseStrip />
        
        <div className="h-4" /> {/* 16px gap: Suggested Golfers → Grid */}
        
        {/* Feed Grid - uses new WatchGridV2 with ActivityGrid layout */}
        {/* CRITICAL FIX: WatchGridV2 now passes its own items array, 
            so we use that directly instead of searching in 'content' */}
        <WatchGridV2 
          onMediaClick={(item, index, gridItems) => {
            // Use the grid's own data array directly - this ensures we open 
            // the correct video since gridItems IS the displayed playlist
            onMediaClick(item as any, index);
          }}
        />
      </div>
    );
  }

  // Use VideosGrid with SlidingPanels for Videos tab
  if (main === 'videos') {
    return (
      <SlidingPanels
        activeKey={duration as LengthKey}
        order={CHIP_ORDER}
      >
      {(key: LengthKey) => (
          <VideosGridWrapper
            durationKey={key}
            currentContent={currentContent}
            getNextShort={getNextShort}
            getNextChannel={getNextChannel}
            recentHistory={recentHistory}
            shortsContentLength={shortsContent?.length ?? 0}
            onMediaClick={onMediaClick}
            isLoading={currentContent === null || loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            duration={duration}
          />
        )}
      </SlidingPanels>
    );
  }



  // Show loading while content is null for other tabs
  if (currentContent === null) {
    return (
      <ExploreGrid 
        content={[]}
        onLike={onLike}
        onFollow={onFollow}
        onMediaClick={onMediaClick}
        isLoading={true}
        hasMore={false}
        onLoadMore={loadMore}
        activeFilter={filterType}
        isDiscoverPage={true}
      />
    );
  }

  // Render content directly without Creator Spotlight injection
  return (
    <ExploreGrid 
      content={currentContent || []}
      onLike={onLike}
      onFollow={onFollow}
      onMediaClick={onMediaClick}
      isLoading={loading}
      hasMore={hasMore}
      onLoadMore={loadMore}
      activeFilter={filterType}
      isDiscoverPage={true}
    />
  );
}