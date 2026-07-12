import { useRef } from 'react';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { formatCount } from '@/features/watch-v2/utils/formatCount';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { useRailLane } from '@/video/useRailLane';
import { usePreroutePrefetch } from '@/video/usePreroutePrefetch';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { FeedPost } from '@/components/media-system/types/media';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function clampPortraitAr(row: any): number {
  const w = Number(row?.width) || 0;
  const h = Number(row?.height) || 0;
  if (w <= 0 || h <= 0) return 0.6;
  const ar = w / h;
  return Math.min(1, Math.max(0.6, ar));
}

export interface WallTileProps {
  row: any;
  post: FeedPost;
  flatIndex: number;
  posts: FeedPost[];
  isAutoplayActive: boolean;
}

export function WallTile({ row, post, flatIndex, posts, isAutoplayActive }: WallTileProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hlsUrl = post.mediaItems[0]?.hlsUrl ?? null;
  const isVideo = !!hlsUrl;
  const ownerKey = isVideo ? `${post.id}:0` : null;
  const posterUrl = row.poster_url ?? post.mediaItems[0]?.thumbnailUrl ?? null;

  const { hostRef, ready } = useRailLane({
    ownerKey,
    active: isAutoplayActive && isVideo,
    hlsUrl,
    posterUrl,
    postId: post.id,
  });

  const { onPrerouteArm, onPreroute, onPrerouteCancel } = usePreroutePrefetch({
    ownerKey,
    hlsUrl,
    enabled: isVideo && !isAutoplayActive,
  });

  const ar = clampPortraitAr(row);
  const stripped = row.post_content ? stripMentionMarkup(String(row.post_content)).trim() : '';
  const title = stripped || row.review_course_name?.trim() || row.course_name?.trim() || 'Clip';
  const duration = formatDuration(row.duration_seconds);
  const likes = Number(row.like_count ?? 0);

  const handlePress = () => {
    openWithOrigin({
      openedFrom: 'watch',
      posts,
      index: flatIndex,
      originEl: rootRef.current as HTMLElement | null,
      posterUrl,
      railOwnerKey: ownerKey,
    });
  };

  return (
    <div
      ref={rootRef}
      data-watch-tile-index={flatIndex}
      data-post-id={post.id}
      onClick={handlePress}
      onPointerDown={onPrerouteArm}
      onPointerUp={onPreroute}
      onPointerCancel={() => onPrerouteCancel('moved')}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: String(ar),
        borderRadius: 12,
        background: '#e5e9ef',
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: FONT_FAMILY,
      }}
    >
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : null}
      {isVideo ? (
        <div
          ref={hostRef}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            opacity: ready ? 1 : 0,
            transition: 'opacity 140ms linear',
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background: 'linear-gradient(to top, rgba(0,0,0,0.58) 0%, transparent 42%)',
          pointerEvents: 'none',
        }}
      />
      {duration ? (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            zIndex: 3,
            background: 'rgba(0,0,0,0.45)',
            WebkitBackdropFilter: 'blur(8px)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 9,
            padding: '2px 6px',
            borderRadius: 5,
          }}
        >
          {duration}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 9,
          right: 9,
          bottom: 7,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 10,
            color: 'rgba(255,255,255,0.85)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.creator_username ? `@${row.creator_username}` : ''}
          {likes > 0 ? ` \u00B7 \u2661 ${formatCount(likes)}` : ''}
        </div>
      </div>
    </div>
  );
}

export default WallTile;
