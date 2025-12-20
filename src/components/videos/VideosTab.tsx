import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { VIDEO_DURATION_THRESHOLD_SECONDS } from '@/constants/videoRules';
import { VideosIntro } from './VideosIntro';
import { VideoSearchBar } from './VideoSearchBar';
import { VideoFilterChips, VideoCategory } from './VideoFilterChips';
import { VideoSection } from './VideoSection';
import { VideosEmptyState } from './VideosEmptyState';
import { LongFormVideo } from './LongFormVideoTile';

interface VideosTabProps {
  onVideoClick?: (id: string) => void;
  className?: string;
}

// Mock data - replace with real API integration
// All videos here are long-form (≥3 min / 180 seconds)
const MOCK_RECOMMENDED: LongFormVideo[] = [
  {
    id: 'rec1',
    title: 'Stop Slicing Forever – The Fix That Actually Works',
    creatorId: 'rick-shiels',
    creatorName: 'Rick Shiels',
    creatorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80',
    duration: '11:20',
    durationSeconds: 680,
    views: 1250000,
    createdAt: '2024-12-18',
  },
  {
    id: 'rec2',
    title: 'Iron Contact Drills You Can Do at Home',
    creatorId: 'athletic-motion',
    creatorName: 'Athletic Motion Golf',
    creatorAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80',
    duration: '9:15',
    durationSeconds: 555,
    views: 890000,
    createdAt: '2024-12-15',
  },
  {
    id: 'rec3',
    title: 'Course Management to Break 100',
    creatorId: 'golf-sidekick',
    creatorName: 'Golf Sidekick',
    creatorAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&q=80',
    duration: '18:30',
    durationSeconds: 1110,
    views: 2100000,
    createdAt: '2024-12-10',
  },
];

const MOCK_TRENDING: LongFormVideo[] = [
  {
    id: 'trend1',
    title: 'Bryson DeChambeau Shows His INSANE Practice Routine',
    creatorId: 'bryson',
    creatorName: 'Bryson DeChambeau',
    creatorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=640&q=80',
    duration: '22:45',
    durationSeconds: 1365,
    views: 5400000,
    createdAt: '2024-12-19',
    isTrending: true,
  },
  {
    id: 'trend2',
    title: 'The SECRET Tiger Woods Drill Nobody Talks About',
    creatorId: 'peter-finch',
    creatorName: 'Peter Finch',
    creatorAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80',
    duration: '15:30',
    durationSeconds: 930,
    views: 3200000,
    createdAt: '2024-12-17',
    isTrending: true,
  },
];

const MOCK_COURSES: LongFormVideo[] = [
  {
    id: 'course1',
    title: 'Playing Pebble Beach for the First Time',
    creatorId: 'golf-sidekick',
    creatorName: 'Golf Sidekick',
    creatorAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80',
    duration: '45:20',
    durationSeconds: 2720,
    views: 1800000,
    createdAt: '2024-12-12',
    golfCourseId: 'pebble-beach',
    golfCourseName: 'Pebble Beach Golf Links',
  },
  {
    id: 'course2',
    title: 'St Andrews Old Course – A Dream Come True',
    creatorId: 'rick-shiels',
    creatorName: 'Rick Shiels',
    creatorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&q=80',
    duration: '38:15',
    durationSeconds: 2295,
    views: 2500000,
    createdAt: '2024-12-08',
    golfCourseId: 'st-andrews',
    golfCourseName: 'St Andrews Old Course',
  },
];

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
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('all');

  // TODO: Replace with real data fetching hooks
  // All queries must include: duration_seconds >= VIDEO_DURATION_THRESHOLD_SECONDS
  const recommendedVideos = MOCK_RECOMMENDED;
  const trendingVideos = MOCK_TRENDING;
  const coursesVideos = MOCK_COURSES;
  
  // Mock: no followed creators yet
  const followedCreatorsVideos: LongFormVideo[] = [];

  const handleVideoClick = (id: string) => {
    console.log('Video clicked:', id);
    onVideoClick?.(id);
  };

  const handleCreatorClick = (creatorId: string) => {
    // Phase 1 rule: route to Profile for now (Creator Page later)
    navigate(`/profile/${creatorId}`);
  };

  const handleSearch = (query: string) => {
    // Navigate to search with videos filter
    navigate(`/search?type=videos&q=${encodeURIComponent(query)}`);
  };

  const handleViewAll = (section: string) => {
    navigate(`/videos?section=${section}`);
  };

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
        videos={followedCreatorsVideos.slice(0, 3)}
        onViewAll={() => handleViewAll('following')}
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
        showViewAll={followedCreatorsVideos.length > 0}
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
