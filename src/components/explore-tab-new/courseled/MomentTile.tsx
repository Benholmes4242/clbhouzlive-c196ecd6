import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

import { CourseImageFallback } from './CourseImageFallback';
import type { Moment } from './hooks/useMomentsOfTheWeek';
import { autoplayBlocked, registerReviewVideo } from './reviewVideoAutoplay';
import { attachTileHls } from './tileHlsPlayer';
import { handOffTilePosition, momentResumeKey } from './tilePositionHandoff';

/**
 * MOMENT TILE — the one tile used by BOTH the page mosaic and the sheet grid,
 * so the course label, scrim and 28px glass play glyph on video can never
 * diverge between the two surfaces.
 *
 * AUTOPLAY (BRIEF_MOMENT_TILE_AUTOPLAY). Video tiles play muted and loop, under
 * exactly the review tiles' rules and the SAME coordinator instance
 * (reviewVideoAutoplay) — one behaviour for one thing, one concurrency ceiling
 * of two per group rather than a second one invented here.
 *
 * THE PLAY GLYPH is an affordance and hides while playing. THE DURATION BADGE
 * is a fact about the clip and stays in every state; on a looping tile it is
 * the only thing telling a member how long the clip actually is.
 *
 * A tap still opens the fullscreen viewer at the tapped media index, and now
 * hands over the tile's live position so the viewer carries on rather than
 * restarting.
 */

