import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { VideosIntro } from './VideosIntro';
import { VideoSearchBar } from './VideoSearchBar';
import { VideoFilterChips, VideoCategory } from './VideoFilterChips';
import { VideoSection } from './VideoSection';
import { VideosEmptyState } from './VideosEmptyState';
import { useLongFormVideos } from '@/hooks/useLongFormVideos';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';

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
 * Layout:
 * 1. Search bar
 * 2. Filter chips (horizontal scroll)
 * 3. Modular sections with "View all"
 */
export const VideosTab: React.FC<VideosTabProps> = ({
  onVideoClick,
  className,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('all');

  // Check if we're in a section view (View All clicked)
  const sectionParam = searchParams.get('section');

  // Get followed user IDs for "From creators you follow" section
  const { followedIds } = useFollowedUsers();

  // Fetch videos for each section using the real data hook
  const { videos: recommendedVideos, isLoading: recLoading } = useLongFormVideos({
    section: 'recommended',
    limit: 4,
  });

  const { videos: trendingVideos, isLoading: trendLoading } = useLongFormVideos({
    section: 'trending',
    limit: 3,
  });

  const { videos: followedVideos, isLoading: followLoading } = useLongFormVideos({
    section: 'following',
    limit: 4,
    followedCreatorIds: followedIds,
  });

  const { videos: coursesVideos, isLoading: coursesLoading } = useLongFormVideos({
    section: 'courses',
    limit: 3,
  });

  const handleVideoClick = (id: string) => {
    console.log('Video clicked:', id);
    onVideoClick?.(id);
  };

  const handleCreatorClick = (creatorUserId: string) => {
    // Navigate using UUID - will work with profile route
    navigate(`/profile/${creatorUserId}`);
  };

  const handleSearch = (query: string) => {
    navigate(`/search?type=videos&q=${encodeURIComponent(query)}`);
  };

  const handleViewAll = (section: string) => {
    // Use discover-scoped route to avoid /videos conflict
    navigate(`/discover?main=videos&section=${section}`);
  };

  // If section param exists, we could render VideosSectionPage inline
  // For now, sections are handled by query param and we just filter differently
  // This keeps everything in Discover without needing a new route

  return (
    <div className={cn("min-h-screen pb-20", className)}>
      {/* Intro text */}
      <VideosIntro />

      {/* Search bar */}
      <VideoSearchBar onSearch={handleSearch} className="mb-4" />

      {/* Filter chips */}
      <VideoFilterChips
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        className="mb-6"
      />

      {/* Divider */}
      <div className="h-px bg-border/40 mx-5 mb-6" />

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
