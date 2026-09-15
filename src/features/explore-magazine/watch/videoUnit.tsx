import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { r } from '@/lib/radius';

import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { autoplayBlocked } from '@/components/explore-tab-new/courseled/reviewVideoAutoplay';
import { registerRailVideo } from '@/components/explore-tab-new/courseled/mediaRailAutoplay';
import { attachTileHls } from '@/components/explore-tab-new/courseled/tileHlsPlayer';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import { formatRelativeAgo } from '@/i18n/format';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { getThumbnailUrl } from '@/utils/thumbnail';

/**
 * THE LONG-FORM VIDEO UNIT — ONE UNIT, TWO SIZES (BRIEF_EXPLORE_ALL_VIDEO).
 *
 * MOVED HERE VERBATIM FROM WatchFeed.tsx, WHICH NOW IMPORTS IT. Nothing about
 * the Watch surface changed: the full-width card is the same component with the
 * same defaults. All's videos rail asks the SAME unit for its `rail` size rather
 * than getting a third video tile written for it, so the two surfaces cannot
 * drift.
 *
 * THE SHAPE IS THE TYPE. Landscape 16:9 is a video, 9:16 is a clip, a square is
 * a moment. There are NO type labels and no "VIDEO" badge in this file: a badge
 * would be the layout apologising for itself.
 */
const INSET = 16;

export function videoTitle(row: HubRpcRow, fallback: string): string {
  const stripped = row.post_content ? stripMentionMarkup(String(row.post_content)).trim() : '';
  return stripped || row.course_name || fallback;
}

export function creatorName(row: HubRpcRow): string {
  return (row.creator_display_name || row.creator_username || '').toString();
}

/**
 * THE POSTER IS DERIVED, NOT ASSUMED.
 *
 * MEASURED: both Watch RPCs DO return `poster_url` under that exact name, so
 * the field is not misnamed - but a real share of rows carry NULL in it, all of
 * them older `stream:<uid>` uploads whose poster was never written back. Every
 * one of those rows still carries `stream_id`, and Cloudflare Stream will serve
 * a frame for any uid, so the poster is derived from the stream rather than
 * left blank. Reading `poster_url` alone is what made those tiles black.
 */
export function posterFor(row: HubRpcRow, height: number): string | null {
  if (row.poster_url) return row.poster_url;
  if (row.stream_id) return getThumbnailUrl({ streamId: row.stream_id, height });
  return null;
}

/** NEVER AN EMPTY BLACK RECTANGLE. When there is no poster and when a poster
 *  404s, the tile still reads as content: a soft gradient carrying the
 *  creator's initial, at the tile's own size. */
