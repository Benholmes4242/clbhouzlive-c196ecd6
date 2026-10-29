/** The score page replaces only its own shared strip; Step 1 retains it.
 * The fixed-height categories heading prevents average arrival moving rows. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import ComposerStepHeader from '@/features/composer-flow/components/ComposerStepHeader';
import { categoryAverage } from '../lib/categoryAverage';
import type { CategoryKey } from '../types';

export function ReviewStepHeading({ step, total }: { step: number; total: number }) {
  const { t } = useTranslation(['courses', 'composerFlow']);
  if (step !== total) return <ComposerStepHeader step={step} total={total} left="none" />;
  return <div className="review-score-heading-row" data-score-step-heading>
    <h1 className="review-score-heading">{t('review.wizard.step3.heading')}</h1>
    <span className="review-score-step-label">{t('step', { ns: 'composerFlow', n: step, m: total })}</span>
  </div>;
}

export function ReviewCategoriesHeading({ scores }: { scores: Record<CategoryKey, number | null> }) {
  const { t } = useTranslation('courses');
  const average = categoryAverage(scores);
  return <div className="review-score-cats-intro">
    <div className="review-score-cats-heading">
      <div className="review-score-kicker">{t('review.wizard.step3.breakdownLabel')}</div>
      {average != null && <span className="review-score-average" data-category-average>
        {t('review.wizard.step3.average')} <b className="review-score-number">{average.toFixed(1)}</b>
      </span>}
    </div>
    <p>{t('review.wizard.step3.catsIntro')}</p>
  </div>;
}