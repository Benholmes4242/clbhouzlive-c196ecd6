import { useRef } from 'react';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { formatCount } from '@/features/watch-v2/utils/formatCount';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { FormatBadge } from '@/features/watch-v2/components/FormatBadge';
import { useRailLane } from '@/video/useRailLane';
import { usePreroutePrefetch } from '@/video/usePreroutePrefetch';
import { openWithOrigin } from '@/lib/openWithOrigin';
import Pressable from '@/components/ui/Pressable';
import type { FeedPost } from '@/components/media-system/types/media';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export type FeedCardBadge = 'clip' | 'video' | null;

export interface FeedCardProps {
  row: any;
  feedPost: FeedPost;
  posts: FeedPost[];
  flatIndex: number;
  isAutoplayActive: boolean;
  badge?: FeedCardBadge;
  /** Full-width breaker for landscape items. */
  wide?: boolean;
}

/** Clamp math shared with the clips wall — matches WallTile today. */
function clampPortraitAr(row: any): number {
  const w = Number(row?.width) || 0;
  const h = Number(row?.height) || 0;
  if (w <= 0 || h <= 0) return 0.6;
  const ar = w / h;
  return Math.min(1, Math.max(0.6, ar));
}
function clampLandscapeAr(row: any): number {
  const w = Number(row?.width) || 0;
  const h = Number(row?.height) || 0;
  const raw = w > 0 && h > 0 ? w / h : 1.6;
  return Math.min(1.78, raw);
}

/**
 * Canonical feed card. Hub-grid style (below-tile meta) on the clips-wall
 * bones (portrait pair-packs + full-width landscape breakers). Format-agnostic:
 * pass badge=null to suppress the format chip (e.g. pure clips grids).
 */
export function FeedCard({
  row,
  feedPost,
  posts,
  flatIndex,
  isAutoplayActive,
  badge = null,
  wide = false,
}: FeedCardProps) {
  const rootRef = useRef<HTMLElement>(null);

  const hlsUrl = feedPost.mediaItems[0]?.hlsUrl ?? null;
  const isVideo = !!hlsUrl;
  const ownerKey = isVideo ? `${feedPost.id}:0` : null;
  const posterUrl = row.poster_url ?? feedPost.mediaItems[0]?.thumbnailUrl ?? null;

  const { hostRef, ready } = useRailLane({
    ownerKey,
    active: isAutoplayActive && isVideo,
    hlsUrl,
    posterUrl,
    postId: feedPost.id,
  });

  const { onPrerouteArm, onPreroute, onPrerouteCancel } = usePreroutePrefetch({
    ownerKey,
    hlsUrl,
    enabled: isVideo && !isAutoplayActive,
  });

  const stripped = row.post_content
    ? stripMentionMarkup(String(row.post_content)).trim()
    : '';
  const fallbackTitle =
    badge === 'clip' ? 'Clip' : badge === 'video' ? 'Video' : 'Post';
  const title =
    stripped ||
    row.review_course_name?.trim() ||
    row.course_name?.trim() ||
    fallbackTitle;
  const duration = formatDuration(row.duration_seconds);
  const likes = Number(row.like_count ?? 0);
  const aspect = wide ? clampLandscapeAr(row) : clampPortraitAr(row);

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
    <Pressable
      ref={rootRef}
      as="div"
      variant="media"
      onPress={handlePress}
      onPrerouteArm={onPrerouteArm}
      onPreroute={onPreroute}
      onPrerouteCancel={onPrerouteCancel}
      data-watch-tile-index={flatIndex}
      data-post-id={feedPost.id}
      style={{
        display: 'block',
        width: '100%',
        cursor: 'pointer',
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: String(aspect),
          borderRadius: 12,
          background: '#e5e9ef',
          overflow: 'hidden',
        }}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
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
        {badge ? <FormatBadge format={badge} /> : null}
        {duration ? (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              zIndex: 2,
              background: 'rgba(0,0,0,0.72)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 9.5,
              padding: '2px 6px',
              borderRadius: 5,
              fontFamily: FONT_FAMILY,
            }}
          >
            {duration}
          </div>
        ) : null}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: wide ? 13.5 : 12.5,
          lineHeight: 1.28,
          color: '#0F172A',
          marginTop: 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: 11,
          color: '#64748B',
          marginTop: 2,
        }}
      >
        {row.creator_username ? `@${row.creator_username}` : ''}
        {likes > 0
          ? ` \u00B7 ${formatCount(likes)} ${likes === 1 ? 'like' : 'likes'}`
          : ''}
      </div>
    </Pressable>
  );
}

export default FeedCard;
