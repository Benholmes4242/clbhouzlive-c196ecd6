import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from './CourseImageFallback';
import { ReactionAction } from './ReactionAction';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

import { A, SANS, FIGS, LABEL, NEW_CARD_RING } from './tokens';
import { bandColor, SubScoreBar } from '@/features/courses/_shared/scoreBands';
import { autoplayBlocked, registerReviewVideo } from './reviewVideoAutoplay';
import type { LatestReview } from './hooks/useLatestReviews';

/**
 * REVIEW TILE — mosaic tile (BRIEF_REVIEW_TILE_LIGHTER).
 *
 * Photo-led tile with its text on the photograph. The course name IS the
 * headline. THE QUOTE RETURNS ON THE FEATURED TIER ONLY
 * (BRIEF_REVIEW_TILE_TIERS §2.3), partly reversing the earlier decision that
 * moved it into the review sheet: it is now a reward for a review that scored
 * 9+ overall AND 9+ on every category it filled in, not a default.
 * The PHOTO is the same fixed height on every tile regardless of how the name
 * wraps. Beneath it sits the CATEGORY BREAKDOWN (BRIEF_REVIEW_TILE_BREAKDOWN):
 * one label/track/figure row per scored category, so two courses on 8.7 no
 * longer look identical. Categories are optional in the composer, so a null
 * renders no row and a review with none renders no block at all — the tile is
 * then exactly what it was before, with no gap.
 *
 * Image chain: the review's own first photo -> the course image (via
 * CourseImageFallback) -> the deterministic gradient. Video reviews use their
 * poster, which AUTOPLAYS MUTED ON LOOP once the tile is meaningfully in view
 * (BRIEF_REVIEW_TILE_AUTOPLAY). Playback is coordinated by
 * reviewVideoAutoplay.ts, never by InlineVideo/VideoEngine: those are bound to
 * the three physical feed lanes and do not map onto a two-column grid.
 *
 * The score figure and the bars carry the app-wide member-score scale from
 * src/features/courses/_shared/scoreBands.tsx (bandColor / SubScoreBar) — the
 * same scale as the review composer, Top 100 stats and course detail. Do not
 * re-declare those hexes here. The "/10" stays white.
 *
 * The chip states its scale with a "/10" suffix; it carries no clbhouz mark
 * (a figure on a review tile can only be a rating).

 */

export const REVIEW_TILE_HEIGHT = 186;
/** FEATURED photo height (§2.1). The tile is full width, so the photo is taller. */
export const REVIEW_TILE_FEATURED_HEIGHT = 196;

/**
 * THE THREE TIERS (BRIEF_REVIEW_TILE_TIERS §1). Nothing about the tile's design
 * changes — the tier only decides which treatment the breakdown block gets.
 *
 *   FEATURED  overall >= 9 AND every SCORED category >= 9  -> quote + bars
 *   BARS      overall >= 9                                  -> today's tile
 *   COMPACT   overall < 9                                   -> figures, no bars
 *
 * A review with NO categories can never be FEATURED: there is nothing to clear
 * the bar. It falls to BARS or COMPACT on its overall alone and keeps its
 * breakdown block absent in both, exactly as today (§1.3).
 */
export type ReviewTier = 'featured' | 'bars' | 'compact';

const TIER_FLOOR = 9;

export function reviewTier(r: LatestReview): ReviewTier {
  if (r.rating < TIER_FLOOR) return 'compact';
  const scored = [
    r.breakdown?.design,
    r.breakdown?.conditions,
    r.breakdown?.clubhouse,
    r.breakdown?.facilities,
  ].filter((v): v is number => v != null && !Number.isNaN(Number(v)));
  if (scored.length > 0 && scored.every((v) => v >= TIER_FLOOR)) return 'featured';
  return 'bars';
}

const SCRIM = 'linear-gradient(0deg, rgba(10,14,10,0.88) 0%, rgba(10,14,10,0.06) 30%)';
/** On-dark amber: the viewing member's own name. Not #F7931E on photography. */
const AMBER_ON_DARK = '#FFB25E';



function relativeAge(iso: string, t: (k: string, o?: any) => string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return t('discover.when.today', 'Today');
  if (days === 1) return t('discover.when.yesterday', 'Yesterday');
  if (days < 7) return t('discover.when.daysAgo', { defaultValue: '{{count}} days ago', count: days });
  if (days < 14) return t('discover.when.lastWeek', 'Last week');
  if (days < 60)
    return t('discover.when.weeksAgo', { defaultValue: '{{count}}w ago', count: Math.floor(days / 7) });
  return t('discover.when.monthsAgo', {
    defaultValue: '{{count}}mo ago',
    count: Math.max(1, Math.round(days / 30)),
  });
}

