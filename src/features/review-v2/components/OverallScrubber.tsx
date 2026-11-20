/** Step 2 comparison uses only the header's aggregate, not the calibration/receipt read.
 * Score ink preserves courseSubScoreTone's all-white rule via the score theme. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScoreBar } from './ScoreBar';
import { membersComparisonBase } from '../lib/scoreStepRules';
import type { ReviewHeaderFacts } from '../hooks/useReviewHeaderFacts';

interface Props {
  value: number | null;
  onChange: (value: number) => void;
  caption: string;
  ariaLabel: string;
  members?: ReviewHeaderFacts;
  savedRating?: number | null;
}
export function OverallScrubber({ value, onChange, caption, ariaLabel, members, savedRating }: Props) {
  const { t } = useTranslation('courses');
  const base = membersComparisonBase(members?.avg ?? null, members?.count ?? 0, savedRating);
  const difference = value != null && base != null ? Math.round((value - base) * 10) / 10 : null;
  const comparison = difference === 0 ? 'membersLevel' : 'membersDifference';
  return <div>
    <div className="review-score-kicker">{t('review.wizard.step3.overallLabel')}</div>
    <div className="review-overall-number-row">
      <div className="review-overall-figure">
        <span className="review-score-number review-overall-number" data-empty={value == null}>{value == null ? '—' : value.toFixed(1)}</span>
        {value == null && <span className="review-overall-denominator">/ 10</span>}
      </div>
      {value != null && base != null && difference != null && <div className="review-overall-members" data-members-comparison data-difference={difference}>
        <b>{t(`review.wizard.step3.${comparison}`, { difference: Math.abs(difference).toFixed(1), direction: t(`review.wizard.step3.${difference > 0 ? 'above' : 'below'}`) })}</b>{' '}
        {t(`review.wizard.step3.${difference === 0 ? 'membersWith' : 'membersThe'}`)}<br />
        {t('review.wizard.step3.membersAverage', { average: base.toFixed(1) })}
      </div>}
    </div>
    <ScoreBar value={value} onChange={onChange} ariaLabel={ariaLabel} />
    {value == null && <div className="review-overall-caption">{caption}</div>}
  </div>;
}