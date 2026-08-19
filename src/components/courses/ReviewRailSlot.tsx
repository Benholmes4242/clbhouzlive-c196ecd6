/**
 * SLOT A — "What members say": a horizontal rail of three compact reviews,
 * placed between the course cards on the Courses browse.
 *
 * WHY IT LOOKS NOTHING LIKE THE DISCOVER MOSAIC: that mosaic is 265px
 * photo-led tiles, and alternating those with the course cards — which are
 * ALSO full-bleed photographs with glass chips — would put two card systems on
 * one page. These panels are white, bordered and carry NO photograph, so the
 * photography stays on the courses and the reviews read as voice.
 *
 * Presentation only. Placement and selection belong to reviewSlots.ts.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import { bandColor } from '@/features/courses/_shared/scoreBands';
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

const CARD_W = 244;

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
      {r.reviewerAvatar ? (
        <img
          src={r.reviewerAvatar}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          style={{ width: 20, height: 20, borderRadius: '34%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: 20,
            height: 20,
            borderRadius: '34%',
            background: SLATE_50,
            border: `1px solid ${HAIRLINE_INK_8}`,
            flexShrink: 0,
          }}
        />
      )}
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
  onSeeAll: () => void;
}

export const ReviewRailSlot: React.FC<Props> = ({ reviews, onReviewPress, onSeeAll }) => {
  const { t } = useTranslation('courses');
  if (reviews.length === 0) return null;

  return (
    <section style={{ background: SLATE_50, padding: '14px 0 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
          padding: '0 16px 10px',
        }}
      >
        <div style={LABEL}>{t('statBrowse.reviews.heading')}</div>
        <button
          type="button"
          onClick={onSeeAll}
          style={{ ...LABEL, color: INK_MUTE, background: 'none', border: 0, padding: 0 }}
        >
          {t('statBrowse.reviews.actionRail')}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          padding: '0 16px',
          scrollbarWidth: 'none',
        }}
      >
        {reviews.map((r) => (
          <button
            key={r.reviewId}
            type="button"
            onClick={() => onReviewPress(r)}
            style={{
              width: CARD_W,
              flexShrink: 0,
              textAlign: 'left',
              background: SURFACE,
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: 14,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span
                style={{
                  ...FIGS,
                  fontSize: 17,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: bandColor(r.rating),
                }}
              >
                {r.rating.toFixed(1)}
              </span>
              <span style={{ ...LABEL, color: INK_FAINT }}>
                {t('statBrowse.reviews.outOfTen')}
              </span>
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 13.5,
                fontWeight: 700,
                lineHeight: 1.25,
                color: INK,
                ...clamp(2),
              }}
            >
              {r.courseName}
            </div>

            <p
              style={{
                marginTop: 6,
                fontSize: 12.5,
                lineHeight: 1.45,
                color: INK_MUTE,
                ...clamp(3),
              }}
            >
              {r.quote}
            </p>

            <div
              aria-hidden
              style={{ height: 1, background: HAIRLINE_INK_8, margin: '10px 0 9px' }}
            />
            <Reviewer r={r} />
          </button>
        ))}
      </div>
    </section>
  );
};

export default ReviewRailSlot;
