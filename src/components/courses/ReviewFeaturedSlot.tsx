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

import React from 'react';
import { useTranslation } from 'react-i18next';

import { bandColorOnDark, SubScoreStack } from '@/features/courses/_shared/scoreBands';
import {
  HAIRLINE_INK_8,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
  SURFACE,
} from '@/features/courses/_shared/tokens';
import { LABEL } from '@/features/courses/components/holes/analytical/tokens';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

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
    <section style={{ background: SURFACE, padding: '16px 16px 18px' }}>
      <div style={LABEL}>{t('statBrowse.reviews.heading')}</div>


      <button
        type="button"
        onClick={() => onReviewPress(r)}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 0,
          padding: 0,
          marginTop: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              ...FIGS,
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: bandColorOnDark(r.rating),
            }}
          >
            {r.rating.toFixed(1)}
          </span>
          <span style={{ ...LABEL, color: INK_FAINT }}>
            {t('statBrowse.reviews.outOfTen')}
          </span>
        </div>

        <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.5, color: INK }}>{r.quote}</p>

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
                background: SLATE_50,
                border: `1px solid ${HAIRLINE_INK_8}`,
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: INK, minWidth: 0 }}>
            {r.courseName}
          </span>
          <span style={{ fontSize: 12.5, color: INK_MUTE, whiteSpace: 'nowrap' }}>{name}</span>
        </div>

        {/* The four-up. Even columns, 3px tracks, one shared scale. */}
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <SubScoreStack label={t('top100.stats.design')} score={Number(b.design)} />
          <SubScoreStack label={t('top100.stats.condition')} score={Number(b.conditions)} />
          <SubScoreStack label={t('top100.stats.clubhouse')} score={Number(b.clubhouse)} />
          <SubScoreStack label={t('top100.stats.facilities')} score={Number(b.facilities)} />
        </div>
      </button>
    </section>
  );
};

export default ReviewFeaturedSlot;
