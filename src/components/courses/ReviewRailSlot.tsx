/**
 * SLOT A — "What members say": a horizontal rail of three compact reviews,
 * placed between the course cards on the Courses browse.
 *
 * WHY IT LOOKS NOTHING LIKE THE DISCOVER MOSAIC: that mosaic is 265px
 * photo-led tiles, and alternating those with the course cards — which are
 * ALSO full-bleed photographs with glass chips — would put two card systems on
 * one page. These panels use a PANEL surface rather than a card surface and
 * carry NO photograph, so the photography stays on the courses.
 *
 * Presentation only. Placement and selection belong to reviewSlots.ts.
 */

import { CourseNameLink } from '@/components/shared/CourseNameLink';
import React from 'react';
import { MentionText } from '@/components/mentions/MentionText';
import { useTranslation } from 'react-i18next';

import { HAIRLINE_INK_8, INK, INK_FAINT, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import { A, LABEL, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

/* Panel geometry, read by the panel AND its shell (BRIEF_COURSES_SKELETONS 2.3). */
export const CARD_W = 244;
export const REVIEW_RADIUS = 14;
export const REVIEW_PAD = 12;
export const REVIEW_GAP = 10;
export const REVIEW_RAIL_X = 20;
export const REVIEW_RATING_SIZE = 17;
export const REVIEW_NAME = { marginTop: 8, size: 13.5, lineHeight: 1.25 } as const;
export const REVIEW_QUOTE = { marginTop: 6, size: 12.5, lineHeight: 1.45 } as const;
export const REVIEW_FOOT = { marginTop: 12, avatar: 20 } as const;

const FIGS: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
};

const clamp = (lines: number): React.CSSProperties => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: lines,
  overflow: 'hidden',
});

function Reviewer({ r }: { r: LatestReview }) {
  const { t } = useTranslation('courses');
  const name = r.reviewerName || t('discover.reviews.member', 'A member');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
      <SquircleAvatar src={r.reviewerAvatar} userId={r.userId} alt={name} size={REVIEW_FOOT.avatar} hairlineRing />
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: INK_MUTE,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </span>
    </div>
  );
}

interface Props {
  reviews: LatestReview[];
  onReviewPress: (r: LatestReview) => void;
}

export const ReviewRailSlot: React.FC<Props> = ({ reviews, onReviewPress }) => {
  const { t } = useTranslation('courses');
  if (reviews.length === 0) return null;

  return (
    <section>
      <div
        style={{
          display: 'flex',
          gap: REVIEW_GAP,
          overflowX: 'auto',
          padding: `0 ${REVIEW_RAIL_X}px`,
          scrollbarWidth: 'none',
        }}
      >
        {reviews.map((r) => (
          // CB69 — non-button tile so the course name can be a real button.
          <div
            key={r.reviewId}
            role="button"
            tabIndex={0}
            onClick={() => onReviewPress(r)}
            onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onReviewPress(r);
                    }
            }}
            style={{
              width: CARD_W,
              flexShrink: 0,
              textAlign: 'left',
              background: SURFACE,
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: REVIEW_RADIUS,
              padding: REVIEW_PAD,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span
                style={{
                  ...FIGS,
                  fontSize: REVIEW_RATING_SIZE,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: courseSubScoreTone(r.rating),
                }}
              >
                {r.rating.toFixed(1)}
              </span>
              <span style={{ ...LABEL, color: INK_FAINT }}>
                {t('statBrowse.reviews.outOfTen')}
              </span>
            </div>

            <CourseNameLink
              as="div"
              courseId={r.courseId}
              textProps={{ 'data-review-rail-course': '' }}
              wrapperStyle={{ marginTop: REVIEW_NAME.marginTop }}
              style={{
                ...(r.courseId ? null : { marginTop: REVIEW_NAME.marginTop }),
                fontSize: REVIEW_NAME.size,
                fontWeight: 700,
                lineHeight: REVIEW_NAME.lineHeight,
                color: INK,
                ...clamp(2),
              }}
            >
              {r.courseName}
            </CourseNameLink>

            <p
              style={{
                marginTop: REVIEW_QUOTE.marginTop,
                fontSize: REVIEW_QUOTE.size,
                lineHeight: REVIEW_QUOTE.lineHeight,
                color: INK_MUTE,
                ...clamp(3),
              }}
            >
              <MentionText text={r.quote} disableNavigation />
            </p>

            <div style={{ marginTop: REVIEW_FOOT.marginTop }}>
              <Reviewer r={r} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewRailSlot;
