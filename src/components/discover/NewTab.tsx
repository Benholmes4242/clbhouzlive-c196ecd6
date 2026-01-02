import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { FILTER_TYPES } from '@/components/explore/types';
import type { ExploreContentItem } from '@/components/explore/types';
import { getDurationFilter } from '@/constants/videoFilters';
import DiscoverHero, { createHeroItem } from '@/components/discover/DiscoverHero';
import { DiscoverCommandCenter, SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { MOMENT_CATEGORIES } from '@/components/post/create-moment/categoryDefinitions';
import { useHeroPreload } from '@/hooks/useHeroPreload';
import { LiveClubhouseStrip } from '@/components/shorts/LiveClubhouseStrip';
import ShortsGrid from '@/components/discover/ShortsGrid';

interface NewTabProps {
  onMediaClick: (item: any) => void;
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

// Pills - dynamically built from ALL categories (excluding 'other')
const NEW_TAB_PILLS = [
  { key: 'all', label: 'All', emoji: undefined as string | undefined },
  ...MOMENT_CATEGORIES
    .filter((cat) => cat.id !== 'other')
    .map((cat) => ({
      key: cat.id,
      label: cat.label,
      emoji: cat.emoji,
    })),
];

export default function NewTab({ onMediaClick }: NewTabProps) {
  const navigate = useNavigate();
  
  // Local state for command center
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('new-tab-sort') as SortOption) || 'newest';
    }
    return 'newest';
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  
  // Persist sort preference
  useEffect(() => {
    localStorage.setItem('new-tab-sort', sortOption);
  }, [sortOption]);
  
  // Convert pills to DiscoverCommandCenter format
  const pills: Pill[] = NEW_TAB_PILLS.map((pill) => ({
    key: pill.key,
    label: pill.label,
    selected: activeFilter === pill.key,
    icon: pill.emoji ? (
      <span aria-hidden="true" className="text-[14px] leading-none">
        {pill.emoji}
      </span>
    ) : undefined,
  }));
  
  // Fetch content - same as Watch tab, using Videos filter type
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(FILTER_TYPES.VIDEOS, undefined, undefined, sortOption);

  // CRITICAL: Preload hero video manifest as soon as content arrives
  useHeroPreload(content);

  // Handle like toggle with optimistic updates
  const handleLikeToggle = useCallback((itemId: string) => {
    const item = content?.find(i => i.id === itemId);
    if (!item) return;

    const currentlyLiked = likedItems[itemId] ?? false;
    const newLikedState = !currentlyLiked;

    // Optimistic update
    setLikedItems(prev => ({ ...prev, [itemId]: newLikedState }));

    // Haptics on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [content, likedItems]);

  // Handle profile navigation
  const handleAuthorClick = useCallback((authorId: string) => {
    if (!authorId) return;
    navigate(`/u/${authorId}`);
  }, [navigate]);

  // Create hero item using 3-TIER FALLBACK algorithm from UNFILTERED content
  // Priority 1: Most liked from last 24h
  // Priority 2: Most liked from last 7 days
  // Priority 3: Most recent landscape video
  // IMPORTANT: Hero is NEVER affected by search/tags - only grid is filtered
  const heroItem = useMemo(() => {
    // Use UNFILTERED content for hero selection
    if (!content || content.length === 0) return null;
    
    const LANDSCAPE_THRESHOLD = 1.25;
    const MIN_DURATION = 15;
    const MAX_DURATION = 180;
    
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
  const gridContent = useMemo(() => {
    if (!content || content.length === 0) return [];

    // STEP 1: Start with all content
    let filtered = [...content];

    // STEP 2: Remove hero item first (before filtering)
    if (heroItem) {
      filtered = filtered.filter(item => item.id !== heroItem.id);
    }

    // STEP 3: Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
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
        
        return titleMatch || descMatch || userNameMatch || userUsernameMatch || 
               creatorNameMatch || creatorUsernameMatch || businessMatch || courseMatch;
      });
    }

    // STEP 4: Apply tag filter (activeFilter)
    const activeTags = activeFilter !== 'all' ? [activeFilter] : [];
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
  }, [content, heroItem, searchQuery, activeFilter, likedItems]);

  // Apply course clustering when 3+ items from same course in top 15
  const clusteredGridContent = useMemo(() => {
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

  return (
    <div className="new-tab-content min-h-screen">
      {/* Sticky Command Center - Search + Sort + Pills */}
      <div className="sticky top-0 z-30 bg-[var(--bg-page)]">
        <DiscoverCommandCenter
          searchPlaceholder="Search videos, creators, courses…"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          sortValue={sortOption}
          onSortChange={setSortOption}
          pills={pills}
          onPillSelect={setActiveFilter}
          defaultSortValue="newest"
        />
      </div>
      
      {/* Gap Token: 16px between all major sections */}
      <div className="h-4" /> {/* 16px gap: CommandCenter → Hero */}
      
      {/* Hero - single featured item (uses unfiltered content) */}
      <DiscoverHero 
        item={heroItem}
        isLoading={loading && !content}
        onWatch={(item) => {
          const originalItem = content?.find(c => c.id === item.id);
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
