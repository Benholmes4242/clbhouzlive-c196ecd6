import React, { useEffect, useRef } from 'react';
import { Heart, Film } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useMediaViewer } from '@/hooks/useMediaViewer';

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function abbreviateCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface WatchTileProps {
  post: FeedPost;
  index: number;
  allPosts?: FeedPost[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

const WatchTile: React.FC<WatchTileProps> = ({ post, index, allPosts, fetchNextPage, hasNextPage, isFetchingNextPage }) => {
  const media = post.mediaItems[0];
  const thumbnailUrl = media?.thumbnailUrl;
  const duration = media?.duration;
  const engagement = post.likeCount + post.commentCount + post.shareCount;
  const tileRef = useRef<HTMLDivElement>(null);
  const hlsUrl = post.mediaItems?.[0]?.hlsUrl;
  const { openViewer } = useMediaViewer();

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
      data-watch-index={index}
      className="relative aspect-[4/5] overflow-hidden rounded-[4px] cursor-pointer active:scale-[0.97]"
      style={{ transition: 'transform 100ms ease' }}
      
      onClick={() => {
        console.log('[WatchTile] clicked', { post, index, allPosts: allPosts?.length });
        const posts = allPosts ?? [post];
        const items = posts.flatMap(p =>
          p.mediaItems.map(m => ({
            id: m.id,
            type: m.type,
            hlsUrl: m.hlsUrl,
            mp4Url: m.mp4Url,
            imageUrl: m.imageUrl,
            thumbnailUrl: m.thumbnailUrl,
            width: m.width,
            height: m.height,
          }))
        );
        const startIndex = (allPosts ?? [post]).slice(0, index).reduce((acc, p) => acc + p.mediaItems.length, 0);
        console.log('[WatchTile] opening viewer', { items: items.length, startIndex });
        openViewer(items, startIndex);
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

      {duration != null && duration > 0 && (
        <div
          className="absolute bottom-1.5 right-1.5 z-10 rounded-[4px] flex items-center"
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            padding: '2px 5px',
          }}
        >
          <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {engagement > 0 && (
        <div
          className="absolute bottom-1.5 left-1.5 z-10 rounded-[4px] flex items-center gap-[3px]"
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            padding: '2px 5px',
          }}
        >
          <Heart className="w-[10px] h-[10px]" style={{ color: 'rgba(245, 158, 11, 0.9)', fill: 'rgba(245, 158, 11, 0.9)' }} />
          <span className="text-[11px] font-medium text-white">
            {abbreviateCount(engagement)}
          </span>
        </div>
      )}
    </div>
  );
};

export default WatchTile;
