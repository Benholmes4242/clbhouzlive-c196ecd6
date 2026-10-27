/**
 * SLOT B — one featured review, full width, NO PHOTOGRAPH.
 *
 * The panel uses a PANEL surface rather than a card surface and carries no
 * photograph, so the photography stays on the courses. Score leads at 30px in its band colour,
 * the prose carries at 15px, and the four sub-scores close it as an even
 * four-up on 3px tracks (scoreBands' shipped SubScoreStack — never a local copy
 * of the scale).
 *
 * Only a review over 200 characters WITH all four sub-scores reaches this slot
 * (reviewSlots.ts). A shorter one looks lost at this size and a missing score
 * would render a broken four-up.
 */

import { CourseNameLink } from '@/components/shared/CourseNameLink';
import React from 'react';
import { MentionText } from '@/components/mentions/MentionText';
import { useTranslation } from 'react-i18next';

import { ReviewScoreRow } from '@/components/shared/ReviewScoreRow';
import { HAIRLINE_INK_8, INK, INK_FAINT, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import { A, LABEL } from '@/features/courses/components/holes/analytical/tokens';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';

const FIGS: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
};

interface Props {
  review: LatestReview;
  onReviewPress: (r: LatestReview) => void;
}

export const ReviewFeaturedSlot: React.FC<Props> = ({ review: r, onReviewPress }) => {
  const { t } = useTranslation('courses');
  const b = r.breakdown;
  const name = r.reviewerName || t('discover.reviews.member', 'A member');

  return (
    <section style={{ padding: '0 20px' }}>
      <DiscoverSectionHeading title={t('statBrowse.reviews.heading')} />


      {/* CB69 — non-button tile so the course name can be a real button. */}
      <div
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
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 0,
          padding: 0,
          marginTop: 10,
          cursor: 'pointer',
        }}
      >
        <p style={{ marginTop: 0, fontSize: 15, lineHeight: 1.5, color: INK }}><MentionText text={r.quote} disableNavigation /></p>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {r.reviewerAvatar ? (
            <img
              src={r.reviewerAvatar}
              alt=""
              width={22}
              height={22}
              loading="lazy"
              style={{ width: 22, height: 22, borderRadius: '34%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              aria-hidden
              style={{
                width: 22,
                height: 22,
                borderRadius: '34%',
                background: A.CANVAS,
                border: `1px solid ${HAIRLINE_INK_8}`,
                flexShrink: 0,
              }}
            />
          )}
          <CourseNameLink
            courseId={r.courseId}
            textProps={{ 'data-review-featured-course': '' }}
            wrapperStyle={{ minWidth: 0 }}
            style={{ fontSize: 13, fontWeight: 700, color: INK, minWidth: 0, display: 'inline' }}
          >
            {r.courseName}
          </CourseNameLink>
          <span style={{ fontSize: 12.5, color: INK_MUTE, whiteSpace: 'nowrap' }}>{name}</span>
        </div>

        {/* The shared review score row (signed-off mock), where the four-up sat. */}
        <ReviewScoreRow
          style={{ marginTop: 14 }}
          overall={r.rating ?? null}
          breakdown={{
            design: b.design ?? null,
            condition: b.conditions ?? null,
            clubhouse: b.clubhouse ?? null,
            facilities: b.facilities ?? null,
          }}
        />
      </div>
    </section>
  );
};

export default ReviewFeaturedSlot;
