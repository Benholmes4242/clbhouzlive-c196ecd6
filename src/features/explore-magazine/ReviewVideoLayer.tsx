import { useEffect, useRef, useState } from 'react';

import { autoplayBlocked, registerReviewVideo } from '@/components/explore-tab-new/courseled/reviewVideoAutoplay';
import { attachTileHls } from '@/components/explore-tab-new/courseled/tileHlsPlayer';
import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * THE REVIEW TILE'S VIDEO LAYER (BRIEF_EXPLORE_REVIEW_TILE_VIDEO).
 *
 * MediaRailTile's implementation, transplanted — not a second one. The element
 * attributes, the group election, the HLS attachment, the reduced-motion /
 * Save-Data gate and the poster→video crossfade are all that tile's, verbatim.
 * What is NEW here is only the CALLER-side arithmetic the duration badge's
 * docstring anticipates: a countdown while the video plays.
 *
 * THE GROUP IS THE PAGE'S EXISTING `amateur-magazine` (§3.2) — one budget per
 * page, shared with the clips rail. MEASUREMENT WORTH KNOWING: a group's
 * threshold and budget are fixed by its FIRST registrant
 * (reviewVideoAutoplay.groupFor), so `maxPlaying: 1` only binds when a review
 * tile mounts before the clips rail; otherwise the rail's 2 stands. Changing
 * that would mean touching reviewVideoAutoplay, which this brief forbids.
 *
 * NO PLAY GLYPH, IN ANY STATE (§3.5) — including reduced motion, Save-Data and
 * a still-loading poster. An autoplaying tile that says "tap to play" is untrue:
 * the tap opens the review. The duration badge is what says "this is a video".
 */
export function ReviewVideoLayer({
  hlsUrl,
  posterUrl,
  durationS,
  autoplayGroup = 'amateur-magazine',
}: {
  hlsUrl: string;
  posterUrl: string | null;
  durationS: number | null;
  autoplayGroup?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const mountVideo = !!hlsUrl && !failed && !autoplayBlocked(reducedMotion);

  useEffect(() => {
    const el = hostRef.current;
    if (!mountVideo || !el) return;
    /* §3.3 maxPlaying 1 — a review tile is 342px on an 844px screen, so two can
       be half-visible at once. The rails' default of 2 suits their 176px tiles. */
    return registerReviewVideo(autoplayGroup, el, setActive, { threshold: 0.5, maxPlaying: 1 });
  }, [mountVideo, autoplayGroup]);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video || !hlsUrl) return;
    const attachment = attachTileHls(video, hlsUrl, () => setFailed(true));
    video.muted = true;
    video.currentTime = 0;
    const play = video.play();
    play?.catch(() => setPlaying(false));
    return () => {
      setPlaying(false);
      setRemaining(null);
      video.pause();
      video.currentTime = 0;
      attachment.detach();
    };
  }, [active, hlsUrl]);

  /* §2.3/§2.4 — CLAMPED AT ONE because the badge returns null on a falsy value
     and the video LOOPS: an unclamped count would hit 0 and the badge would
     blink out and back on every lap. Set state only when the whole second
     changes, or `timeupdate` re-renders the card several times a second. */
  const onTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const total = durationS ?? video.duration;
    if (!total || !Number.isFinite(total)) return;
    const next = Math.max(1, Math.ceil(total - video.currentTime));
    setRemaining((prev) => (prev === next ? prev : next));
  };

  const shown = playing && remaining != null ? remaining : durationS;

  return (
    <>
      <span
        ref={hostRef}
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        {mountVideo && (
          <video
            ref={videoRef}
            poster={posterUrl ?? undefined}
            muted
            loop
            playsInline
            preload="none"
            disableRemotePlayback
            aria-hidden
            tabIndex={-1}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={onTimeUpdate}
            onError={(event) => {
              if (event.currentTarget.getAttribute('src')) setFailed(true);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: playing ? 1 : 0,
              transition: 'opacity 140ms linear',
              /* The card is one tap target; the video must never take the press. */
              pointerEvents: 'none',
            }}
          />
        )}
      </span>
      {/* BOTTOM RIGHT, the Clubhouse feed card's exact badge: same
          GlassDurationBadge, same fontSize 9.5, same 6px inset (its defaults).
          The countdown comes from this caller's `seconds` — the badge itself
          is untouched. (Supersedes §1.3's top-right; Ben's call.) */}
      <GlassDurationBadge seconds={shown} fontSize={9.5} />
    </>
  );
}

export default ReviewVideoLayer;
