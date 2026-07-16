/**
 * FeedCard — the shared, canonical hub-feed tile.
 *
 * Faithful copy of the Tile component inside
 * src/features/watch-v2/components/HubMixedGrid.tsx. The rendering here
 * MUST stay a byte-equivalent behavioural copy of that Tile — do not
 * introduce variants, and do not edit HubMixedGrid.tsx. When the hub
 * evolves, port the change here.
 *
 * Contract:
 *   - `row`             — MixedGridRow-shaped context (derived_format,
 *                         poster_url, duration_seconds, post_content,
 *                         course_name, creator_username, like_count).
 *   - `feedPost`        — FeedPost for the same media, driving lane +
 *                         prefetch + openWithOrigin.
 *   - `posts`           — the flat FeedPost list this card belongs to.
 *   - `flatIndex`       — the FLAT index into `posts` (drives
 *                         data-watch-tile-index and openWithOrigin).
 *   - `isAutoplayActive` — activeIndices.has(flatIndex).
 */
import { useRef } from 'react';
import { FormatBadge } from '@/features/watch-v2/components/FormatBadge';
import { formatCountShort as formatCount } from '@/i18n/format';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { stripMentionMarkup } from '@/lib/mentions/format';
import Pressable from '@/components/ui/Pressable';
import { useRailLane } from '@/video/useRailLane';
import { usePreroutePrefetch } from '@/video/usePreroutePrefetch';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { FeedPost } from '@/components/media-system/types/media';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export interface FeedCardRow {
  post_id: string;
  post_content: string | null;
  derived_format: 'clip' | 'video';
  poster_url: string | null;
  duration_seconds: number | null;
  creator_username: string | null;
  like_count: number;
  course_name: string | null;
  width?: number | null;
  height?: number | null;
}

export function FeedCard({
  row,
  feedPost,
  posts,
  flatIndex,
  isAutoplayActive,
  hideCourseAttribution = false,
  hideFormatBadge = false,
}: {
  row: FeedCardRow;
  feedPost: FeedPost;
  posts: FeedPost[];
  flatIndex: number;
  isAutoplayActive: boolean;
  /**
   * When true, the course-name element does not render — the title falls
   * through to caption or the format-based fallback (Clip / Video). The
   * page is expected to already communicate the course (e.g. the course
   * detail Media tab IS the course). Default false — three existing
   * consumers (HubMixedGrid, ClipsWall, ExploreGrid) are pixel-unchanged.
   */
  hideCourseAttribution?: boolean;
  /**
   * When true, the top-left Clip/Video format badge is not rendered.
   * Use on pages whose context already tells the user the format
   * (e.g. the dedicated Clips subpage). Default false.
   */
  hideFormatBadge?: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const isClip = row.derived_format === 'clip';
  const w = Number(row?.width) || 0;
  const h = Number(row?.height) || 0;
  const aspect = (w > 0 && h > 0 && w > h) ? '16 / 9' : '9 / 14';
  const stripped = row.post_content
    ? stripMentionMarkup(String(row.post_content)).trim()
    : '';
  const courseTitle = hideCourseAttribution ? '' : (row.course_name?.trim() ?? '');
  const title =
    stripped ||
    courseTitle ||
    (isClip ? 'Clip' : 'Video');
  const duration = formatDuration(row.duration_seconds);


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
        marginBottom: 12,
        cursor: 'pointer',
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 12,
          background: '#e5e9ef',
          overflow: 'hidden',
        }}
      >
        {row.poster_url ? (
          <img
            src={row.poster_url}
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
        {!hideFormatBadge ? <FormatBadge format={row.derived_format} /> : null}
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
          fontSize: 12.5,
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
        {row.like_count > 0
          ? ` \u00B7 ${formatCount(row.like_count)} ${row.like_count === 1 ? 'like' : 'likes'}`
          : ''}
      </div>
    </Pressable>
  );
}

export default FeedCard;
