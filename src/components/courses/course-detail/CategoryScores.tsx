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

export const CategoryScores: React.FC<{ scores: CategoryScoreValues; marginTop?: number }> = ({ scores, marginTop = 0 }) => {
  if (ORDER.every(({ key }) => scores[key] == null)) return null;
  return (
    <div
      data-category-scores
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop, fontFamily: SANS }}
    >
      {ORDER.map(({ key, label }) => {
        const value = scores[key];
        if (value == null) return <div key={key} aria-hidden style={{ minWidth: 0 }} />;
        const tone = courseSubScoreTone(value);
        return (
          <div key={key} style={{ minWidth: 0 }}>
            <div style={{ height: 3, borderRadius: BAR_RADIUS, background: A.TRACK, overflow: 'hidden' }}>
              <div
                data-category-score={value.toFixed(1)}
                style={{ height: '100%', width: `${categoryFillPercent(value)}%`, borderRadius: BAR_RADIUS, background: tone }}
              />
            </div>
            <div style={{ ...FIGS, marginTop: 6, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: tone }}>
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

/** Below this the score is shown but not called settled; no tier word. */
export const SETTLED_MIN_RATINGS = 5;

/**
 * §3.1 — the overall, 38px, inline with its sample on one baseline:
 *   7.9  overall · from 1 rating — too few to be settled.
 */
export const OverallScoreLine: React.FC<{ score: number; ratingCount: number }> = ({ score, ratingCount }) => {
  const { t } = useTranslation('courses');
  const settled = ratingCount >= SETTLED_MIN_RATINGS;
  const tone = courseSubScoreTone(score);
  const sampleRaw = settled
    ? t('courseDetail.communityScore.basedOn', { count: ratingCount })
    : t('courseDetail.rating.tooFew', { count: ratingCount });
  const sample = sampleRaw.charAt(0).toLowerCase() + sampleRaw.slice(1);
  return (
    <div data-overall-score style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0, fontFamily: SANS }}>
      <span style={{ ...FIGS, flexShrink: 0, fontSize: 38, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: tone }}>
        {score.toFixed(1)}
      </span>
      <span style={{ minWidth: 0, fontSize: 11.5, fontWeight: 600, lineHeight: 1.35, color: A.MUTE }}>
        {settled ? <span style={{ color: tone }}>{getRatingTierLabel(score)} · </span> : null}
        overall · {sample}
      </span>
    </div>
  );
};

export default CategoryScores;
