import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHubLongFormVideos } from '../hooks/useHubLongFormVideos';
import { formatDuration } from '../utils/formatDuration';
import { formatCountShort as formatCount } from '@/i18n/format';
import { FormatBadge } from './FormatBadge';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { toFeedPosts } from '../utils/toFeedPost';
import Pressable from '@/components/ui/Pressable';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { useRailLane } from '@/video/useRailLane';
import { usePreroutePrefetch } from '@/video/usePreroutePrefetch';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { openFsv2 } from '@/features/fsv2';
import { FLAGS } from '@/config/flags';
import type { FeedPost } from '@/components/media-system/types/media';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { VideoCardMoreButton } from './VideoCardMoreButton';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function Card({
  row,
  post,
  index,
  posts,
  isAutoplayActive,
}: {
  row: any;
  post: FeedPost;
  index: number;
  posts: FeedPost[];
  isAutoplayActive: boolean;
}) {
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
    openFsv2({ openedFrom: 'watch', posts, startIndex: index });
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
      data-watch-tile-index={index}
      data-post-id={post.id}
      style={{ width: 374, flexShrink: 0, cursor: 'pointer', fontFamily: FONT_FAMILY }}
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
        {row.duration_seconds ? (
          <div
            style={{
              position: 'absolute',
              bottom: 7,
              right: 7,
              zIndex: 2,
              background: 'rgba(0,0,0,0.72)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 5,
            }}
          >
            {formatDuration(row.duration_seconds)}
          </div>
        ) : null}
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
          {(row.creator_username || Number(row.like_count ?? 0) > 0) ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 500,
                fontSize: 11.5,
                color: '#64748B',
                marginTop: 3,
                minWidth: 0,
              }}
            >
              {row.creator_username ? (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  @{row.creator_username}
                </span>
              ) : null}
              {Number(row.like_count ?? 0) > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <Heart style={{ width: 12, height: 12, color: '#F7931E', fill: '#F7931E' }} strokeWidth={1.8} />
                  {formatCount(Number(row.like_count ?? 0))}
                </span>
              )}
            </div>
          ) : null}
        </div>
        <VideoCardMoreButton post={post} />
      </div>
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <div style={{ width: 374, flexShrink: 0 }}>
      <div
        style={{
          aspectRatio: '16 / 9',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
    </div>
  );
}

export function HubVideoRow() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data, isLoading } = useHubLongFormVideos(user?.id);

  const rows = (data ?? []) as any[];
  const feedPosts = useMemo(() => toFeedPosts(rows), [rows]);
  const { activeIndices, railRef } = useWatchAutoplay({
    railId: 'hub-video-row',
    posts: feedPosts,
    maxActive: 1,
  });

  if (!isLoading && rows.length === 0) return null;

  return (
    <section style={{ fontFamily: FONT_FAMILY }}>
      <SectionHeader
        role="section"
        accent="#F7931E"
        kicker="LONG FORM"
        title="New videos"
        paddingX={16}
        action={{ label: 'See all', onClick: () => navigate('/watch/videos?sort=latest') }}
      />

      <div
        ref={railRef}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '0 4px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {isLoading && rows.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {rows.map((r, i) => (
              <Card
                key={r.post_id}
                row={r}
                post={feedPosts[i]}
                index={i}
                posts={feedPosts}
                isAutoplayActive={activeIndices.has(i)}
              />
            ))}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/watch/videos')}
              style={{
                width: 120,
                flexShrink: 0,
                aspectRatio: '16 / 11',
                borderRadius: 4,
                border: '1.5px dashed rgba(0,0,0,0.14)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: FONT_FAMILY,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16, color: '#c97a10' }}>
                {'\u203A'}
              </div>
              <div style={{ fontWeight: 600, fontSize: 11, color: '#64748B' }}>
                All videos
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default HubVideoRow;
