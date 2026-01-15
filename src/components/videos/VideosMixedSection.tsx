import React from 'react';
import { ChevronRight } from 'lucide-react';
import { LongFormLandscapeCard } from './LongFormLandscapeCard';
import { LongFormPortraitCard } from './LongFormPortraitCard';
import { VideosSectionSkeleton } from './VideosSectionSkeleton';
import { VideosSectionEmptyState } from './VideosSectionEmptyState';
import type { LongFormVideo } from './LongFormVideoTile';
import type { LongFormCardVideo } from './LongFormLandscapeCard';

interface VideosMixedSectionProps {
  title: string;
  subtitle?: string;
  videos: LongFormVideo[];
  isLoading?: boolean;
  onVideoTap: (video: LongFormVideo, index: number, allVideos: LongFormVideo[]) => void;
  onSeeAll: () => void;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  emptyMessage?: string;
}

/**
 * VideosMixedSection - Section with mixed layout
 * Featured 16:9 landscape hero + 2-column 3:4 portrait grid
 */
export const VideosMixedSection: React.FC<VideosMixedSectionProps> = ({
  title,
  subtitle,
  videos,
  isLoading = false,
  onVideoTap,
  onSeeAll,
  emptyAction,
  emptyMessage
}) => {
  if (isLoading) {
    return <VideosSectionSkeleton />;
  }

  if (videos.length === 0) {
    return (
      <VideosSectionEmptyState 
        title={title}
        message={emptyMessage}
        action={emptyAction}
      />
    );
  }

  // Split videos: first for featured, rest for grid
  const [featured, ...gridVideos] = videos;

  // Convert LongFormVideo to LongFormCardVideo format
  const toCardVideo = (v: LongFormVideo): LongFormCardVideo => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    mediaUrl: v.mediaUrl,
    duration: v.duration,
    durationSeconds: v.durationSeconds,
    creatorUserId: v.creatorUserId,
    creatorName: v.creatorName,
    creatorAvatarUrl: v.creatorAvatarUrl,
    likes: v.likes,
    views: v.views,
    createdAt: v.createdAt,
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <button 
          onClick={onSeeAll}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          See all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Featured Video (Landscape 16:9) */}
      <div className="px-4">
        <LongFormLandscapeCard
          video={toCardVideo(featured)}
          onTap={() => onVideoTap(featured, 0, videos)}
        />
      </div>

      {/* Grid Videos (Portrait 3:4, 2-column) */}
      {gridVideos.length > 0 && (
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            {gridVideos.slice(0, 4).map((video, index) => (
              <LongFormPortraitCard
                key={video.id}
                video={toCardVideo(video)}
                onTap={() => onVideoTap(video, index + 1, videos)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section divider */}
      <div className="mt-4 h-2 bg-muted/40" />
    </div>
  );
};

export default VideosMixedSection;
