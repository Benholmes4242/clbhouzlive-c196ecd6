import { useMemo, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHubQuickClips } from '../hooks/useHubQuickClips';
import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { toFeedPosts } from '../utils/toFeedPost';
import Pressable from '@/components/ui/Pressable';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { useRailLane } from '@/video/useRailLane';
import { usePreroutePrefetch } from '@/video/usePreroutePrefetch';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { FeedPost } from '@/components/media-system/types/media';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { HubRpcRow } from '../utils/toFeedPost';

const FONT_FAMILY =
  'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function Tile({
  row,
  post,
  index,
  posts,
  isAutoplayActive,
}: {
  row: HubRpcRow;
  post: FeedPost;
  index: number;
  posts: FeedPost[];
  isAutoplayActive: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const title = row.review_course_name || 'Clip';
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
      style={{ width: 143, flexShrink: 0, cursor: 'pointer', fontFamily: FONT_FAMILY }}
    >
      <div
        style={{
          aspectRatio: '9 / 14',
          borderRadius: 4,
          background: '#e5e9ef',
          position: 'relative',
          overflow: 'hidden',
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
        <GlassDurationBadge seconds={row.duration_seconds} fontSize={9.5} />

      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 11.5,
          color: '#0F172A',
          marginTop: 6,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>
      {(row.creator_display_name || row.creator_username) ? (
        <div
          style={{
            fontWeight: 500,
            fontSize: 10.5,
            color: '#64748B',
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.creator_display_name || row.creator_username}
        </div>
      ) : null}

    </Pressable>
  );
}

function SkeletonTile() {
  return (
    <div style={{ width: 143, flexShrink: 0 }}>
      <div
        className="clb-shimmer-light"
        style={{
          aspectRatio: '9 / 14',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
      <div
        className="clb-shimmer-light"
        style={{
          height: 11.5,
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
          marginTop: 6,
        }}
      />
      <div
        className="clb-shimmer-light"
        style={{
          height: 10.5,
          width: '60%',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
          marginTop: 1,
        }}
      />
    </div>
  );
}

export function HubClipsRow() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data, isLoading } = useHubQuickClips(user?.id);

  const rows = (data ?? []) as HubRpcRow[];
  const feedPosts = useMemo(() => toFeedPosts(rows), [rows]);
  const { activeIndices, railRef } = useWatchAutoplay({
    railId: 'hub-clips-row',
    posts: feedPosts,
    maxActive: 1,
  });

  if (!isLoading && !authLoading && rows.length === 0) return null;

  return (
    <section style={{ fontFamily: FONT_FAMILY }}>
      <SectionHeader
        role="section"
        kicker="UNDER 90 SECONDS"
        title="Quick clips"
        paddingX={16}
        action={{ label: 'See all', onClick: () => navigate('/watch/clips') }}
      />

      <div
        ref={railRef}
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          padding: '0 4px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {(isLoading || authLoading) && rows.length === 0 ? (
          <>
            <SkeletonTile />
            <SkeletonTile />
            <SkeletonTile />
          </>
        ) : (
          <>
            {rows.map((r, i) => (
              <Tile
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
              onClick={() => navigate('/watch/clips')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/watch/clips');
                }
              }}
              style={{
                width: 143,
                flexShrink: 0,
                aspectRatio: '9 / 14',
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
                All clips
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default HubClipsRow;
