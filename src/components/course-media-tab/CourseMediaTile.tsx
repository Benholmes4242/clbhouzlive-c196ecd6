import React, { useEffect, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
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
  allPosts?: FeedPost[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}


export const CourseMediaTile: React.FC<CourseMediaTileProps> = ({ post, index, allPosts, fetchNextPage, hasNextPage, isFetchingNextPage }) => {
  const media = post.mediaItems[0];
  const isVideo = media?.type === 'video';
  const thumbnailUrl = isVideo ? media?.thumbnailUrl : (media?.imageUrl || media?.thumbnailUrl);
  const duration = media?.duration;
  const reviewRating = post.review?.rating;
  const avatarUrl = post.avatarUrl;
  const tileRef = useRef<HTMLDivElement>(null);
  const hlsUrl = media?.hlsUrl;

  useEffect(() => {
    const el = tileRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // TODO Brief 3: onViewPreload
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hlsUrl]);

  return (
    <div
      ref={tileRef}
      data-course-media-index={index}
      className="relative aspect-[4/5] overflow-hidden rounded-[4px] cursor-pointer active:scale-[0.97]"
      style={{ transition: 'transform 100ms ease' }}
      
      onClick={() => {
        if (allPosts) {
          // TODO Brief 3: fullscreen feed open
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

      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      />

      {isVideo && duration != null && duration > 0 && (
        <div
          className="absolute bottom-1.5 right-1.5 z-10 rounded-[4px] liquid-glass flex items-center"
          style={{ padding: '2px 5px' }}
        >
          <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {reviewRating != null && reviewRating > 0 && (
        <div
          className="absolute top-1.5 right-1.5 z-10 rounded-full flex items-center gap-[3px]"
          style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
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
