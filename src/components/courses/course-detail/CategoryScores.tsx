/**
 * BRIEF_ONE_CATEGORY_SCORE_BLOCK — the ONE category score block and the ONE
 * overall line. Mounted on the courses list card, the Course tab and the
 * Reviews tab. Same numbers, one treatment.
 *
 *   bar     3px, BAR_RADIUS, A.TRACK track, fill (value / 10) * 100% clamped
 *   figure  17 / 700 / -0.02em, courseSubScoreTone(value)
 *   label   9 / 700 / 0.09em / uppercase / A.DIM, beneath the figure
 *   columns four equal, 12px gap
 *
 * An absent category renders an EMPTY column — never a zero, never a dash.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, SANS, FIGS, BAR_RADIUS, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { getRatingTierLabel } from '@/lib/ratingTier';

export interface CategoryScoreValues {
  design?: number | null;
  condition?: number | null;
  clubhouse?: number | null;
  facilities?: number | null;
}

const ORDER: { key: keyof CategoryScoreValues; label: string }[] = [
  { key: 'design', label: 'Design' },
  { key: 'condition', label: 'Condition' },
  { key: 'clubhouse', label: 'Clubhouse' },
  { key: 'facilities', label: 'Facilities' },
];

/** The only copy of the fill arithmetic. */
export const categoryFillPercent = (value: number) => Math.max(0, Math.min(100, (value / 10) * 100));

/**
 * BRIEF_REVIEWS_CATEGORY_PAIRS — the 'pairs' layout, used ONLY by the Reviews
 * tab (WhatTheyScored). Two columns, readable 13/700 INK labels, an 8px bar and
 * figure on one row.
 *
 * THE 0–10 SCALE IS DELIBERATE. Rescaling the bar to start at 5.0 was built,
 * measured and declined: at 0–10 the four bars differ only slightly and read as
 * near-identical — that is accepted. The bar gives weight and familiarity; the
 * figures carry the comparison. Changing the scale is a product decision, not a
 * bug fix. The fill arithmetic stays in categoryFillPercent.
 */
const CategoryScorePairs: React.FC<{ scores: CategoryScoreValues; marginTop: number }> = ({ scores, marginTop }) => (
  <div
    data-category-scores
    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px', marginTop, fontFamily: SANS }}
  >
    {ORDER.map(({ key, label }) => {
      const value = scores[key];
      if (value == null) return <div key={key} data-category={key} aria-hidden style={{ minWidth: 0 }} />;
      const tone = courseSubScoreTone(value);
      return (
        <div key={key} data-category={key} style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.INK, marginBottom: 9 }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: A.TRACK, overflow: 'hidden' }}>
              <div
                data-category-score={value.toFixed(1)}
                style={{ height: '100%', width: `${categoryFillPercent(value)}%`, borderRadius: 4, background: tone }}
              />
            </div>
            <div data-category-figure style={{ ...FIGS, flex: '0 0 30px', textAlign: 'right', fontSize: 15, fontWeight: 700, color: tone }}>
              {value.toFixed(1)}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export const CategoryScores: React.FC<{ scores: CategoryScoreValues; marginTop?: number; layout?: 'grid4' | 'pairs' }> = ({ scores, marginTop = 0, layout = 'grid4' }) => {
  if (ORDER.every(({ key }) => scores[key] == null)) return null;
  if (layout === 'pairs') return <CategoryScorePairs scores={scores} marginTop={marginTop} />;
  return (
    <div
      data-category-scores
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop, fontFamily: SANS }}
    >
      {ORDER.map(({ key, label }) => {
        const value = scores[key];
        if (value == null) return <div key={key} data-category={key} aria-hidden style={{ minWidth: 0 }} />;
        const tone = courseSubScoreTone(value);
        return (
          <div key={key} data-category={key} style={{ minWidth: 0 }}>
            <div style={{ height: 3, borderRadius: BAR_RADIUS, background: A.TRACK, overflow: 'hidden' }}>
              <div
                data-category-score={value.toFixed(1)}
                style={{ height: '100%', width: `${categoryFillPercent(value)}%`, borderRadius: BAR_RADIUS, background: tone }}
              />
            </div>
            <div data-category-figure style={{ ...FIGS, marginTop: 6, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: tone }}>
              {value.toFixed(1)}
            </div>
            <div
              style={{
                marginTop: 5, fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
                color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Below this the tier word is withheld — a verdict needs a sample. The score and its rating count still show. */
export const SETTLED_MIN_RATINGS = 5;

/**
 * §3.1 — the overall, 38px, with its tier word on one baseline: "7.9 overall".
 * The rating count no longer sits beside it — the count lives in the right-hand
 * slot of the Course tab's score row, where "Your rating" used to sit.
 */
export const OverallScoreLine: React.FC<{ score: number; ratingCount: number }> = ({ score, ratingCount }) => {
  const { t } = useTranslation('courses');
  const settled = ratingCount >= SETTLED_MIN_RATINGS;
  const tone = courseSubScoreTone(score);
  return (
    <div data-overall-score style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0, fontFamily: SANS }}>
      <span style={{ ...FIGS, flexShrink: 0, fontSize: 38, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: tone }}>
        {score.toFixed(1)}
      </span>
      {/* Always shown, at every rating count — a label, not a verdict. */}
      <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: A.DIM }}>
        {t('courseDetail.communityScore.overall')}
      </span>
      {settled ? (
        <span style={{ minWidth: 0, fontSize: 11.5, fontWeight: 600, lineHeight: 1.35, color: tone }}>
          {getRatingTierLabel(score)}
        </span>
      ) : null}
    </div>
  );
};

export default CategoryScores;
