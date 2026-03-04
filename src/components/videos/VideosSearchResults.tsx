import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LongFormVideoTile } from './LongFormVideoTile';
import { useLongFormVideos } from '@/hooks/useLongFormVideos';
// REMOVED: useUnifiedFullscreen — Phase 5 fullscreen system deleted

interface VideosSearchResultsProps {
  query: string;
  category?: string;
  onBack: () => void;
  className?: string;
}

/**
 * VideosSearchResults - Search results for long-form videos
 * 
 * DATA RULES:
 * - Only shows long-form videos (≥4 min)
 * - Searches in post content (title + caption)
 */
export const VideosSearchResults: React.FC<VideosSearchResultsProps> = ({
  query,
  category,
  onBack,
  className,
}) => {
  const navigate = useNavigate();

  const { videos, isLoading } = useLongFormVideos({
    searchQuery: query,
    category,
    limit: 50,
  });

  // Build playlist for fullscreen player
  const { openFullscreen } = useUnifiedFullscreen('explore', { allowLandscape: true });

  const videosAsExploreItems = useMemo(() => {
    return videos.map(video => ({
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
  }, [videos]);

  const handleVideoClick = useCallback((id: string) => {
    const index = videosAsExploreItems.findIndex(v => v.id === id);
    if (index !== -1) {
      openFullscreen(videosAsExploreItems, index);
    }
  }, [videosAsExploreItems, openFullscreen]);

  const handleCreatorClick = (creatorUserId: string) => {
    navigate(`/profile/${creatorUserId}`);
  };

  return (
    <div className={cn("min-h-screen pb-20 bg-[#F8FAFC]", className)}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors active:scale-[0.97]"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 truncate">"{query}"</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-5 pt-4">
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-100 rounded-xl mb-3" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Search className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-base font-semibold text-gray-600">
              No videos found for "{query}"
            </p>
            <p className="text-sm text-gray-400 mt-2 text-center">
              Try different keywords or browse categories
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">
              {videos.length} result{videos.length !== 1 ? 's' : ''} for "{query}"
            </p>
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
          </>
        )}
      </div>
    </div>
  );
};

export default VideosSearchResults;
