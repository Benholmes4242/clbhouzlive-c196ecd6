import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { VideoSection } from './VideoSection';
import { VideosEmptyState } from './VideosEmptyState';
import { VideosSectionPage } from './VideosSectionPage';
import { VideosSearchResults } from './VideosSearchResults';
import { ContinueWatchingSection } from './ContinueWatchingSection';
import { VideoNudgeBanner } from './VideoNudgeBanner';
import { useLongFormVideosQuery } from '@/hooks/useLongFormVideosQuery';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useVideoNudges } from '@/hooks/useVideoNudges';
import { useVideoQueue } from '@/hooks/useVideoQueue';
import { useDiscoverySignals } from '@/hooks/useDiscoverySignals';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useMediaAutoplay } from '@/media';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

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

// Local storage keys
const VIDEOS_SORT_KEY = 'videos-sort-option';

interface VideosTabProps {
  onVideoClick?: (id: string) => void;
  className?: string;
}

/**
 * VideosTab - YouTube-style long-form video home
 * 
 * DATA RULE: Videos tab = long-form ONLY (≥3 min / 180 seconds)
 * Shorts (<3 min) = Watch tab ONLY — NO crossover
 * 
 * Performance optimizations:
 * - React Query caching (5min stale, 30min gc)
 * - Lazy loading for Trending/Courses (fetch on scroll into view)
 * - Memoized boost score function
 */
