import React from 'react';
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
import { useLongFormVideos } from '@/hooks/useLongFormVideos';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

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
 * Modes:
 * - Default: Modular sections (Recommended, Trending, etc.)
 * - Section: View all for a specific section (?section=trending)
 * - Search: Search results (?mode=search&q=...)
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

  // Fetch videos for each section using the real data hook
  // Pass category filter if selected (not 'all')
  const categoryFilter = categoryParam !== 'all' ? categoryParam : undefined;

  const { videos: recommendedVideos, isLoading: recLoading } = useLongFormVideos({
    section: 'recommended',
    limit: 4,
    category: categoryFilter,
  });

  const { videos: trendingVideos, isLoading: trendLoading } = useLongFormVideos({
    section: 'trending',
    limit: 3,
    category: categoryFilter,
  });

  const { videos: followedVideos, isLoading: followLoading } = useLongFormVideos({
    section: 'following',
    limit: 4,
    followedCreatorIds: followedIds,
    category: categoryFilter,
  });

  const { videos: coursesVideos, isLoading: coursesLoading } = useLongFormVideos({
    section: 'courses',
    limit: 3,
    category: categoryFilter,
  });

  const handleVideoClick = (id: string) => {
    // Save scroll position before navigating
    savePosition();
    console.log('Video clicked:', id);
    
    // Navigate to video modal with background location for modal pattern
    navigate(`/video/${id}`, {
      state: { backgroundLocation: location, fromVideo: true }
    });
    
    onVideoClick?.(id);
  };

  const handleCreatorClick = (creatorUserId: string) => {
    // Save scroll position before navigating
    savePosition();
    // Videos tab: navigate to Creator Page (Phase 3 routing rule)
    navigate(`/creator/${creatorUserId}`);
  };

  const handleSearch = (query: string) => {
    // Navigate to search mode within Videos tab
    navigate(`/discover?main=videos&mode=search&q=${encodeURIComponent(query)}`);
  };

  const handleViewAll = (section: string) => {
    // Use discover-scoped route to avoid /videos conflict
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

      {/* Module 1: Recommended for you */}
      <VideoSection
        title="Recommended for you"
        videos={recommendedVideos.slice(0, 3)}
        onViewAll={() => handleViewAll('recommended')}
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
        className="mb-8"
      />

      {/* Module 2: Trending this week */}
      <VideoSection
        title="Trending this week"
        subtitle="Popular with golfers right now"
        videos={trendingVideos.slice(0, 2)}
        onViewAll={() => handleViewAll('trending')}
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
        className="mb-8"
      />

      {/* Module 3: From creators you follow */}
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

      {/* Module 4: Courses & destinations */}
      <VideoSection
        title="Courses & destinations"
        subtitle="Course vlogs and bucket-list rounds"
        videos={coursesVideos.slice(0, 2)}
        onViewAll={() => handleViewAll('courses')}
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
        className="mb-8"
      />
    </div>
  );
};

export default VideosTab;
