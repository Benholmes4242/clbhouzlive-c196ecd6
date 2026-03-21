import React, { useEffect, useRef } from 'react';
import { Film } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface CourseMediaLandscapeCardProps {
  post: FeedPost;
  index: number;
  allPosts?: FeedPost[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export const CourseMediaLandscapeCard: React.FC<CourseMediaLandscapeCardProps> = ({ post, index, allPosts, fetchNextPage, hasNextPage, isFetchingNextPage }) => {
  const media = post.mediaItems[0];
  const isVideo = media?.type === 'video';
  const thumbnailUrl = isVideo ? media?.thumbnailUrl : (media?.imageUrl || media?.thumbnailUrl);
  const duration = media?.duration;
  const hlsUrl = media?.hlsUrl;
  const tileRef = useRef<HTMLDivElement>(null);

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
      style={{ gridColumn: '1 / -1' }}
      className="relative aspect-video overflow-hidden cursor-pointer rounded-[4px] active:scale-[0.99] transition-transform"
      
      onClick={() => {
        if (allPosts) {
          // TODO Brief 3: fullscreen feed open
        }
      }}
      data-course-media-index={index}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Film className="w-10 h-10 text-muted-foreground" />
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      />

      {post.avatarUrl && (
        <div className="absolute top-1.5 left-1.5 z-10">
          <SquircleAvatar
            src={post.avatarUrl}
            alt=""
            size={20}
            fallback=""
            hideRing
          />
        </div>
      )}

      {isVideo && duration != null && duration > 0 && (
        <div
          className="absolute bottom-2 right-2 z-10 rounded-[4px] liquid-glass flex items-center"
          style={{ padding: '2px 6px' }}
        >
          <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
            {formatDuration(duration)}
          </span>
        </div>
      )}
    </div>
  );
};
