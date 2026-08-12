/**
 * VideoFeedCard — full-width video card for /watch/videos.
 * Autoplay + fullscreen handoff replicates the W6 rail-lane pattern
 * (see src/features/watch-v2/components/HubVideoRow.tsx as the source
 * of truth). No imports from src/components/watch/.
 */
import { useRef } from 'react';
import { Heart } from 'lucide-react';
import Pressable from '@/components/ui/Pressable';
import { FormatBadge } from '@/features/watch-v2/components/FormatBadge';
import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { formatCountShort as formatCount } from '@/i18n/format';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { useRailLane } from '@/video/useRailLane';
import { usePreroutePrefetch } from '@/video/usePreroutePrefetch';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import type { FeedPost } from '@/components/media-system/types/media';
import type { VideosFeedV2Row } from '../hooks/useVideosFeedV2';
import { VideoCardMoreButton } from '@/features/watch-v2/components/VideoCardMoreButton';

const FONT_FAMILY =
  'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface Props {
  row: VideosFeedV2Row;
  post: FeedPost;
  index: number;
  posts: FeedPost[];
  isAutoplayActive: boolean;
}

export function VideoFeedCard({ row, post, index, posts, isAutoplayActive }: Props) {
  const rootRef = useRef<HTMLElement>(null);

  const stripped = row.post_content
    ? stripMentionMarkup(String(row.post_content)).trim()
    : '';
  const title = stripped || row.course_name || 'Untitled video';

  const initial =
    (row.creator_display_name || row.creator_username || '?')
      .toString()
      .trim()
      .charAt(0)
      .toUpperCase() || '?';

  const hlsUrl = post.mediaItems[0]?.hlsUrl ?? null;
  const isVideo = post.mediaItems[0]?.type === 'video';
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

  const handlePress = () => {
    openWithOrigin({
      openedFrom: 'watch',
      posts,
      index,
      originEl: rootRef.current as HTMLElement | null,
      posterUrl,
      railOwnerKey: ownerKey,
    });
  };

  const likeCount = typeof row.like_count === 'number' ? row.like_count : 0;

  return (
    <Pressable
      ref={rootRef}
      as="div"
      variant="media"
      onPress={handlePress}
      onPrerouteArm={onPrerouteArm}
      onPreroute={onPreroute}
      onPrerouteCancel={onPrerouteCancel}
      data-watch-tile-index={index}
      data-post-id={post.id}
      style={{
        width: '100%',
        marginBottom: 16,
        cursor: 'pointer',
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          aspectRatio: '16 / 9',
          borderRadius: 4,
          background: '#e5e9ef',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {row.poster_url ? (
          <img
            src={row.poster_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
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
        <FormatBadge format="video" />
        <GlassDurationBadge seconds={row.duration_seconds} bottom={7} right={7} fontSize={10} />

      </div>

      <div style={{ display: 'flex', gap: 9, marginTop: 8, alignItems: 'flex-start' }}>
        {row.creator_avatar_url ? (
          <img
            src={row.creator_avatar_url}
            alt=""
            style={{
              width: 30,
              height: 30,
              borderRadius: '34%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '34%',
              background: 'linear-gradient(135deg,#F7931E,#d97a10)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13.5,
              lineHeight: 1.28,
              color: '#0F172A',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          {(() => {
            const creatorName = row.creator_display_name || row.creator_username || '';
            const showCreator = creatorName.length > 0;
            if (!showCreator && likeCount === 0 && !row.post_created_at) return null;
            return (
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 11.5,
                  color: '#64748B',
                  marginTop: 3,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                  {showCreator && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {creatorName}
                    </span>
                  )}
                  {likeCount > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      <Heart style={{ width: 12, height: 12, color: '#F7931E', fill: '#F7931E' }} strokeWidth={1.8} />
                      {formatCount(likeCount)}
                    </span>
                  )}
                  {row.post_created_at && (
                    <span style={{ flexShrink: 0 }}>
                      {(showCreator || likeCount > 0) ? `\u00B7 ${relativeTime(row.post_created_at)}` : relativeTime(row.post_created_at)}
                    </span>
                  )}
                </span>
              </div>
            );
          })()}
        </div>
        <VideoCardMoreButton post={post} />
      </div>
    </Pressable>
  );
}

export default VideoFeedCard;
