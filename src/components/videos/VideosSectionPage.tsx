import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LongFormVideoTileAutoplay } from './LongFormVideoTileAutoplay';
import { useInfiniteLongFormVideos } from '@/hooks/useInfiniteLongFormVideos';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';
import { useMediaAutoplay } from '@/media';
import { runtimeUserTap } from '@/media';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';

type SectionType = 'recommended' | 'trending' | 'following' | 'courses';

export type VideoCategory = 'all' | 'funny' | 'challenge' | 'course-vlog' | 'tips-coaching' | 'review' | 'other';

const VIDEO_PILLS: { value: VideoCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'funny', label: 'Funny' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'course-vlog', label: 'Course Vlog' },
  { value: 'tips-coaching', label: 'Tips & Coaching' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
];

const SECTION_TITLES: Record<SectionType, string> = {
  recommended: 'Recommended for you',
  trending: 'Trending this week',
  following: 'From creators you follow',
  courses: 'Courses & destinations',
};

const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  recommended: 'Based on what you watch',
  trending: 'Popular with golfers right now',
  following: 'Latest from creators you follow',
  courses: 'Videos featuring golf courses',
};

// Local storage key for sort preference
const VIDEOS_SECTION_SORT_KEY = 'videos-section-sort-option';

/**
 * VideosSectionPage - Full section page with infinite scroll
 * 
 * Routes (via query params on /discover):
 * - /discover?main=videos&section=recommended
 * - /discover?main=videos&section=trending
 * - /discover?main=videos&section=following
 * - /discover?main=videos&section=courses
 */
export const VideosSectionPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const section = (searchParams.get('section') || 'recommended') as SectionType;
  const categoryParam = (searchParams.get('category') || 'all') as VideoCategory;
  const category = categoryParam !== 'all' ? categoryParam : undefined;

  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const saved = localStorage.getItem(VIDEOS_SECTION_SORT_KEY);
    return (saved as SortOption) || 'newest';
  });

  // Get followed user IDs for following section
  const { followedIds } = useFollowedUsers();

  // Infinite query for videos
  const {
    items: rawItems,
    isLoading,
    isError,
    error,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteLongFormVideos({
    section,
    followedCreatorIds: followedIds,
    category,
  });

  // Client-side search filter
  const items = useMemo(() => {
    if (!searchQuery.trim()) return rawItems;
    
    const query = searchQuery.toLowerCase();
    return rawItems.filter(v => {
      const titleMatch = (v.title || '').toLowerCase().includes(query);
      const creatorMatch = (v.creatorName || '').toLowerCase().includes(query);
      const courseMatch = (v.golfCourseName || '').toLowerCase().includes(query);
      return titleMatch || creatorMatch || courseMatch;
    });
  }, [rawItems, searchQuery]);

  // Handle category selection - update URL
  const handleCategorySelect = (categoryKey: string) => {
    const newCategory = categoryKey as VideoCategory;
    const newParams = new URLSearchParams(searchParams);
    if (newCategory === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', newCategory);
    }
    setSearchParams(newParams);
  };

  // Handle sort change with persistence
  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
    localStorage.setItem(VIDEOS_SECTION_SORT_KEY, sort);
  };

  // Build pills for command center
  const pills: Pill[] = VIDEO_PILLS.map(p => ({
    key: p.value,
    label: p.label,
    selected: categoryParam === p.value,
  }));

  // Autoplay setup (same as Videos tab)
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'videos',
    surface: 'videos',
    preloadMargin: 300,
    scrollSettleDelay: 200,
    startThreshold: 0.4,
    stopThreshold: 0.25,
  });

  // Infinite scroll refs
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(isFetchingNextPage);
  const onLoadMoreRef = useRef(fetchNextPage);
  const loadingRef = useRef(false);

  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isFetchingRef.current = isFetchingNextPage; }, [isFetchingNextPage]);
  useEffect(() => { onLoadMoreRef.current = fetchNextPage; }, [fetchNextPage]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || !fetchNextPage) return;
    
    const timeoutId = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      
      // Create sentinel element
      const sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.width = '100%';
      sentinel.dataset.infiniteScrollSentinel = 'true';
      
      container.appendChild(sentinel);
      
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          
          if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current && !isFetchingRef.current) {
            loadingRef.current = true;
            onLoadMoreRef.current?.();
            setTimeout(() => {
              loadingRef.current = false;
            }, 1000);
          }
        },
        {
          rootMargin: '800px',
          threshold: 0
        }
      );
      
      observer.observe(sentinel);
      
      return () => {
        observer.disconnect();
        sentinel.remove();
      };
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [hasMore, fetchNextPage]);

  const handleVideoClick = (id: string) => {
    runtimeUserTap(id);
    navigate(`/video/${id}`, {
      state: { backgroundLocation: location, fromVideo: true }
    });
  };

  const handleCreatorClick = (creatorUserId: string) => {
    navigate(`/creator/${creatorUserId}`);
  };

  const handleBack = () => {
    navigate('/discover?main=videos');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header skeleton */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-6 bg-muted rounded w-48 animate-pulse" />
          </div>
        </div>
        
        {/* Loading skeletons */}
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="px-4 py-3">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-lg font-medium text-foreground mb-2">Failed to load videos</p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
          <button 
            onClick={handleBack}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-20">
      {/* Sticky Header with back button and section title */}
      <div className="sticky top-0 z-30 bg-[var(--bg-page)]">
        {/* Back button row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{SECTION_TITLES[section]}</h1>
            <p className="text-xs text-muted-foreground">{SECTION_DESCRIPTIONS[section]}</p>
          </div>
        </div>
        
        {/* Command Center: Search + Sort + Pills */}
        <DiscoverCommandCenter
          searchPlaceholder="Search videos, creators, courses..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          sortValue={sortOption}
          onSortChange={handleSortChange}
          pills={pills}
          onPillSelect={handleCategorySelect}
        />
      </div>

      {/* Video feed */}
      <div ref={containerRef} className="space-y-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-sm text-muted-foreground text-center">
              No videos available in this section yet.
            </p>
            <button 
              onClick={handleBack}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Back to Videos
            </button>
          </div>
        ) : (
          items.map((item, index) => (
            <LongFormVideoTileAutoplay
              key={item.id}
              video={item}
              onVideoClick={handleVideoClick}
              onCreatorClick={handleCreatorClick}
              registerVideo={registerMedia}
              isPlaying={playingIds.has(item.id)}
              videoIndex={index}
            />
          ))
        )}

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* End of content */}
        {!hasMore && items.length > 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            You've reached the end
          </div>
        )}
      </div>
    </div>
  );
};

export default VideosSectionPage;
