/**
 * ClipsInterruptShelf — full-bleed tinted band that periodically
 * interrupts the /watch/videos video feed with 3 trending clips.
 * A signposted doorway into /watch/clips, not mixed content: each shelf
 * runs its OWN autoplay rail and its OWN posts array so it can never
 * pollute the surrounding video-feed autoplay indexing.
 */
import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Pressable from '@/components/ui/Pressable';
import { SectionHeader } from '@/components/ui/SectionHeader';

import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { useRailLane } from '@/video/useRailLane';
import { usePreroutePrefetch } from '@/video/usePreroutePrefetch';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { FeedPost } from '@/components/media-system/types/media';
import type { InterruptClipRow } from '../hooks/useInterruptClips';

const FONT_FAMILY =
  'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface Props {
  clips: InterruptClipRow[];
  shelfIndex: number;
}

function ClipTile({
  row,
  post,
  index,
  posts,
  isAutoplayActive,
}: {
  row: InterruptClipRow;
  post: FeedPost;
  index: number;
  posts: FeedPost[];
  isAutoplayActive: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);

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

  const label = row.review_course_name || row.course_name || 'Clip';

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
    <div style={{ width: 143, flexShrink: 0, fontFamily: FONT_FAMILY }}>
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
          position: 'relative',
          width: 143,
          aspectRatio: '9 / 14',
          borderRadius: 4,
          overflow: 'hidden',
          background: '#e5e9ef',
          cursor: 'pointer',
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
        <GlassDurationBadge seconds={row.duration_seconds} bottom={5} right={5} fontSize={9} />

      </Pressable>
      <div
        style={{
          marginTop: 6,
          fontWeight: 700,
          fontSize: 11,
          color: '#0F172A',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function ClipsInterruptShelf({ clips, shelfIndex }: Props) {
  const navigate = useNavigate();

  // Slice the shared 9-clip pool by shelfIndex. Once the pool is exhausted,
  // later shelves render nothing (the null-guard below hides the section).
  const shelfClips = useMemo<InterruptClipRow[]>(() => {
    if (!clips || clips.length === 0) return [];
    const start = shelfIndex * 3;
    if (start >= clips.length) return []; // pool exhausted — shelf hides
    return clips.slice(start, start + 3);
  }, [clips, shelfIndex]);

  const shelfFeedPosts = useMemo(() => toFeedPosts(shelfClips), [shelfClips]);

  const { activeIndices, railRef } = useWatchAutoplay({
    railId: `videos-v2-shelf-${shelfIndex}`,
    posts: shelfFeedPosts,
    maxActive: 1,
  });

  if (shelfClips.length === 0) return null;

  const goToClips = () => navigate('/watch/clips');

  return (
    <section
      style={{
        margin: '0 -4px 16px',
        padding: '12px 0',
        background: 'rgba(247,147,30,0.06)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        fontFamily: FONT_FAMILY,
      }}
    >
      <SectionHeader
        role="section"
        kicker="Quick clips"
        action={{ label: 'See all', onClick: goToClips }}
        paddingX={12}
        cutLine={false}
      />

      <div
        ref={railRef}
        className="scrollbar-hide"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '0 4px',
        }}
      >
        {shelfClips.map((clip, i) => (
          <ClipTile
            key={clip.post_id}
            row={clip}
            post={shelfFeedPosts[i]}
            index={i}
            posts={shelfFeedPosts}
            isAutoplayActive={activeIndices.has(i)}
          />
        ))}

        <div
          role="button"
          tabIndex={0}
          onClick={goToClips}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              goToClips();
            }
          }}
          style={{
            width: 143,
            aspectRatio: '9 / 14',
            borderRadius: 4,
            border: '1.5px dashed rgba(0,0,0,0.14)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
            fontFamily: FONT_FAMILY,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16, color: '#94A3B8', lineHeight: 1 }}>
            {'\u203A'}
          </div>
          <div style={{ marginTop: 4, fontWeight: 600, fontSize: 11, color: '#64748B' }}>
            All clips
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClipsInterruptShelf;
