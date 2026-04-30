import React, { useEffect, useRef } from 'react';
import { useCourseMediaViewerStore } from '@/components/course-media-tab/CourseMediaViewer';
import { Film } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { FeedPost } from '@/components/media-system/types/media';

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
  /** Optional opener wrapper from the grid that injects pagination callbacks
   *  into the fullscreen store. When omitted, falls back to a direct
   *  store.open() with no pagination. */
  onOpenFullscreen?: (posts: FeedPost[], index: number) => void;
}

export const CourseMediaLandscapeCard: React.FC<CourseMediaLandscapeCardProps> = ({ post, index, allPosts, onOpenFullscreen }) => {
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
          // preload hook
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
      onClick={() => {
        // `allPosts` is the per-media array; `index` IS the fullscreen index by construction.
        const perMediaPosts = allPosts ?? [post];
        if (onOpenFullscreen) {
          onOpenFullscreen(perMediaPosts, index);
        } else {
          useCourseMediaViewerStore.getState().open(perMediaPosts, index);
        }
      }}
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        overflow: 'hidden',
        cursor: 'pointer',
        gridColumn: '1 / -1',
        background: 'rgba(15,23,42,0.04)',
      }}
      className="active:scale-[0.99] transition-transform"
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.06)' }}>
          <Film style={{ width: 36, height: 36, color: 'rgba(15,23,42,0.3)' }} />
        </div>
      )}

      {/* Bottom gradient overlay — 60% for landscape */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Centered play button for videos */}
      {isVideo && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#fff">
              <path d="M3 1.5 L10 6 L3 10.5 Z" />
            </svg>
          </div>
        </div>
      )}

      {/* Duration badge — top right */}
      {isVideo && duration != null && duration > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.55)',
            borderRadius: 4,
            padding: '3px 6px',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.02em',
            zIndex: 2,
          }}
        >
          {formatDuration(duration)}
        </div>
      )}

      {/* Bottom content overlay — caption + author + likes */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 10,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 10,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {post.displayName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SquircleAvatar
                src={post.avatarUrl}
                alt={post.displayName}
                size={20}
                thinRing
                fallback={post.displayName.charAt(0).toUpperCase()}
              />
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {post.displayName}
              </div>
            </div>
          )}
        </div>
        {post.likeCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F7931E">
              <path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5 6 5c2 0 3.5 1 4.5 2.5C11.5 6 13 5 15 5c3.5 0 5 4 3.5 7-2.5 4.5-9.5 9-9.5 9z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F7931E', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {post.likeCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