export const VideosTab: React.FC<VideosTabProps> = ({
  onVideoClick,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const saved = localStorage.getItem(VIDEOS_SORT_KEY);
    return (saved as SortOption) || 'newest';
  });

  // Preserve scroll position when navigating to/from videos
  const { savePosition } = useScrollRestoration('discover:videos');

  // Nudges for growth hooks
  const { shouldShowNudge, markNudgeSeen, getNudgeMessage, shouldShowQueueReminder, markQueueReminderShown } = useVideoNudges();
  const { queue } = useVideoQueue();
  const { getBoostScore } = useDiscoverySignals();
  const [showQueueNudge, setShowQueueNudge] = useState(false);
  const [showQueueReminder, setShowQueueReminder] = useState(false);

  // Fetch Continue Watching for de-dupe (priority #1)
  const continueWatchingResult = useContinueWatching(6);
  const continueWatchingVideos = continueWatchingResult.videos;

  // Unified media autoplay with consistent thresholds
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'videos',        // Isolated surface for Videos page (no conflict with Watch/Profile)
    surface: 'videos',     // Use videos surface for MediaRuntime
    preloadMargin: 300,
    scrollSettleDelay: 200,
    startThreshold: 0.4,   // Play at 40% visible
    stopThreshold: 0.25,   // Pause at 25% visible (aligned with Watch/Profile)
  });

  // Track if first video has been preloaded
  const hasPreloadedFirst = useRef(false);

  // Lazy loading triggers for below-fold sections
  const { ref: trendingRef, isInView: trendingInView } = useIntersectionObserver({ rootMargin: '200px' });
  const { ref: coursesRef, isInView: coursesInView } = useIntersectionObserver({ rootMargin: '200px' });
  
  // Track if sections have been triggered (once visible, stay enabled)
  const [trendingTriggered, setTrendingTriggered] = useState(false);
  const [coursesTriggered, setCoursesTriggered] = useState(false);

  useEffect(() => {
    if (trendingInView && !trendingTriggered) setTrendingTriggered(true);
  }, [trendingInView, trendingTriggered]);

  useEffect(() => {
    if (coursesInView && !coursesTriggered) setCoursesTriggered(true);
  }, [coursesInView, coursesTriggered]);

  // Memoize boost score to prevent unnecessary re-renders
  const memoizedBoostScore = useCallback(
    (creatorId: string, category?: string) => getBoostScore(creatorId, category),
    [getBoostScore]
  );

  // Show queue nudge after user has been on page (one-time)
  useEffect(() => {
    if (shouldShowNudge('use-queue')) {
      const timer = setTimeout(() => setShowQueueNudge(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowNudge]);

  // Show queue reminder if user has items in queue (session-based)
  useEffect(() => {
    if (shouldShowQueueReminder(queue.length)) {
      setShowQueueReminder(true);
    }
  }, [queue.length, shouldShowQueueReminder]);

  // Check URL params for mode
  const sectionParam = searchParams.get('section');
  const modeParam = searchParams.get('mode');
  const urlSearchQuery = searchParams.get('q') || '';
  const categoryParam = (searchParams.get('category') || 'all') as VideoCategory;

  // Get followed user IDs for "From creators you follow" section
  const { followedIds } = useFollowedUsers();

  // Handle category selection - update URL
  const handleCategorySelect = (categoryKey: string) => {
    const category = categoryKey as VideoCategory;
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };

  // Handle sort change with persistence
  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
    localStorage.setItem(VIDEOS_SORT_KEY, sort);
  };

  // Build pills for command center
  const pills: Pill[] = VIDEO_PILLS.map(p => ({
    key: p.value,
    label: p.label,
    selected: categoryParam === p.value,
  }));

  // Category filter - undefined when 'all' (not the string 'all')
  const categoryFilter = categoryParam !== 'all' ? categoryParam : undefined;

  // Fetch videos using React Query with caching
  // Each section shows max 5 videos to keep the page compact
  const { videos: recommendedVideosRaw } = useLongFormVideosQuery({
    section: 'recommended',
    limit: 5,
    category: categoryFilter,
    getBoostScore: memoizedBoostScore,
  });

  const { videos: trendingVideosRaw } = useLongFormVideosQuery({
    section: 'trending',
    limit: 5,
    category: categoryFilter,
    enabled: trendingTriggered,
  });

  const { videos: followedVideosRaw } = useLongFormVideosQuery({
    section: 'following',
    limit: 5,
    followedCreatorIds: followedIds,
    category: categoryFilter,
  });

  const { videos: coursesVideosRaw } = useLongFormVideosQuery({
    section: 'courses',
    limit: 5,
    category: categoryFilter,
    enabled: coursesTriggered,
  });

  // Hard de-dupe: each video can appear in only ONE section across the entire page
  // Priority order: Continue Watching → Following → Recommended → Trending → Courses
  const { recommendedVideos, followedVideos, trendingVideos, coursesVideos } = useMemo(() => {
    const seen = new Set<string>();
    
    // First, add Continue Watching IDs (highest priority - they won't appear elsewhere)
    continueWatchingVideos.forEach(v => {
      if (v?.id) seen.add(v.id);
    });
    
    const dedupe = <T extends { id: string }>(videos: T[]): T[] => 
      videos.filter(v => v?.id && !seen.has(v.id) && (seen.add(v.id), true));
    
    // Client-side search filter (comprehensive - matches Watch page implementation)
    const searchFilter = <T extends Record<string, any>>(videos: T[]): T[] => {
      if (!searchQuery || !searchQuery.trim()) return videos;
      
      const query = searchQuery.toLowerCase();
      return videos.filter(v => {
        // Video content fields
        const titleMatch = (v.title || '').toLowerCase().includes(query);
        const captionMatch = (v.caption || '').toLowerCase().includes(query);
        const descriptionMatch = (v.description || '').toLowerCase().includes(query);
        
        // Creator fields (flat structure - videos tab specific)
        const creatorNameMatch = (v.creatorName || '').toLowerCase().includes(query);
        const creatorUsernameMatch = (v.creatorUsername || '').toLowerCase().includes(query);
        
        // User/creator fields (nested structure - polymorphic support)
        const userNameMatch = (v.user?.name || '').toLowerCase().includes(query);
        const userUsernameMatch = (v.user?.username || '').toLowerCase().includes(query);
        const nestedCreatorNameMatch = (v.creator?.name || '').toLowerCase().includes(query);
        const nestedCreatorUsernameMatch = (v.creator?.username || '').toLowerCase().includes(query);
        
        // Business profile name
        const businessMatch = (v.business?.name || '').toLowerCase().includes(query);
        
        // Golf course name (both camelCase and snake_case)
        const courseMatch = (v.golfCourse?.name || '').toLowerCase().includes(query);
        const golfCourseMatch = (v.golf_course?.name || '').toLowerCase().includes(query);
        
        return titleMatch || captionMatch || descriptionMatch ||
               creatorNameMatch || creatorUsernameMatch ||
               userNameMatch || userUsernameMatch ||
               nestedCreatorNameMatch || nestedCreatorUsernameMatch ||
               businessMatch || courseMatch || golfCourseMatch;
      });
    };
    
    // Process in priority order (after Continue Watching)
    const followed = searchFilter(dedupe(followedVideosRaw));
    const recommended = searchFilter(dedupe(recommendedVideosRaw));
    const trending = searchFilter(dedupe(trendingVideosRaw));
    const courses = searchFilter(dedupe(coursesVideosRaw));
    
    return {
      followedVideos: followed,
      recommendedVideos: recommended,
      trendingVideos: trending,
      coursesVideos: courses,
    };
  }, [continueWatchingVideos, followedVideosRaw, recommendedVideosRaw, trendingVideosRaw, coursesVideosRaw, searchQuery]);

  // CRITICAL: Preload first video immediately in layout phase (before paint)
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current) return;
    
    // Find first video from any section (recommended has priority as it loads first)
    const firstVideo = recommendedVideos[0] || followedVideos[0] || continueWatchingVideos[0];
    if (!firstVideo?.mediaUrl) return;

    hasPreloadedFirst.current = true;

    const uid = uidFromNode({ src: firstVideo.mediaUrl });
    if (uid) {
      const hlsUrl = generateStreamHlsUrl(uid);
      if (import.meta.env.DEV) {
        console.log(`[${performance.now().toFixed(2)}ms] [VideosTab] LAYOUT_EFFECT_PRELOAD`, { 
          id: firstVideo.id.slice(0, 8) 
        });
      }
      preloadHlsManifest(hlsUrl);
    }
  }, [recommendedVideos, followedVideos, continueWatchingVideos]);

  const handleVideoClick = (id: string) => {
    savePosition();
    console.log('Video clicked:', id);
    
    navigate(`/video/${id}`, {
      state: { backgroundLocation: location, fromVideo: true }
    });
    
    onVideoClick?.(id);
  };

  const handleCreatorClick = (creatorUserId: string) => {
    savePosition();
    navigate(`/creator/${creatorUserId}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // If user presses enter or submits, navigate to search mode
    // For now, just filter locally
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/discover?main=videos&mode=search&q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleViewAll = (section: string) => {
    navigate(`/discover?main=videos&section=${section}`);
  };

  const handleBackFromSearch = () => {
    navigate('/discover?main=videos');
  };

  // EARLY RETURNS AFTER ALL HOOKS - React hooks order rule
  // If in search mode, render search results
  if (modeParam === 'search' && urlSearchQuery) {
    return (
      <VideosSearchResults
        query={urlSearchQuery}
        category={categoryFilter}
        onBack={handleBackFromSearch}
        className={className}
      />
    );
  }

  // If section param exists, render section page
  if (sectionParam) {
    return <VideosSectionPage />;
  }

  return (
    <div className={cn("min-h-screen pb-20 bg-[var(--bg-page)]", className)}>
      {/* Sticky Command Center: Search + Sort + Pills */}
      <div className="sticky top-0 z-30 bg-[var(--bg-page)]">
        <DiscoverCommandCenter
          searchPlaceholder="Search videos, creators, courses..."
          searchValue={searchQuery}
          onSearchChange={handleSearch}
          sortValue={sortOption}
          onSortChange={handleSortChange}
          pills={pills}
          onPillSelect={handleCategorySelect}
        />
      </div>

      {/* Continue Watching (only shows if user has in-progress videos) */}
      <ContinueWatchingSection
        onVideoClick={(id, resumeAt) => {
          console.log('Resume video:', id, 'at', resumeAt);
          onVideoClick?.(id);
        }}
        className="mb-8"
      />

      {/* Module 1: Recommended for you (loads immediately) */}
      <VideoSection
        title="Recommended for you"
        subtitle="Based on what you watch"
        videos={recommendedVideos.slice(0, 10)}
        onViewAll={() => handleViewAll('recommended')}
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
        emptyState={<VideosEmptyState type="global-explore" />}
        className="mb-6"
        registerVideo={registerMedia}
        playingIds={playingIds}
        startIndex={0}
      />

      {/* Module 2: Trending this week (lazy loaded) */}
      {/* ⚠️ TESTING: Increased slice from 2 to 10 */}
      <div ref={trendingRef}>
        <VideoSection
          title="Trending this week"
          subtitle="Popular with golfers right now"
          videos={trendingVideos.slice(0, 10)}
          onViewAll={() => handleViewAll('trending')}
          onVideoClick={handleVideoClick}
          onCreatorClick={handleCreatorClick}
          emptyState={<VideosEmptyState type="global-explore" />}
          className="mb-6"
          registerVideo={registerMedia}
          playingIds={playingIds}
          startIndex={8}
        />
      </div>

      {/* Module 3: From creators you follow (loads immediately) */}
      <VideoSection
        title="From creators you follow"
        videos={followedVideos.slice(0, 10)}
        onViewAll={() => handleViewAll('following')}
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
        showViewAll={followedVideos.length > 0}
        emptyState={<VideosEmptyState type="creators-you-follow" />}
        className="mb-6"
        registerVideo={registerMedia}
        playingIds={playingIds}
        startIndex={13}
      />

      {/* Module 4: Courses & destinations (lazy loaded) */}
      <div ref={coursesRef}>
        <VideoSection
          title="Courses & destinations"
          subtitle="Course vlogs and bucket-list rounds"
          videos={coursesVideos.slice(0, 10)}
          onViewAll={() => handleViewAll('courses')}
          onVideoClick={handleVideoClick}
          onCreatorClick={handleCreatorClick}
          emptyState={<VideosEmptyState type="global-explore" />}
          className="mb-4"
          registerVideo={registerMedia}
          playingIds={playingIds}
          startIndex={19}
        />
      </div>
    </div>
  );
};

export default VideosTab;
