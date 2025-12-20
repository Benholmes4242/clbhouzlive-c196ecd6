import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LongFormVideoTile } from './LongFormVideoTile';
import { VideoFilterChips, VideoCategory } from './VideoFilterChips';
import { useLongFormVideos } from '@/hooks/useLongFormVideos';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';

/**
 * VideosSectionPage - Dedicated list page for "View All" from Videos tab
 * 
 * Routes (via query params on /discover):
 * - /discover?main=videos&section=recommended
 * - /discover?main=videos&section=trending
 * - /discover?main=videos&section=following
 * - /discover?main=videos&section=courses
 */
export const VideosSectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const section = (searchParams.get('section') || 'recommended') as 'recommended' | 'trending' | 'following' | 'courses';
  const tag = searchParams.get('tag');
  
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('all');

  // Get followed user IDs for following section
  const { followedIds } = useFollowedUsers();

  const getSectionTitle = (): string => {
    if (tag) return tag.charAt(0).toUpperCase() + tag.slice(1);
    switch (section) {
      case 'recommended': return 'Recommended for you';
      case 'trending': return 'Trending this week';
      case 'following': return 'From creators you follow';
      case 'courses': return 'Courses & destinations';
      default: return 'Videos';
    }
  };

  // Fetch videos using real data hook
  const { videos, isLoading } = useLongFormVideos({
    section,
    limit: 20,
    followedCreatorIds: section === 'following' ? followedIds : undefined,
  });

  const handleVideoClick = (id: string) => {
    console.log('Video clicked:', id);
    // TODO: Navigate to video player
  };

  const handleCreatorClick = (creatorUserId: string) => {
    // Videos context: navigate to Creator Page
    navigate(`/creator/${creatorUserId}`);
  };

  const handleBack = () => {
    // Go back to Videos tab home
    navigate('/discover?main=videos');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">{getSectionTitle()}</h1>
        </div>

        {/* Filter chips */}
        <VideoFilterChips
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          className="pb-3"
        />
      </div>

      {/* Video list */}
      <div className="px-5 pt-4">
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-xl mb-3" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-sm text-muted-foreground text-center">
              No videos available in this section yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {videos.map((video) => (
              <LongFormVideoTile
                key={video.id}
                video={video}
                onVideoClick={handleVideoClick}
                onCreatorClick={handleCreatorClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideosSectionPage;
