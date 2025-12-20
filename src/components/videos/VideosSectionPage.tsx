import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LongFormVideoTile, LongFormVideo } from './LongFormVideoTile';
import { VideoFilterChips, VideoCategory } from './VideoFilterChips';

/**
 * VideosSectionPage - Dedicated list page for "View All" from Videos tab
 * 
 * Routes:
 * - /videos?section=recommended
 * - /videos?section=trending
 * - /videos?section=following
 * - /videos?section=courses
 * - /videos?tag=reviews (future: filter by tag)
 */
export const VideosSectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const section = searchParams.get('section') || 'recommended';
  const tag = searchParams.get('tag');
  
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('all');
  const [videos, setVideos] = useState<LongFormVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    // TODO: Replace with real API call
    // Query must include: duration_seconds >= 180
    setIsLoading(true);
    
    // Mock data for now
    const mockVideos: LongFormVideo[] = [
      {
        id: 'v1',
        title: 'Stop Slicing Forever – The Fix That Actually Works',
        creatorId: 'rick-shiels',
        creatorName: 'Rick Shiels',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80',
        duration: '11:20',
        durationSeconds: 680,
        views: 1250000,
        createdAt: '2024-12-18',
        isTrending: section === 'trending',
      },
      {
        id: 'v2',
        title: 'Iron Contact Drills You Can Do at Home',
        creatorId: 'athletic-motion',
        creatorName: 'Athletic Motion Golf',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80',
        duration: '9:15',
        durationSeconds: 555,
        views: 890000,
        createdAt: '2024-12-15',
        isTrending: section === 'trending',
      },
      {
        id: 'v3',
        title: 'Course Management to Break 100',
        creatorId: 'golf-sidekick',
        creatorName: 'Golf Sidekick',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&q=80',
        duration: '18:30',
        durationSeconds: 1110,
        views: 2100000,
        createdAt: '2024-12-10',
        isTrending: section === 'trending',
      },
      {
        id: 'v4',
        title: 'Bryson DeChambeau Shows His INSANE Practice Routine',
        creatorId: 'bryson',
        creatorName: 'Bryson DeChambeau',
        thumbnailUrl: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=640&q=80',
        duration: '22:45',
        durationSeconds: 1365,
        views: 5400000,
        createdAt: '2024-12-19',
        isTrending: section === 'trending',
      },
    ];

    setTimeout(() => {
      setVideos(mockVideos);
      setIsLoading(false);
    }, 300);
  }, [section, tag, selectedCategory]);

  const handleVideoClick = (id: string) => {
    console.log('Video clicked:', id);
    // TODO: Navigate to video player
  };

  const handleCreatorClick = (creatorId: string) => {
    navigate(`/profile/${creatorId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
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
