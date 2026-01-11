import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { VideoSection } from './VideoSection';
import { VideosEmptyState } from './VideosEmptyState';
import { VideosSectionPage } from './VideosSectionPage';
import { VideosSearchResults } from './VideosSearchResults';
import { ContinueWatchingCarousel } from './ContinueWatchingCarousel';
import { VideoNudgeBanner } from './VideoNudgeBanner';
import { FeaturedVideoHero } from './FeaturedVideoHero';
import { TrendingNowSection } from './TrendingNowSection';
import { CompactCreatorsSection } from './CompactCreatorsSection';
import { useLongFormVideosQuery } from '@/hooks/useLongFormVideosQuery';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useVideoNudges } from '@/hooks/useVideoNudges';
import { useVideoQueue } from '@/hooks/useVideoQueue';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useMediaAutoplay } from '@/media';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { getDiscoverCategories } from '@/components/post/create-moment/categoryDefinitions';
import { SHOW_MOCK_DATA, withMockVideos } from '@/utils/mockVideoData';

// Dynamic category type from definitions
export type VideoCategory = string;

// Build video pills dynamically from MOMENT_CATEGORIES
const VIDEO_PILLS = [
  { value: 'all', label: 'All', icon: undefined as React.ElementType | undefined },
  ...getDiscoverCategories().map(cat => ({
    value: cat.id,
    label: cat.label,
    icon: cat.icon,
  })),
];

// Local storage keys
const VIDEOS_SORT_KEY = 'videos-sort-option';
const VIDEOS_CATEGORY_KEY = 'videos-category';