export function PosterFallback({ initial, size }: { initial: string; size: number }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${A.PANEL} 0%, rgba(255,255,255,0.12) 100%)`,
        color: A.MUTE,
        fontFamily: SANS,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    >
      {initial}
    </span>
  );
}

/**
 * AUTOPLAY ON SCROLL — ONE STREAM ON THE PAGE, AND IT IS AN ENHANCEMENT
 * (BRIEF_EXPLORE_DEVICE_PASS §4).
 *
 * NOTHING NEW WAS WRITTEN TO COORDINATE THIS. The page already owns a
 * coordinator that does exactly what the brief asks: `mediaRailAutoplay`
 * registers every tile in ONE registry, elects the tile NEAREST THE CENTRE OF
 * THE VIEWPORT that is at least 60% visible, and gives it the only stream — so
 * two items can never play at once, and on a rail only the tile in the centre
 * plays. `reviewVideoAutoplay`'s coordinator was NOT reused here: its cap is two
 * per group, which is right for the mosaic and wrong for a scroll page.
 * `autoplayBlocked` (reduced motion, Save-Data) and `attachTileHls` are reused
 * verbatim.
 *
 * ONE REGISTRY ACROSS ALL AND WATCH. An All video card and a Watch video card
 * register with the SAME `registerRailVideo`, so a member can never have two
 * long-form frames playing at once anywhere on the page.
 *
 * THE POSTER IS THE RESTING STATE. The video fades in over it once it actually
 * plays and is removed on the way out, so a blocked, failed or losing tile is a
 * poster and never a black rectangle. Muted always, no controls: the tap still
 * opens the post, where the real player and its mute affordance live.
 */
export function AutoplayLayer({ hlsUrl, poster }: { hlsUrl: string | null; poster: string | null }) {
  const reducedMotion = usePrefersReducedMotion();
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const mount = !!hlsUrl && !failed && !autoplayBlocked(reducedMotion);

  useEffect(() => {
    const el = hostRef.current;
    if (!mount || !el) return;
    return registerRailVideo(el, setActive);
  }, [mount]);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video || !hlsUrl) return;
    const attachment = attachTileHls(video, hlsUrl, () => setFailed(true));
    video.muted = true;
    video.currentTime = 0;
    video.play()?.catch(() => setPlaying(false));
    return () => {
      setPlaying(false);
      video.pause();
      attachment.detach();
    };
  }, [active, hlsUrl]);

  if (!mount) return null;

  return (
    <span ref={hostRef} aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        muted
        loop
        playsInline
        preload="none"
        disableRemotePlayback
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={(event) => {
          if (event.currentTarget.getAttribute('src')) setFailed(true);
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: playing ? 1 : 0,
          transition: 'opacity 140ms linear',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
}

/** The HLS source for a row, or null where the row carries no stream. */
export function hlsFor(row: HubRpcRow): string | null {
  if (row.hls_url) return String(row.hls_url);
  if (row.stream_id) return generateStreamHlsUrl(String(row.stream_id));
  return null;
}

/** THE VIDEO — full-bleed width, 16:9, YouTube-shaped: a CIRCULAR 30px avatar.
 *  This is the one deliberate departure from the platform squircle standard,
 *  because a long-form video row is read as a video row and not as a member
 *  card. The brief rules it; every other avatar on Explore stays a squircle.
 *
 *  `size="rail"` IS THE SAME UNIT AT RAIL WIDTH: still 16:9, still the duration
 *  chip, still title-then-creator. It drops the avatar and the page inset, which
 *  are the two things a 200px tile has no room for, and it does NOT autoplay
 *  (see `autoplay`). */
export function VideoCard({
  row,
  onPress,
  size = 'full',
  context = 'watch',
  autoplay = size === 'full',
}: {
  row: HubRpcRow;
  onPress: () => void;
  size?: 'full' | 'rail';
  /** Watch stays full-bleed; All wears the inset magazine-card geometry. */
  context?: 'all' | 'watch';
  /** AUTOPLAY IS OPT-OUT ON THE CARD, OFF ON THE RAIL. A rail tile that played
   *  would compete with the full-width card for the page's one stream, and win
   *  it whenever the rail happened to be nearer the viewport centre. */
  autoplay?: boolean;
}) {
  const { t } = useTranslation('courses');
  const rail = size === 'rail';
  const magazine = context === 'all';
  const title = videoTitle(row, t('amateur.watch.untitled', 'Untitled video'));
  const who = creatorName(row);
  const when = formatRelativeAgo(row.post_created_at ?? null);
  /* THE META LINE CARRIES NO VIEW COUNT. There is no per-post view figure on
     posts and neither Watch RPC returns one, so the figure is DROPPED rather
     than invented from likes or impressions. */
  const meta = [who, when].filter(Boolean).join(' \u00B7 ');
  const initial = (who || '?').trim().charAt(0).toUpperCase() || '?';
  const poster = posterFor(row, rail ? 480 : 720);
  const [posterFailed, setPosterFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: 'block',
        width: '100%',
        padding: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          borderRadius: magazine ? r.md : rail ? r.sm : undefined,
          background: A.PANEL,
        }}
      >
        {poster && !posterFailed ? (
          <img
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPosterFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <PosterFallback initial={initial} size={rail ? 24 : 34} />
        )}
        {autoplay ? <AutoplayLayer hlsUrl={hlsFor(row)} poster={poster} /> : null}
        {/* The duration chip stays ABOVE the playing frame. */}
        <span style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
          <GlassDurationBadge seconds={row.duration_seconds ?? null} />
        </span>

      </div>

      <div
        style={{
          display: 'flex',
          gap: rail ? 0 : 10,
          padding: magazine ? '8px 4px 0' : rail ? '7px 0 0' : `9px ${INSET}px 0`,
          alignItems: 'flex-start',
        }}
      >
        {rail ? null : row.creator_avatar_url ? (
          <img
            src={row.creator_avatar_url}
            alt=""
            loading="lazy"
            style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: A.PANEL,
              color: A.MUTE,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initial}
          </span>
        )}
        <span style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: rail ? 12.5 : 14,
              fontWeight: 600,
              lineHeight: 1.3,
              color: A.INK,
            }}
          >
            {title}
          </span>
          {/* THE RAIL TILE NAMES THE CREATOR AND NOTHING ELSE: a date on a
              120px line would push the title to one clamped word. */}
          {rail ? (
            who ? (
              <span
                style={{
                  display: 'block',
                  marginTop: 3,
                  fontSize: 11,
                  fontWeight: 500,
                  color: A.MUTE,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {who}
              </span>
            ) : null
          ) : meta ? (
            <span
              style={{
                display: 'block',
                marginTop: 3,
                fontSize: 11.5,
                fontWeight: 500,
                color: A.MUTE,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {meta}
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

export default VideoCard;
