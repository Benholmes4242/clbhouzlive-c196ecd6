import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { formatRelativeRounded } from '@/i18n/format';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

import { autoplayBlocked } from './reviewVideoAutoplay';
import { registerRailVideo } from './mediaRailAutoplay';
import { attachTileHls } from './tileHlsPlayer';
import type { CommunityVideo } from './hooks/useCommunityVideos';

import '@/styles/media-rail-bars.css';

/**
 * THE TWO RAIL TILES (BRIEF_DISCOVER_MEDIA_RAILS §2).
 *
 *   VIDEO TILE — 16:9, 268px wide, radius 14. Long form is FRAMED LANDSCAPE; a
 *   vertical crop would cut off what the creator composed. Title + meta sit
 *   BELOW the thumbnail. It carries a duration chip.
 *
 *   CLIP TILE — 9:16, 132px wide, radius 14. Vertical is the form that says
 *   swipe. Poster identity sits bottom-left over the scrim. NO DURATION BADGE:
 *   every clip in the rail is short by definition, so the number distinguishes
 *   nothing and only adds furniture to a small tile.
 *
 * ABSENT VALUES RENDER NOTHING. Zero likes render no heart and no "0" — a zero
 * beside a heart reads as a verdict on the video rather than as missing data.
 * An untagged post renders no course chip and reserves NO height for one, so a
 * tagged and an untagged tile are exactly the same size.
 *
 * AUTOPLAY is muted, looping, controls-free and playsInline, and only ever for
 * the ONE tile the page-wide coordinator elects. The poster frame is the resting
 * state in every other case: reduced motion, Save-Data, off-screen, not elected,
 * or a media failure.
 */

/** Video tile width, px. */
export const VIDEO_TILE_W = 268;
/** Clip tile width, px. */
export const CLIP_TILE_W = 132;
const RADIUS = 14;

/** Three animated bars — the playing marker. Visible without sound. */
function PlayingBars() {
  return (
    <span className="media-rail-bars" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

/**
 * Course tag, top-left over the media. Renders ONLY for a tagged post (six posts
 * in 242), never as a placeholder.
 */
function CourseTag({ name }: { name: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        maxWidth: 'calc(100% - 16px)',
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'lowercase',
        color: '#FFFFFF',
        textShadow: '0 1px 6px rgba(0,0,0,0.55)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        pointerEvents: 'none',
      }}
    >
      {name}
    </span>
  );
}

