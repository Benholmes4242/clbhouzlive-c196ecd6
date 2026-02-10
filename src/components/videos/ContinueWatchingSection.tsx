import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { ContinueWatchingTile } from './ContinueWatchingTile';

interface ContinueWatchingSectionProps {
  onVideoClick?: (id: string, resumeAt?: number) => void;
  className?: string;
}

/**
 * ContinueWatchingSection - Shows videos user has partially watched
 * Hidden if user has no in-progress videos
 */
export const ContinueWatchingSection: React.FC<ContinueWatchingSectionProps> = ({
  onVideoClick,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { videos, isLoading } = useContinueWatching(6);

  const handleCreatorClick = (creatorUserId: string) => {
    navigate(`/profile/${creatorUserId}`);
  };

  // Don't show if no videos in progress
  if (!isLoading && videos.length === 0) {
    return null;
  }

  // Loading state (show skeleton) - full bleed, square corners
  if (isLoading) {
    return (
      <div className={cn("", className)}>
        <div className="flex items-center justify-between mt-4 mb-3 px-4">
          <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-border/30">
          <div className="bg-white overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-100" />
            <div className="px-4 py-3 flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      {/* Section header — Watch tab standard */}
      <div className="flex items-center justify-between mt-4 mb-3 px-4">
        <h2 className="text-base font-semibold text-gray-700">
          Continue Watching
        </h2>
        {videos.length > 3 && (
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors active:scale-[0.97]">
            <span className="text-sm font-medium text-gray-700">View all</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Videos - full bleed */}
      <div className="divide-y divide-border/30">
        {videos.slice(0, 3).map((video) => (
          <ContinueWatchingTile
            key={video.id}
            video={video}
            onVideoClick={onVideoClick}
            onCreatorClick={handleCreatorClick}
          />
        ))}
      </div>

      {/* Section divider */}
      <div className="mt-6 h-2 bg-gray-50" />
    </div>
  );
};

export default ContinueWatchingSection;
