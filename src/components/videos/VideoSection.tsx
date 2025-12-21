import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { LongFormVideoTile, LongFormVideo } from './LongFormVideoTile';

interface VideoSectionProps {
  title: string;
  subtitle?: string;
  videos: LongFormVideo[];
  onViewAll?: () => void;
  onVideoClick?: (id: string) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  showViewAll?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

/**
 * VideoSection - A modular section for the Videos tab
 * Contains title, optional subtitle, video grid, and View All button
 */
export const VideoSection: React.FC<VideoSectionProps> = ({
  title,
  subtitle,
  videos,
  onViewAll,
  onVideoClick,
  onCreatorClick,
  showViewAll = true,
  emptyState,
  className,
}) => {
  if (videos.length === 0 && emptyState) {
    return (
      <section className={cn("px-5", className)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {emptyState}
      </section>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section className={cn("", className)}>
      {/* Header with View All */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>View all</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Video cards - full width with divider background visible between */}
      <div className="space-y-3">
        {videos.map((video) => (
          <LongFormVideoTile
            key={video.id}
            video={video}
            onVideoClick={onVideoClick}
            onCreatorClick={onCreatorClick}
          />
        ))}
      </div>
    </section>
  );
};

export default VideoSection;