/** Poster frame + the elected tile's muted looping video, in the same box. */
function TileMedia({
  item,
  railVisible,
  radius,
  children,
}: {
  item: CommunityVideo;
  railVisible: boolean;
  radius: number;
  children?: (playing: boolean) => React.ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const mountVideo =
    railVisible && !!item.hlsUrl && !failed && !autoplayBlocked(reducedMotion);

  // ONE question, answered above BOTH rails: may this tile be playing now?
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = hostRef.current;
    if (!mountVideo || !el) return;
    return registerRailVideo(el, setActive);
  }, [mountVideo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !item.hlsUrl || !active) return;
    const attachment = attachTileHls(v, item.hlsUrl, () => setFailed(true));
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => setPlaying(false));
    return () => {
      setPlaying(false);
      attachment.detach();
    };
  }, [active, item.hlsUrl]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: radius,
        overflow: 'hidden',
        background: '#0E1216',
      }}
    >
      {item.thumbnail && (
        <img
          src={item.thumbnail}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      {mountVideo && (
        <span ref={hostRef} style={{ position: 'absolute', inset: 0 }}>
          <video
            ref={videoRef}
            poster={item.thumbnail ?? undefined}
            muted
            loop
            playsInline
            webkit-playsinline="true"
            preload="none"
            disableRemotePlayback
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={(e) => {
              // Our own teardown removes src and calls load(), which Chrome
              // reports as an error. That is not a failed media load.
              const el = e.currentTarget as HTMLVideoElement;
              setPlaying(false);
              if (!el.getAttribute('src')) return;
              setFailed(true);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        </span>
      )}
      {children?.(playing)}
    </div>
  );
}

interface TileProps {
  item: CommunityVideo;
  railVisible: boolean;
  onPress: (item: CommunityVideo) => void;
  /**
   * OPTIONAL width override for the /community destination, where the same tiles
   * run full width (the featured film, the video rows) or fill a grid cell (the
   * clips grid). Absent = the shipped rail width, so Discover is unchanged.
   */
  width?: number | string;
  /**
   * OPTIONAL aspect (width / height) for the clip tile. The /community clip
   * mosaic passes the media's TRUE aspect so a landscape clip renders
   * landscape. Absent = the shipped 9/16 rail shape, so Discover is unchanged.
   */
  aspect?: number;
}

export function CommunityVideoTile({ item, railVisible, onPress, width }: TileProps) {
  // WHEN content IS EMPTY the poster's name takes the title slot and the meta
  // row drops the duplicate name, keeping the time and the likes.
  const hasTitle = item.title.length > 0;
  const title = hasTitle ? item.title : item.displayName;
  const when = formatRelativeRounded(item.createdAt);
  const meta = hasTitle ? `${item.displayName} · ${when}` : when;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPress(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPress(item);
        }
      }}
      style={{
        flex: width === undefined ? `0 0 ${VIDEO_TILE_W}px` : '1 1 auto',
        width: width ?? VIDEO_TILE_W,
        minWidth: 0,
        padding: 0,
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
        <TileMedia item={item} railVisible={railVisible} radius={RADIUS}>
          {(playing) => (
            <>
              {item.courseName && <CourseTag name={item.courseName} />}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: '#FFFFFF',
                  background: 'rgba(10,14,10,0.62)',
                  borderRadius: 6,
                  padding: '2px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  pointerEvents: 'none',
                }}
              >
                {formatDuration(item.durationSeconds)}
                {playing && <PlayingBars />}
              </span>
            </>
          )}
        </TileMedia>
      </div>

      <div
        style={{
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: '-0.012em',
          color: A.INK,
          lineHeight: 1.28,
          margin: '8px 0 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 4,
        }}
      >
        {item.avatarUrl ? (
          <img
            src={item.avatarUrl}
            alt=""
            loading="lazy"
            style={{
              width: 16,
              height: 16,
              borderRadius: '34%',
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.10)',
            }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              width: 16,
              height: 16,
              borderRadius: '34%',
              flexShrink: 0,
              background: A.BORDER,
            }}
          />
        )}
        <span
          style={{
            flex: 1,
            fontSize: 11.5,
            color: A.MUTE,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {meta}
        </span>
        {/* ZERO RENDERS NOTHING — no heart, no "0". The row rebalances. */}
        {item.likeCount > 0 && (
          <span
            style={{
              marginLeft: 'auto',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11.5,
              color: A.DIM,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            <Heart size={11} strokeWidth={2.4} />
            {item.likeCount}
          </span>
        )}
      </div>
    </div>
  );
}

export function CommunityClipTile({ item, railVisible, onPress, width, aspect }: TileProps) {
  return (
    <button
      type="button"
      onClick={() => onPress(item)}
      style={{
        flex: width === undefined ? `0 0 ${CLIP_TILE_W}px` : '1 1 auto',
        width: width ?? CLIP_TILE_W,
        minWidth: 0,
        aspectRatio: aspect ? `${aspect}` : '9 / 16',
        padding: 0,
        border: 'none',
        background: 'transparent',
        borderRadius: RADIUS,
        cursor: 'pointer',
      }}
    >
      <TileMedia item={item} railVisible={railVisible} radius={RADIUS}>
        {(playing) => (
          <>
            {/* The scrim gains a TOP stop so the course tag stays legible on a
                bright frame; the bottom stop carries the identity line. */}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(10,14,10,0.42) 0%, rgba(10,14,10,0) 28%, rgba(10,14,10,0) 52%, rgba(10,14,10,0.62) 100%)',
              }}
            />
            {item.courseName && <CourseTag name={item.courseName} />}
            <span
              style={{
                position: 'absolute',
                left: 8,
                right: 8,
                bottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt=""
                  loading="lazy"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '34%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)',
                  }}
                />
              ) : null}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                  textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                }}
              >
                {item.displayName}
              </span>
              {/* NO DURATION CHIP HERE — the bars stand alone, bottom-right. */}
              {playing && (
                <span style={{ marginLeft: 'auto', flexShrink: 0, display: 'inline-flex' }}>
                  <PlayingBars />
                </span>
              )}
            </span>
          </>
        )}
      </TileMedia>
    </button>
  );
}
