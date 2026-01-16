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
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="divide-y divide-border/30">
          <div className="bg-card overflow-hidden animate-pulse">
            <div className="aspect-video bg-muted" />
            <div className="px-4 py-3 flex gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted/60 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      {/* Section header - enhanced */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Continue watching
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Pick up where you left off</p>
        </div>
        {videos.length > 3 && (
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/80 hover:bg-muted transition-colors">
            <span className="text-sm font-medium text-foreground">View all</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
      <div className="mt-6 h-2 bg-muted/40" />
    </div>
  );
};

export default ContinueWatchingSection;
