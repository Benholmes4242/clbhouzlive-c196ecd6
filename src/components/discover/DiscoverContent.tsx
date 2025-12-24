import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import ExploreGrid from '@/components/explore/ExploreGrid';
import VideosGrid from '@/components/discover/VideosGrid';
import PhotosGrid from '@/components/discover/PhotosGrid';
import ShortsGrid from '@/components/discover/ShortsGrid';
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
  onMediaClick: (item: any) => void;
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


// Apply tag filtering to content
function applyTagFilter(content: ExploreContentItem[], selectedTags: string[]): ExploreContentItem[] {
  if (!selectedTags.length) return content;
  
  return content.filter(item => {
    const title = item.title?.toLowerCase() || '';
    const description = item.ctaDescription?.toLowerCase() || '';
    
    // Check if any of the selected tags appear in title or description
    return selectedTags.some(tag => 
      title.includes(tag.toLowerCase()) || 
      description.includes(tag.toLowerCase()) ||
      title.includes(`#${tag.toLowerCase()}`) ||
      description.includes(`#${tag.toLowerCase()}`)
    );
  });
}

// Shorts filter pills
const SHORTS_PILLS = [
  { key: 'all', label: 'All' },
  { key: 'funny', label: 'Funny' },
  { key: 'challenge', label: 'Challenge' },
  { key: 'tips', label: 'Tips' },
  { key: 'course-vlog', label: 'Course Vlog' },
  { key: 'trick-shots', label: 'Trick Shots' },
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
  
  // Convert pills to DiscoverCommandCenter format
  const watchPills: Pill[] = SHORTS_PILLS.map(pill => ({
    key: pill.key,
    label: pill.label,
    selected: watchActiveFilter === pill.key,
  }));
  
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
  
  // Use existing hook to fetch content with filters
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(filterType, sub, durationFilter);

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
    if (!currentContent) return;

    const item = currentContent.find(i => i.id === itemId);
    if (!item) return;

    const currentlyLiked = likedItems[itemId] ?? false;
    const newLikedState = !currentlyLiked;

    // Optimistic update
    setLikedItems(prev => ({ ...prev, [itemId]: newLikedState }));
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
  }, [currentContent, likedItems, onLike]);

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

  // Create hero item from the first LANDSCAPE video content item
  // Hero must only select landscape videos (aspectRatio >= 1.25) to avoid cropping
  const heroItem = useMemo(() => {
    if (!currentContent || currentContent.length === 0) return null;
    
    const LANDSCAPE_THRESHOLD = 1.25;
    
    // Find the first landscape video item for the hero
    const landscapeVideo = currentContent.find(item => {
      if (item.type !== 'video') return false;
      
      // Check if we have explicit aspect ratio
      if (item.aspectRatio && item.aspectRatio >= LANDSCAPE_THRESHOLD) {
        return true;
      }
      
      // Fallback: compute from width/height if available
      if (item.width && item.height && item.height > 0) {
        const computedAspectRatio = item.width / item.height;
        return computedAspectRatio >= LANDSCAPE_THRESHOLD;
      }
      
      // Fallback: check landscapeSuitable flag
      return item.landscapeSuitable === true;
    });
    
    // If no landscape video found, return null (hero won't render)
    // This prevents portrait videos from being cropped in the hero
    return landscapeVideo ? createHeroItem(landscapeVideo) : null;
  }, [currentContent]);

  // Filter out the hero item from the grid
  const gridContent = useMemo(() => {
    if (!currentContent || !heroItem) return currentContent;
    return currentContent.filter(item => item.id !== heroItem.id);
  }, [currentContent, heroItem]);

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
        
        {/* Watch Hero - single featured item */}
        <DiscoverHero 
          item={heroItem}
          isLoading={loading && !currentContent}
          onWatch={(item) => {
            const originalItem = currentContent?.find(c => c.id === item.id);
            if (originalItem) onMediaClick(originalItem);
          }}
        />
        
        <div className="h-4" /> {/* 16px gap: Hero → Suggested Golfers */}
        
        {/* Suggested Golfers */}
        <LiveClubhouseStrip />
        
        <div className="h-4" /> {/* 16px gap: Suggested Golfers → Grid */}
        
        {/* Feed Grid with course clustering */}
        <ShortsGrid 
          items={clusteredGridContent || []} 
          onOpen={onMediaClick}
          isLoading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onLike={handleLikeToggle}
          onAuthorClick={handleAuthorClick}
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