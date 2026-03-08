import React from 'react';
import { Film } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface CourseMediaTileProps {
  post: FeedPost;
  index: number;
}

const HUD_GLASS = {
  background: 'rgba(0, 0, 0, 0.35)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
};

export const CourseMediaTile: React.FC<CourseMediaTileProps> = ({ post, index }) => {
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
        // TODO: Wire to fullscreen player
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

      {/* Duration badge (videos) — bottom-right */}
      {isVideo && duration != null && duration > 0 && (
        <div
          className="absolute bottom-1.5 right-1.5 z-10 rounded-[4px] flex items-center"
          style={{ ...HUD_GLASS, padding: '2px 5px' }}
        >
          <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Review rating — top-right */}
      {reviewRating != null && reviewRating > 0 && (
        <div
          className="absolute top-1.5 right-1.5 z-10 rounded-full flex items-center gap-[3px]"
          style={{ ...HUD_GLASS, padding: '2px 6px' }}
        >
          <img
            src="/images/brand/clubhouz-mark-white.svg"
            alt=""
            className="w-[10px] h-[10px]"
            style={{ filter: 'brightness(0) saturate(100%) invert(67%) sepia(74%) saturate(1000%) hue-rotate(360deg) brightness(101%) contrast(96%)' }}
          />
          <span className="text-[11px] font-semibold text-white">
            {reviewRating.toFixed(1)}
          </span>
        </div>
      )}

      {/* Creator avatar — bottom-left */}
      {avatarUrl && (
        <div className="absolute bottom-1.5 left-1.5 z-10">
          <SquircleAvatar
            src={avatarUrl}
            alt=""
            size={20}
            fallback=""
            hideRing
          />
        </div>
      )}
    </div>
  );
};
