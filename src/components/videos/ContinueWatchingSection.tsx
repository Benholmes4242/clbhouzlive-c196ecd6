import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { videos, isLoading } = useContinueWatching(6);

  const handleCreatorClick = (creatorUserId: string) => {
    navigate(`/creator/${creatorUserId}`);
  };

  // Don't show if no videos in progress
  if (!isLoading && videos.length === 0) {
    return null;
  }

  // Loading state (show skeleton)
  if (isLoading) {
    return (
      <div className={cn("px-5", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="animate-pulse">
            <div className="aspect-video bg-muted rounded-xl mb-3" />
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between px-5 mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Continue watching
        </h2>
        {videos.length > 3 && (
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Videos grid */}
      <div className="px-5">
        <div className="grid grid-cols-1 gap-5">
          {videos.slice(0, 3).map((video) => (
            <ContinueWatchingTile
              key={video.id}
              video={video}
              onVideoClick={onVideoClick}
              onCreatorClick={handleCreatorClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContinueWatchingSection;