function clamp(lines: number): React.CSSProperties {
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
  } as React.CSSProperties;
}

interface Props {
  review: LatestReview;
  /** True when the reviewer is the viewing member (name renders amber). */
  isOwn?: boolean;
  /** True when the review arrived since the member last left Discover. */
  isNew?: boolean;
  onPress: (r: LatestReview) => void;
  height?: number;
  radius?: number;
  /** Reaction control (BRIEF_DISCOVER_REACTIONS). Hidden by default. */
  reactionHidden?: boolean;
  reactionReadOnly?: boolean;
  reactionCount?: number;
  reacted?: boolean;
  onToggleReaction?: () => void;
  /**
   * Autoplay coordination group. Each group carries its own two-at-once cap.
   * Pass a stable key per surface ('discover-reviews' | 'reviews-sheet').
   */
  autoplayGroup?: string;
  /**
   * Treatment. Omitted = derived from the review itself, so a caller that does
   * not care about tiers behaves exactly as before.
   */
  tier?: ReviewTier;
}


export function ReviewTile({
  review: r,
  isOwn = false,
  isNew = false,
  onPress,
  height = REVIEW_TILE_HEIGHT,
  radius = 14,
  reactionHidden = true,
  reactionReadOnly = false,
  reactionCount = 0,
  reacted = false,
  onToggleReaction,
  autoplayGroup = 'discover-reviews',
  tier,
}: Props) {

  const { t } = useTranslation('courses');

  /* The tier decides the BREAKDOWN treatment and nothing else. */
  const resolvedTier = tier ?? reviewTier(r);
  const isFeatured = resolvedTier === 'featured';
  const photoH =
    isFeatured && height === REVIEW_TILE_HEIGHT ? REVIEW_TILE_FEATURED_HEIGHT : height;

  const isVideo = r.mediaType === 'video';
  const ownImage = isVideo ? r.posterUrl : r.mediaUrl;
  const imageUrl = ownImage ?? r.courseImage ?? null;
  const reviewer = r.reviewerName || t('discover.reviews.someone', 'A member');

  const reducedMotion = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reduced motion / Save-Data mount NO video element at all: poster only.
  const mountVideo = isVideo && !!r.mediaUrl && !failed && !autoplayBlocked(reducedMotion);

  // The coordinator answers one question: may this tile be playing right now?
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = hostRef.current;
    if (!mountVideo || !el) return;
    return registerReviewVideo(autoplayGroup, el, setActive);
  }, [mountVideo, autoplayGroup]);

  // ACTIVE -> load and play. INACTIVE -> pause AND release the buffers, so an
  // off-screen tile in a 100-tile sheet costs nothing again.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      if (v.getAttribute('src') !== r.mediaUrl) {
        v.setAttribute('src', r.mediaUrl as string);
      }
      v.preload = 'auto';
      v.muted = true;
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        // A rejected play() is not an error worth surfacing: the poster and the
        // play glyph are already the correct fallback.
        p.catch(() => setPlaying(false));
      }
    } else {
      v.pause();
      setPlaying(false);
      if (v.getAttribute('src')) {
        v.removeAttribute('src');
        v.load();
      }
      v.preload = 'none';
    }
  }, [active, r.mediaUrl]);

  // BREAKDOWN ROWS — only the categories the member actually scored. Nulls are
  // the common case in the composer, so an absent category is simply absent:
  // no empty track, no zero, no "n/a".
  const rows = (
    [
      // SAME KEYS AS Top100CourseStatsPanel — the two surfaces render these
      // labels through the same SubScoreBar, so they cannot drift and every
      // language comes free.
      ['design', t('top100.stats.design', 'Design'), r.breakdown?.design],
      ['conditions', t('top100.stats.condition', 'Condition'), r.breakdown?.conditions],
      ['clubhouse', t('top100.stats.clubhouse', 'Clubhouse'), r.breakdown?.clubhouse],
      ['facilities', t('top100.stats.facilities', 'Facilities'), r.breakdown?.facilities],
    ] as Array<[string, string, number | null | undefined]>
  )
    .filter((row): row is [string, string, number] => row[2] != null && !Number.isNaN(Number(row[2])))
    .map(([key, label, value]) => ({ key, label, value: Number(value) }));

  return (
    <button
      type="button"
      onClick={() => onPress(r)}
      style={{
        ...(isNew ? NEW_CARD_RING : null),
        position: 'relative',
        padding: 0,
        border: 'none',
        borderRadius: radius,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: SANS,
        textAlign: 'left',
        display: 'block',
        width: '100%',
        background: A.PANEL,
      }}
    >
      <span
        data-testid="review-tile-photo"
        style={{ position: 'relative', display: 'block', height: photoH }}
      >
      <CourseImageFallback
        courseId={r.courseId}
        courseName={r.courseName}
        imageUrl={imageUrl}
        initialsSize={28}
        style={{ position: 'absolute', inset: 0 }}
      >

        {/* VIDEO COVER — muted, looping, playsInline. Same box as the poster,
            so the first frame cannot shift the layout. The poster stays
            visible until that frame paints: no flash of black. */}
        {mountVideo && (
          <span ref={hostRef} className="review-tile-video" style={{ position: 'absolute', inset: 0 }}>
            <video
              ref={videoRef}
              poster={r.posterUrl ?? undefined}
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
              onPause={() => setPlaying(false)}
              onError={(e) => {
                // RELEASING a tile (src removed, then load()) makes Chrome fire
                // a synthetic error with an empty src. That is our own teardown,
                // NOT a failed media load — treating it as one would strand the
                // tile on its poster for good.
                const el = e.currentTarget as HTMLVideoElement;
                setPlaying(false);
                if (!el.getAttribute('src')) return;
                // A real failure: fall back to the existing image chain, never a
                // black box.
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

        <div style={{ position: 'absolute', inset: 0, background: SCRIM }} />

        {/* PLAY GLYPH — a "tap to play" affordance, so it is hidden WHILE
            playing and shown in every non-playing state (reduced motion,
            Save-Data, off-screen, over the two-at-once cap, load failure). */}
        {isVideo && !playing && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 34,
              height: 34,
              borderRadius: 999,
              background: 'rgba(10,14,10,0.46)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Play size={15} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
          </span>
        )}

        {/* SCORE CHIP — GLASS, matching the friends rail, the standout tiles
            and the tour tiles. The flat, higher-opacity fill is the BASE and
            the blur is the @supports enhancement: this chip sits over a
            photograph and unreadable is the failure mode. */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
        <span
          className="review-tile-chip"
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 2,
            padding: '5px 10px',
            borderRadius: 10,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: bandColor(r.rating),
              letterSpacing: '-0.02em',
              lineHeight: 1,
              ...FIGS,
            }}
          >
            {r.rating.toFixed(1)}
          </span>
          <span style={{ ...LABEL, fontSize: 6.5, color: 'rgba(255,255,255,0.62)' }}>/10</span>
        </span>

        {/* THE FEATURED MARK (§2.5). In the 9+ green with white text — the only
            tier badge on the page. */}
        {isFeatured && (
          <span
            style={{
              ...LABEL,
              fontSize: 7,
              color: '#FFFFFF',
              background: bandColor(10),
              borderRadius: 999,
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            {t('discover.reviews.featured', 'Featured')}
          </span>
        )}
        </span>



        {/* REACTION — glass corner, opposite the score chip. The count column
            is RESERVED so the glyph lands on the same x on every tile,
            including the tiles at zero. */}
        <span style={{ position: 'absolute', top: 8, right: 10 }}>
          <ReactionAction
            tone="glass"
            hidden={reactionHidden}
            readOnly={reactionReadOnly}
            count={reactionCount}
            reacted={reacted}
            onToggle={() => onToggleReaction?.()}
            reserveCount
            label={t('discover.reactions.actionReview', 'Like this review')}
          />
        </span>

        {/* BOTTOM BLOCK — course name as headline (two lines maximum, so a long
            club name cannot crowd the byline), then the byline. */}
        <div style={{ position: 'absolute', left: 13, right: 13, bottom: 11 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.025em',
              lineHeight: 1.12,
              ...clamp(2),
            }}
          >
            {r.courseName || t('discover.unknownCourse', 'Course')}
          </div>
          <div
            style={{
              ...LABEL,
              fontSize: 7,
              marginTop: 5,
              color: 'rgba(255,255,255,0.62)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ color: isOwn ? AMBER_ON_DARK : 'inherit' }}>{reviewer}</span>
            {' \u00b7 '}
            <span style={FIGS}>{relativeAge(r.at, t)}</span>
          </div>
        </div>

      </CourseImageFallback>
      </span>

      {/* BREAKDOWN — the four category scores, already on the row and never
          rendered until now. The ROW is scoreBands' shipped SubScoreBar (the
          same component the review composer uses), so the label/track/figure
          metrics and the band colour come from there, not from this file.
          A null category RENDERS NO ROW; a review with no categories at all
          renders NO BLOCK and no gap. */}
      {rows.length > 0 && (
        <div
          data-testid="review-tile-breakdown"
          style={{ padding: '8px 11px 9px', display: 'grid', rowGap: 6 }}
        >
          {rows.map((row) => (
            <SubScoreBar key={row.key} label={row.label} score={row.value} />
          ))}
        </div>
      )}
    </button>

  );
}

export default ReviewTile;