export function MomentPlayGlyph() {
  return (
    <span
      aria-hidden
      /* SAME GLASS AS THE FIGURE CHIP (liquid-glass.css): flat base fill, blur
         as an @supports enhancement. */
      className="standout-figure-chip"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 28,
        height: 28,
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <svg width={11} height={11} viewBox="0 0 24 24" fill="#fff">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

interface TileProps {
  moment: Moment;
  onPress: (m: Moment) => void;
  radius: number;
  initialsSize: number;
  labelSize: number;
  labelInset: number;
  scrimStop: string;
  /**
   * FALSE drops the course label AND the scrim together — the scrim exists only
   * to keep the label legible, so without a label it is just a dark wash over a
   * photograph. Used by the SHEET, where the course name is a group header and
   * restating it on every tile says nothing new. Defaults TRUE so the page
   * mosaic is untouched.
   */
  labelled?: boolean;
  /**
   * Concurrency group. The page and the sheet never scroll together (the sheet
   * covers the page, and a covered tile is out of view by definition), so each
   * gets its own two-at-once cap.
   */
  autoplayGroup?: string;
  /**
   * FALSE keeps the poster and the play glyph, no video element. Used for tiles
   * too small for moving video to read as anything but flicker — see the 81px
   * finding in the sheet.
   */
  autoplay?: boolean;
  style?: React.CSSProperties;
}

export function MomentTile({
  moment: m,
  onPress,
  radius,
  initialsSize,
  labelSize,
  labelInset,
  scrimStop,
  labelled = true,
  autoplayGroup = 'moments-page',
  autoplay = true,
  style,
}: TileProps) {
  const { t } = useTranslation('courses');
  const isVideo = m.mediaType === 'video';
  // Video only, and only when the duration is actually known: absent renders
  // nothing at all (no placeholder, no reserved space).
  const durationLabel =
    isVideo && m.durationSeconds ? formatDuration(m.durationSeconds) : '';

  // The manifest for THIS tile's media. Moments carry no progressive file, so
  // this is the only playable source (see tileHlsPlayer).
  const hlsUrl = m.post.mediaItems?.[m.mediaIndex ?? 0]?.hlsUrl ?? null;
  const resumeKey = momentResumeKey(m.post.id, m.mediaIndex);

  const reducedMotion = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reduced motion / Save-Data mount NO video element at all: poster only.
  const mountVideo =
    isVideo && autoplay && !!hlsUrl && !failed && !autoplayBlocked(reducedMotion);

  // The coordinator answers one question: may this tile be playing right now?
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = hostRef.current;
    if (!mountVideo || !el) return;
    return registerReviewVideo(autoplayGroup, el, setActive);
  }, [mountVideo, autoplayGroup]);

  // ACTIVE -> attach and play. INACTIVE -> capture the position, then pause AND
  // release everything, so an off-screen tile in a 100-tile sheet costs nothing.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hlsUrl) return;
    if (!active) return;

    const attachment = attachTileHls(v, hlsUrl, () => setFailed(true));
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      // A rejected play() is not an error worth surfacing: the poster and the
      // play glyph are already the correct fallback.
      p.catch(() => setPlaying(false));
    }
    return () => {
      // CAPTURE ON SCROLL-OUT, before the element is torn down — after detach
      // currentTime is gone.
      handOffTilePosition(resumeKey, v.currentTime);
      setPlaying(false);
      attachment.detach();
    };
  }, [active, hlsUrl, resumeKey]);

  return (
    <button
      type="button"
      onClick={() => {
        // CAPTURE ON TAP. The viewer reads lastPos synchronously while opening,
        // so this write has to land first.
        const v = videoRef.current;
        if (v) handOffTilePosition(resumeKey, v.currentTime);
        onPress(m);
      }}
      style={{
        position: 'relative',
        padding: 0,
        border: 'none',
        borderRadius: radius,
        overflow: 'hidden',
        cursor: 'pointer',
        ...style,
      }}
    >
      <CourseImageFallback
        courseId={m.courseId}
        courseName={m.courseName}
        imageUrl={m.thumbnail}
        initialsSize={initialsSize}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* VIDEO — muted, looping, playsInline, in the SAME box as the poster,
            so the first frame cannot shift the layout. The poster stays visible
            until that frame paints: no flash of black. */}
        {mountVideo && (
          <span
            ref={hostRef}
            className="review-tile-video"
            style={{ position: 'absolute', inset: 0 }}
          >
            <video
              ref={videoRef}
              poster={m.thumbnail ?? undefined}
              muted
              loop
              playsInline
              // Legacy iOS attribute: required alongside playsInline or older
              // WKWebView builds still go fullscreen.
              webkit-playsinline="true"
              preload="none"
              disableRemotePlayback
              aria-hidden="true"
              tabIndex={-1}
              onPlaying={() => setPlaying(true)}
              onPause={(e) => {
                // CAPTURE ON PAUSE.
                handOffTilePosition(resumeKey, e.currentTarget.currentTime);
                setPlaying(false);
              }}
              onError={(e) => {
                // Releasing a tile (src removed, then load()) makes Chrome fire
                // a synthetic error with an empty src. That is our own teardown,
                // NOT a failed media load.
                const el = e.currentTarget as HTMLVideoElement;
                setPlaying(false);
                if (!el.getAttribute('src')) return;
                // A real failure: fall back to the image chain, never a black box.
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

        {labelled && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(0deg, rgba(10,14,10,0.6) 0%, rgba(10,14,10,0) ${scrimStop})`,
            }}
          />
        )}
        {(labelled || durationLabel) && (
          <div
            style={{
              position: 'absolute',
              left: labelInset,
              right: labelInset,
              bottom: labelInset - 1,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 6,
            }}
          >
            {labelled && (
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: labelSize,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                  textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                }}
              >
                {m.courseName ?? t('discover.unknownCourse', 'Course')}
              </span>
            )}
            {/* DURATION BADGE — present in EVERY state, playing or not. */}
            {durationLabel && (
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  marginLeft: 'auto',
                  background: 'rgba(10,14,10,0.5)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  color: '#FFFFFF',
                  fontSize: 9.5,
                  fontWeight: 700,
                  borderRadius: 5,
                  padding: '2px 5px',
                  letterSpacing: 0,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  pointerEvents: 'none',
                }}
              >
                {durationLabel}
              </span>
            )}
          </div>
        )}
        {/* PLAY GLYPH — hidden WHILE playing, restored in every non-playing
            state (reduced motion, Save-Data, off-screen, over the cap, failure). */}
        {isVideo && !playing && <MomentPlayGlyph />}
      </CourseImageFallback>
    </button>
  );
}

export default MomentTile;
