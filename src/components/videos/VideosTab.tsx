import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { VideosIntro } from './VideosIntro';
import { VideoSearchBar } from './VideoSearchBar';
import { VideoFilterChips, VideoCategory } from './VideoFilterChips';
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

  // Preserve scroll position when navigating to/from videos
  const { savePosition } = useScrollRestoration('discover:videos');

  // Nudges for growth hooks
  const { shouldShowNudge, markNudgeSeen, getNudgeMessage, shouldShowQueueReminder, markQueueReminderShown } = useVideoNudges();
  const { queue } = useVideoQueue();
  const { getBoostScore } = useDiscoverySignals();
  const [showQueueNudge, setShowQueueNudge] = useState(false);
  const [showQueueReminder, setShowQueueReminder] = useState(false);

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
  const searchQuery = searchParams.get('q') || '';
  const categoryParam = (searchParams.get('category') || 'all') as VideoCategory;

  // Get followed user IDs for "From creators you follow" section
  const { followedIds } = useFollowedUsers();

  // Handle category selection - update URL
  const handleCategorySelect = (category: VideoCategory) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };

  // Category filter - undefined when 'all' (not the string 'all')
  const categoryFilter = categoryParam !== 'all' ? categoryParam : undefined;

  // Fetch videos using React Query with caching
  // Recommended + Following load immediately, Trending + Courses lazy-load
  const { videos: recommendedVideos, isLoading: recLoading } = useLongFormVideosQuery({
    section: 'recommended',
    limit: 4,
    category: categoryFilter,
    getBoostScore: memoizedBoostScore,
  });

  const { videos: trendingVideos, isLoading: trendLoading } = useLongFormVideosQuery({
    section: 'trending',
    limit: 3,
    category: categoryFilter,
    enabled: trendingTriggered, // Lazy load
  });

  const { videos: followedVideos, isLoading: followLoading } = useLongFormVideosQuery({
    section: 'following',
    limit: 4,
    followedCreatorIds: followedIds,
    category: categoryFilter,
  });

  const { videos: coursesVideos, isLoading: coursesLoading } = useLongFormVideosQuery({
    section: 'courses',
    limit: 3,
    category: categoryFilter,
    enabled: coursesTriggered, // Lazy load
  });

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
    navigate(`/discover?main=videos&mode=search&q=${encodeURIComponent(query)}`);
  };

  const handleViewAll = (section: string) => {
    navigate(`/discover?main=videos&section=${section}`);
  };

  const handleBackFromSearch = () => {
    navigate('/discover?main=videos');
  };

  // If in search mode, render search results
  if (modeParam === 'search' && searchQuery) {
    return (
      <VideosSearchResults
        query={searchQuery}
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
    <div className={cn("min-h-screen pb-20", className)}>
      {/* Queue reminder nudge */}
      {showQueueReminder && (
        <div className="px-5 mb-4">
          <VideoNudgeBanner
            type="queue-reminder"
            message={getNudgeMessage('queue-reminder')}
            onDismiss={() => {
              setShowQueueReminder(false);
              markQueueReminderShown();
            }}
            onAction={() => {
              setShowQueueReminder(false);
              markQueueReminderShown();
            }}
            actionLabel={`${queue.length} video${queue.length !== 1 ? 's' : ''}`}
          />
        </div>
      )}

      {/* Queue usage nudge (one-time) */}
      {showQueueNudge && !showQueueReminder && (
        <div className="px-5 mb-4">
          <VideoNudgeBanner
            type="use-queue"
            message={getNudgeMessage('use-queue')}
            onDismiss={() => {
              setShowQueueNudge(false);
              markNudgeSeen('use-queue');
            }}
          />
        </div>
      )}

      {/* Intro text */}
      <VideosIntro />

      {/* Search bar */}
      <VideoSearchBar onSearch={handleSearch} className="mb-4" />

      {/* Filter chips */}
      <VideoFilterChips
        selected={categoryParam}
        onSelect={handleCategorySelect}
        className="mb-6"
      />

      {/* Divider */}
      <div className="h-px bg-border/40 mx-5 mb-6" />

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
        videos={recommendedVideos.slice(0, 3)}
        onViewAll={() => handleViewAll('recommended')}
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
        emptyState={<VideosEmptyState type="global-explore" />}
        className="mb-8"
      />

      {/* Module 2: Trending this week (lazy loaded) */}
      <div ref={trendingRef}>
        <VideoSection
          title="Trending this week"
          subtitle="Popular with golfers right now"
          videos={trendingVideos.slice(0, 2)}
          onViewAll={() => handleViewAll('trending')}
          onVideoClick={handleVideoClick}
          onCreatorClick={handleCreatorClick}
          emptyState={<VideosEmptyState type="global-explore" />}
          className="mb-8"
        />
      </div>

      {/* Module 3: From creators you follow (loads immediately) */}
      <VideoSection
        title="From creators you follow"
        videos={followedVideos.slice(0, 3)}
        onViewAll={() => handleViewAll('following')}
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
        showViewAll={followedVideos.length > 0}
        emptyState={<VideosEmptyState type="creators-you-follow" />}
        className="mb-8"
      />

      {/* Module 4: Courses & destinations (lazy loaded) */}
      <div ref={coursesRef}>
        <VideoSection
          title="Courses & destinations"
          subtitle="Course vlogs and bucket-list rounds"
          videos={coursesVideos.slice(0, 2)}
          onViewAll={() => handleViewAll('courses')}
          onVideoClick={handleVideoClick}
          onCreatorClick={handleCreatorClick}
          emptyState={<VideosEmptyState type="global-explore" />}
          className="mb-8"
        />
      </div>
    </div>
  );
};

export default VideosTab;
