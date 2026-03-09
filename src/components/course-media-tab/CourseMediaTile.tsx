import React from 'react';
import { Film, Play } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useFullscreenFeed } from '@/components/fullscreen-feed/hooks/useFullscreenFeed';

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface CourseMediaTileProps {
  post: FeedPost;
  index: number;
  allPosts?: FeedPost[];
}


export const CourseMediaTile: React.FC<CourseMediaTileProps> = ({ post, index, allPosts }) => {
  const media = post.mediaItems[0];
  const isVideo = media?.type === 'video';
  const thumbnailUrl = isVideo ? media?.thumbnailUrl : (media?.imageUrl || media?.thumbnailUrl);
  const duration = media?.duration;
  const reviewRating = post.review?.rating;
  const avatarUrl = post.avatarUrl;

  return (
    <div
      data-course-media-index={index}
      className="relative aspect-[4/5] overflow-hidden rounded-[4px] cursor-pointer active:scale-[0.97]"
      style={{ transition: 'transform 100ms ease' }}
      onClick={() => {
        if (allPosts) {
          useFullscreenFeed.getState().open({
            posts: allPosts,
            startIndex: index,
            sourceId: 'course-media',
          });
        }
      }}
    >
      {/* Poster or placeholder */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      />

      {/* Bottom bar — avatar left, play icon right, vertically centered */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between">
        {/* Avatar */}
        {avatarUrl ? (
          <SquircleAvatar
            src={avatarUrl}
            alt=""
            size={20}
            fallback=""
            hideRing
          />
        ) : <div />}

        {/* Video indicator — play icon + optional duration */}
        {isVideo ? (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full liquid-glass flex items-center justify-center">
              <Play className="w-2.5 h-2.5 text-white fill-white translate-x-[1px]" />
            </div>
            {duration != null && duration > 0 && (
              <div
                className="rounded-[4px] liquid-glass flex items-center"
                style={{ padding: '2px 5px' }}
              >
                <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
                  {formatDuration(duration)}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Review rating — top-right */}
      {reviewRating != null && reviewRating > 0 && (
        <div
          className="absolute top-1.5 right-1.5 z-10 rounded-full liquid-glass flex items-center gap-[3px]"
          style={{ padding: '2px 6px' }}
        >
          <img
            src="/images/brand/clubhouz-mark-white.svg"
            alt=""
            className="w-[10px] h-[10px] flex-shrink-0"
          />
          <span className="text-[11px] font-semibold text-white">
            {reviewRating.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
};
