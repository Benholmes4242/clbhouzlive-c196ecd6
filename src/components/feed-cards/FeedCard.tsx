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
import { Heart } from 'lucide-react';
import { FormatBadge } from '@/features/watch-v2/components/FormatBadge';
import { formatCountShort as formatCount } from '@/i18n/format';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { stripMentionMarkup } from '@/lib/mentions/format';
import Pressable from '@/components/ui/Pressable';
import { useRailLane } from '@/video/useRailLane';
import { usePreroutePrefetch } from '@/video/usePreroutePrefetch';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { FeedPost } from '@/components/media-system/types/media';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export interface FeedCardRow {
  post_id: string;
  post_content: string | null;
  derived_format: 'clip' | 'video';
  poster_url: string | null;
  duration_seconds: number | null;
  creator_username: string | null;
  creator_display_name?: string | null;

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
  openedFrom,
  hideCourseAttribution = false,
  hideFormatBadge = false,
  bareTile = false,
  readOnlyFullscreen = false,
  hideLikeCount = false,
}: {

  row: FeedCardRow;
  feedPost: FeedPost;
  posts: FeedPost[];
  flatIndex: number;
  isAutoplayActive: boolean;
  /**
   * Surface tag passed straight into openWithOrigin({ openedFrom }). MUST
   * match the tag that this surface's grid checks via
   * useIsViewerOwnedBy(...) — otherwise the surface's appendPosts /
   * setPaginationState effects never fire and the fullscreen viewer opens
   * against an empty / wrong post array (blank white or partial media).
   * Known tags: 'watch' | 'clips' | 'course-media' | 'explore' | 'clubhouse'.
   */
  openedFrom: string;
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
  /**
   * When true, no text is rendered beneath the tile. Long-form video tiles
   * get a title overlay on the lower portion of the thumbnail; clips get
   * no overlay. A tiny amber like-count is overlaid bottom-left when
   * like_count > 0. Used on bare-tile grids: clips wall, Watch mixed grid,
   * courses Discover on-the-course, course details Media tab.
   */
  bareTile?: boolean;
  /** Open the fullscreen viewer in read-only / gallery mode: no like,
   *  comment, share or follow chrome. Used by course-detail surfaces.
   *  Watch surfaces must NOT set this. */
  readOnlyFullscreen?: boolean;
  /** Suppress the like-count overlay / meta figure on the tile. Opt-in;
   *  used by the course-details Media tab. Watch surfaces must NOT set it. */
  hideLikeCount?: boolean;
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


  // Type is truth; hlsUrl is a capability. A video with no manifest still
  // renders as a video tile (poster path); an image must never be treated
  // as a video just because a URL contained a 32-hex substring.
  const hlsUrl = feedPost.mediaItems[0]?.hlsUrl ?? null;
  const isVideo = feedPost.mediaItems[0]?.type === 'video';
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
      openedFrom,
      posts,
      index: flatIndex,
      originEl: rootRef.current as HTMLElement | null,
      posterUrl,
      railOwnerKey: ownerKey,
      ...(readOnlyFullscreen ? { options: { readOnly: true } } : {}),
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
        // Bare tiles live in mosaic grids where the column gap is 4px — match
        // vertical spacing to the horizontal gutter. Full cards (with caption
        // block) keep the roomier 12px stack rhythm.
        marginBottom: bareTile ? 4 : 12,
        cursor: 'pointer',
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 4,
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
        {!hideFormatBadge ? <FormatBadge format={row.derived_format} /> : null}
        {bareTile && !hideCourseAttribution && row.course_name ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
              maxWidth: '85%',
              padding: '3px 10px',
              borderRadius: 999,
              background: 'rgba(15,23,42,0.35)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 11,
              lineHeight: 1.2,
              fontFamily: FONT_FAMILY,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none',
            }}
          >
            <span style={{ flexShrink: 0 }}>📍</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.course_name}
            </span>
          </div>
        ) : null}

        <GlassDurationBadge seconds={row.duration_seconds} fontSize={9.5} />

        {bareTile && isVideo && !isClip && title ? (
          <>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '55%',
                zIndex: 1,
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 8,
                right: 8,
                bottom: 8,
                zIndex: 2,
                color: '#fff',
                fontWeight: 600,
                fontSize: 13,
                lineHeight: 1.25,
                fontFamily: FONT_FAMILY,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                pointerEvents: 'none',
                // Leave room for duration badge on the right
                paddingRight: duration ? 44 : 0,
              }}
            >
              {title}
            </div>
          </>
        ) : null}
        {bareTile && !hideLikeCount && row.like_count > 0 ? (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              zIndex: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              color: '#F7931E',
              fontWeight: 700,
              fontSize: 11,
              fontFamily: FONT_FAMILY,
              textShadow: '0 1px 2px rgba(0,0,0,0.45)',
              pointerEvents: 'none',
            }}
          >
            <Heart
              style={{ width: 12, height: 12, color: '#F7931E', fill: '#F7931E' }}
              strokeWidth={1.8}
            />
            {formatCount(row.like_count)}
          </div>
        ) : null}
      </div>
      {!bareTile ? (
        <>
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
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
            }}
          >
            {(row.creator_display_name || row.creator_username) ? (
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {row.creator_display_name || row.creator_username}
              </span>
            ) : null}

            {!hideLikeCount && row.like_count > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  flexShrink: 0,
                }}
              >
                <Heart
                  style={{ width: 12, height: 12, color: '#F7931E', fill: '#F7931E' }}
                  strokeWidth={1.8}
                />
                {formatCount(row.like_count)}
              </span>
            )}
          </div>
        </>
      ) : null}

    </Pressable>
  );
}

export default FeedCard;
