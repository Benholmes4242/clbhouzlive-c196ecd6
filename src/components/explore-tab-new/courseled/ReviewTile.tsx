import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from './CourseImageFallback';
import { ReactionAction } from './ReactionAction';

import { SANS, FIGS, NEW_CARD_RING } from './tokens';
import type { LatestReview } from './hooks/useLatestReviews';

/**
 * REVIEW TILE — mosaic tile (BRIEF_REVIEW_TILE_LIGHTER).
 *
 * Photo-led tile with its text on the photograph. The course name IS the
 * headline; the quote no longer appears here (it lives in the review sheet).
 * Every tile is the SAME fixed height regardless of how the name wraps.
 *
 * Image chain: the review's own first photo -> the course image (via
 * CourseImageFallback) -> the deterministic gradient. Video reviews use their
 * poster.
 *
 * The score chip is WHITE, not band-coloured: band colours do not survive on
 * photography. The band colour lives in the review sheet.
 */

export const REVIEW_TILE_HEIGHT = 186;

const SCRIM = 'linear-gradient(0deg, rgba(10,14,10,0.88) 0%, rgba(10,14,10,0.06) 38%)';
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
}: Props) {

  const { t } = useTranslation('courses');

  const isVideo = r.mediaType === 'video';
  const ownImage = isVideo ? r.posterUrl : r.mediaUrl;
  const imageUrl = ownImage ?? r.courseImage ?? null;
  const reviewer = r.reviewerName || t('discover.reviews.someone', 'A member');

  return (
    <button
      type="button"
      onClick={() => onPress(r)}
      style={{
        ...(isNew ? NEW_CARD_RING : null),
        position: 'relative',
        height,
        padding: 0,
        border: 'none',
        borderRadius: radius,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: SANS,
        textAlign: 'left',
        display: 'block',
        width: '100%',
      }}
    >
      <CourseImageFallback
        courseId={r.courseId}
        courseName={r.courseName}
        imageUrl={imageUrl}
        initialsSize={28}
        style={{ position: 'absolute', inset: 0 }}
      >
        <div style={{ position: 'absolute', inset: 0, background: SCRIM }} />

        {/* SCORE CHIP — same glass badge, clbhouz mark then the rating. */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 999,
            background: 'rgba(10,14,10,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <img
            src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
            alt=""
            aria-hidden="true"
            style={{ width: 13, height: 13, objectFit: 'contain', display: 'block' }}
          />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', ...FIGS }}>
            {r.rating.toFixed(1)}
          </span>
        </span>


        {/* REACTION — glass corner, opposite the score chip. */}
        <span style={{ position: 'absolute', top: 8, right: 10 }}>
          <ReactionAction
            tone="glass"
            hidden={reactionHidden}
            readOnly={reactionReadOnly}
            count={reactionCount}
            reacted={reacted}
            onToggle={() => onToggleReaction?.()}
            label={t('discover.reactions.actionReview', 'Like this review')}
          />
        </span>

        {/* BOTTOM BLOCK — course name as headline, then byline. */}
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.015em',
              lineHeight: 1.18,
              ...clamp(2),
            }}
          >
            {r.courseName || t('discover.unknownCourse', 'Course')}
          </div>
          <div
            style={{
              marginTop: 5,

              fontSize: 9.5,
              fontWeight: 700,
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
    </button>
  );
}

export default ReviewTile;
