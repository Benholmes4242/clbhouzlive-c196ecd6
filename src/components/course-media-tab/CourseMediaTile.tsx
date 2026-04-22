import React, { useEffect, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Film } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';

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

export const CourseMediaTile: React.FC<CourseMediaTileProps> = ({ post, index, allPosts }) => {
  const media = post.mediaItems[0];
  const isVideo = media?.type === 'video';
  const thumbnailUrl = isVideo ? media?.thumbnailUrl : (media?.imageUrl || media?.thumbnailUrl);
  const duration = media?.duration;
  const tileRef = useRef<HTMLDivElement>(null);
  const hlsUrl = media?.hlsUrl;

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
        // `allPosts` is the grouped-for-fullscreen array (one entry per post,
        // mediaItems[] aggregated). Translate the flat tile index → the post
        // index by matching post.id.
        const groupedPosts = allPosts ?? [post];
        const fullscreenIndex = Math.max(
          0,
          groupedPosts.findIndex(p => p.id === post.id),
        );
        useFullscreenFeedStore.getState().open(groupedPosts, fullscreenIndex);
      }}
      style={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 100ms ease',
        background: 'rgba(15,23,42,0.04)',
      }}
      className="active:scale-[0.97]"
    >
      {/* Poster or fallback */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.06)' }}>
          <Film style={{ width: 28, height: 28, color: 'rgba(15,23,42,0.3)' }} />
        </div>
      )}

      {/* Bottom gradient overlay — 50% height */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
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
            top: 6,
            right: 6,
            background: 'rgba(0,0,0,0.55)',
            borderRadius: 4,
            padding: '2px 5px',
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.02em',
            zIndex: 2,
          }}
        >
          {formatDuration(duration)}
        </div>
      )}

      {/* Caption + likes — bottom overlay */}
      {(post.caption || post.likeCount > 0) && (
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 6,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 6,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {post.caption ? (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.3,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                flex: 1,
                minWidth: 0,
              }}
            >
              {post.caption}
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          {post.likeCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5 6 5c2 0 3.5 1 4.5 2.5C11.5 6 13 5 15 5c3.5 0 5 4 3.5 7-2.5 4.5-9.5 9-9.5 9z"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                {post.likeCount}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
