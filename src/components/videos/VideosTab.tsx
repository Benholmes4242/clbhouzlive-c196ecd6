import React, { useState, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { VideosMixedSection } from './VideosMixedSection';
import { VideosTabSkeleton } from './VideosTabSkeleton';
import { VideosSectionPage } from './VideosSectionPage';
import { VideosSearchResults } from './VideosSearchResults';
import { ContinueWatchingSection } from './ContinueWatchingSection';
import { useLongFormVideosQuery } from '@/hooks/useLongFormVideosQuery';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { getDiscoverCategories } from '@/components/post/create-moment/categoryDefinitions';
import { SHOW_MOCK_DATA, withMockVideos } from '@/utils/mockVideoData';
import type { LongFormVideo } from './LongFormVideoTile';

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
 * VideosTab - YouTube-style long-form video home with mixed layout
 * 
 * DATA RULE: Videos tab = long-form ONLY (≥4 min / 240 seconds)
 * Shorts (<4 min) = Watch tab ONLY — NO crossover
 * 
 * Layout: Each section has:
 * - Featured 16:9 landscape hero
 * - 2-column 3:4 portrait grid below
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

  // Fetch Continue Watching for de-dupe (priority #1)
  const continueWatchingResult = useContinueWatching(6);
  const continueWatchingVideos = continueWatchingResult.videos;

  // Unified fullscreen player for Videos content
  const { openFullscreen } = useUnifiedFullscreen('explore', {
    allowLandscape: true,
  });

  // Track if first video has been preloaded
  const hasPreloadedFirst = useRef(false);

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
  
  const { videos: recommendedVideosRaw, isLoading: isLoadingRecommended } = useLongFormVideosQuery({
    section: 'recommended',
    limit: 5,
    category: categoryFilter,
    sort: querySort,
  });

  const { videos: trendingVideosRaw, isLoading: isLoadingTrending } = useLongFormVideosQuery({
    section: 'trending',
    limit: 5,
    category: categoryFilter,
    // Trending always uses engagement sort, ignore user sort
  });

  const { videos: followedVideosRaw, isLoading: isLoadingFollowing } = useLongFormVideosQuery({
    section: 'following',
    limit: 5,
    followedCreatorIds: followedIds,
    category: categoryFilter,
    sort: querySort,
  });

  const { videos: coursesVideosRaw, isLoading: isLoadingCourses } = useLongFormVideosQuery({
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

    // Client-side search filter
    const searchFilter = <T extends Record<string, any>>(videos: T[]): T[] => {
      if (!searchQuery || !searchQuery.trim()) return videos;

      const query = searchQuery.toLowerCase();
      return videos.filter((v) => {
        const titleMatch = (v.title || '').toLowerCase().includes(query);
        const captionMatch = (v.caption || '').toLowerCase().includes(query);
        const creatorNameMatch = (v.creatorName || '').toLowerCase().includes(query);
        const creatorUsernameMatch = (v.creatorUsername || '').toLowerCase().includes(query);
        const courseMatch = (v.golfCourseName || '').toLowerCase().includes(query);

        return titleMatch || captionMatch || creatorNameMatch || creatorUsernameMatch || courseMatch;
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
    
    const firstVideo = recommendedVideos[0] || followedVideos[0] || continueWatchingVideos[0];
    if (!firstVideo?.mediaUrl) return;

    hasPreloadedFirst.current = true;

    const uid = uidFromNode({ src: firstVideo.mediaUrl });
    if (uid) {
      const hlsUrl = generateStreamHlsUrl(uid);
      preloadHlsManifest(hlsUrl);
    }
  }, [recommendedVideos, followedVideos, continueWatchingVideos]);

  // Build combined playlist from all video sections (for fullscreen navigation)
  const allVideos = useMemo(() => {
    const seen = new Set<string>();
    const combined: LongFormVideo[] = [];
    
    const addUnique = (videos: LongFormVideo[]) => {
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

  const handleVideoTap = useCallback((video: LongFormVideo, index: number, sectionVideos: LongFormVideo[]) => {
    savePosition();
    
    // Find the video in the combined playlist for fullscreen
    const globalIndex = videosAsExploreItems.findIndex(v => v.id === video.id);
    if (globalIndex !== -1) {
      openFullscreen(videosAsExploreItems, globalIndex);
    }
  }, [videosAsExploreItems, openFullscreen, savePosition]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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

  // Show skeleton while initial data is loading
  const isInitialLoading = isLoadingRecommended && isLoadingTrending && isLoadingFollowing && isLoadingCourses;
  
  if (isInitialLoading) {
    return (
      <div className={cn("min-h-screen pb-20 bg-[var(--bg-page)]", className)}>
        <VideosTabSkeleton />
      </div>
    );
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
        className="mb-6"
      />

      {/* Video Sections with Mixed Layout */}
      <div className="flex flex-col gap-2">
        {/* Recommended for you */}
        <VideosMixedSection
          title="Recommended for you"
          subtitle="Based on what you watch"
          videos={recommendedVideos.slice(0, 5)}
          isLoading={isLoadingRecommended}
          onVideoTap={handleVideoTap}
          onSeeAll={() => handleViewAll('recommended')}
        />

        {/* Trending this week */}
        <VideosMixedSection
          title="Trending this week"
          subtitle="Popular with golfers right now"
          videos={trendingVideos.slice(0, 5)}
          isLoading={isLoadingTrending}
          onVideoTap={handleVideoTap}
          onSeeAll={() => handleViewAll('trending')}
        />

        {/* From creators you follow */}
        <VideosMixedSection
          title="From creators you follow"
          subtitle="Latest from people you follow"
          videos={followedVideos.slice(0, 5)}
          isLoading={isLoadingFollowing}
          onVideoTap={handleVideoTap}
          onSeeAll={() => handleViewAll('following')}
          emptyMessage="Follow creators to see their videos here"
          emptyAction={{
            label: "Discover creators",
            onClick: () => navigate('/discover?main=channels')
          }}
        />

        {/* Courses & destinations */}
        <VideosMixedSection
          title="Courses & destinations"
          subtitle="Course vlogs and bucket-list rounds"
          videos={coursesVideos.slice(0, 5)}
          isLoading={isLoadingCourses}
          onVideoTap={handleVideoTap}
          onSeeAll={() => handleViewAll('courses')}
        />
      </div>
    </div>
  );
};

export default VideosTab;