// Map SortOption to query sort
type QuerySort = 'newest' | 'most-liked' | 'most-discussed';
const sortOptionToQuerySort = (sortOption: SortOption): QuerySort => {
  switch (sortOption) {
    case 'most-liked': return 'most-liked';
    case 'most-discussed': return 'most-discussed';
    default: return 'newest';
  }
};

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

  // Unified fullscreen player for Videos content
  const { openFullscreen } = useUnifiedFullscreen('explore', {
    allowLandscape: true,
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

  // Build pills for command center with icons
  const pills: Pill[] = VIDEO_PILLS.map(p => ({
    key: p.value,
    label: p.label,
    selected: categoryParam === p.value,
    icon: p.icon ? React.createElement(p.icon, { className: 'h-4 w-4' }) : undefined,
  }));

  // Category filter - undefined when 'all' (not the string 'all')
  const categoryFilter = categoryParam !== 'all' ? categoryParam : undefined;

  // Fetch videos using React Query with caching
  // Each section shows max 5 videos to keep the page compact
  const querySort = sortOptionToQuerySort(sortOption);
  
  const { videos: recommendedVideosRaw } = useLongFormVideosQuery({
    section: 'recommended',
    limit: 5,
    category: categoryFilter,
    sort: querySort,
  });

  const { videos: trendingVideosRaw } = useLongFormVideosQuery({
    section: 'trending',
    limit: 5,
    category: categoryFilter,
    // Trending always uses engagement sort, ignore user sort
  });

  const { videos: followedVideosRaw } = useLongFormVideosQuery({
    section: 'following',
    limit: 5,
    followedCreatorIds: followedIds,
    category: categoryFilter,
    sort: querySort,
  });

  const { videos: coursesVideosRaw } = useLongFormVideosQuery({
    section: 'courses',
    limit: 5,
    category: categoryFilter,
  });

  // Avoid re-showing Continue Watching videos in the sections below.
  // Also inject mock data when SHOW_MOCK_DATA is enabled
  const { recommendedVideos, followedVideos, trendingVideos, coursesVideos } = useMemo(() => {
    const continueWatchingIds = new Set<string>();

    // Exclude Continue Watching IDs (so they don't appear again elsewhere)
    continueWatchingVideos.forEach((v) => {
      if (v?.id) continueWatchingIds.add(v.id);
    });

    const excludeContinueWatching = <T extends { id: string }>(videos: T[]): T[] =>
      videos.filter((v) => v?.id && !continueWatchingIds.has(v.id));

    // Client-side search filter (comprehensive - matches Watch page implementation)
    const searchFilter = <T extends Record<string, any>>(videos: T[]): T[] => {
      if (!searchQuery || !searchQuery.trim()) return videos;

      const query = searchQuery.toLowerCase();
      return videos.filter((v) => {
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

        return (
          titleMatch ||
          captionMatch ||
          descriptionMatch ||
          creatorNameMatch ||
          creatorUsernameMatch ||
          userNameMatch ||
          userUsernameMatch ||
          nestedCreatorNameMatch ||
          nestedCreatorUsernameMatch ||
          businessMatch ||
          courseMatch ||
          golfCourseMatch
        );
      });
    };

    const followed = searchFilter(excludeContinueWatching(followedVideosRaw));
    const recommended = searchFilter(excludeContinueWatching(recommendedVideosRaw));
    const trending = searchFilter(excludeContinueWatching(trendingVideosRaw));
    const courses = searchFilter(excludeContinueWatching(coursesVideosRaw));

    // Inject mock data for visual testing when flag is enabled
    return {
      followedVideos: withMockVideos(followed, 8, 'following'),
      recommendedVideos: withMockVideos(recommended, 15, 'recommended'),
      trendingVideos: withMockVideos(trending, 10, 'trending'),
      coursesVideos: withMockVideos(courses, 10, 'courses'),
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

  // Build combined playlist from all video sections (for fullscreen navigation)
  const allVideos = useMemo(() => {
    // Combine all videos in display order (dedupe)
    const seen = new Set<string>();
    const combined: typeof recommendedVideos = [];
    
    const addUnique = (videos: typeof recommendedVideos) => {
      videos.forEach(v => {
        if (!seen.has(v.id)) {
          seen.add(v.id);
          combined.push(v);
        }
      });
    };
    
    addUnique(recommendedVideos.slice(0, 10));
    addUnique(trendingVideos.slice(0, 10));
    addUnique(followedVideos.slice(0, 10));
    addUnique(coursesVideos.slice(0, 10));
    
    return combined;
  }, [recommendedVideos, trendingVideos, followedVideos, coursesVideos]);

  // Convert LongFormVideo to ExploreContentItem format for fullscreen
  const videosAsExploreItems = useMemo(() => {
    return allVideos.map(video => ({
      id: video.id,
      type: 'video' as const,
      src: video.mediaUrl || '',
      thumbnailSrc: video.thumbnailUrl,
      title: video.title,
      durationSeconds: video.durationSeconds,
      user: {
        id: video.creatorUserId,
        name: video.creatorName,
        avatar: video.creatorAvatarUrl,
      },
      likes: video.likes || 0,
      golfCourse: video.golfCourseId ? {
        id: video.golfCourseId,
        name: video.golfCourseName || 'Golf Course',
      } : undefined,
      createdAt: video.createdAt,
    }));
  }, [allVideos]);

  const handleVideoClick = useCallback((id: string) => {
    savePosition();
    console.log('Video clicked:', id);
    
    // Find the video in the combined playlist
    const index = videosAsExploreItems.findIndex(v => v.id === id);
    if (index !== -1) {
      // Open fullscreen with our own data - don't call parent's onVideoClick
      // to avoid competing fullscreen calls
      openFullscreen(videosAsExploreItems, index);
    }
    
    // NOTE: Removed onVideoClick?.(id) to prevent parent from also opening fullscreen
    // Parent's handleVideoClick now just logs - we handle fullscreen here
  }, [videosAsExploreItems, openFullscreen, savePosition]);

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

      {/* Featured Video Hero - replaces "Featured Course" */}
      <FeaturedVideoHero
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
      />

      {/* Continue Watching - horizontal carousel */}
      <ContinueWatchingCarousel
        onVideoClick={(id, resumeAt) => {
          console.log('Resume video:', id, 'at', resumeAt);
          handleVideoClick(id);
        }}
        onCreatorClick={handleCreatorClick}
        className="mb-6"
      />

      {/* Trending Now - horizontal carousel */}
      <TrendingNowSection
        onVideoClick={handleVideoClick}
        onViewAll={() => handleViewAll('trending')}
        className="mb-6"
      />

      {/* Compact Creators Section */}
      <CompactCreatorsSection
        onCreatorClick={handleCreatorClick}
        className="mb-6"
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
