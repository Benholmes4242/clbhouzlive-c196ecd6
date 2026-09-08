/**
 * BRIEF_YOU_TAB_REBUILD §3.1 — YOUR RECORD HERE.
 *
 * No heading: a flat figure row directly under the tab strip, then a caption
 * stating the basis.
 *
 * THE ONE-ROUND LABEL RULE. An average of one round is a score wearing a
 * statistician's hat, so at exactly one round the kicker reads "Your round" and
 * the caption names it as one round. Nothing else about the row changes.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from '../about/AboutSection';
import { YouCaption, YouFigure } from './youBits';

interface Props {
  /** Every tracked 18-hole round the member has here. */
  rounds: number;
  /** Lowest gross. Amber, because it is the member's own. */
  best: number | null;
  /** Their gross average (or their single round's gross). */
  average: number | null;
  /** The field's gross average here, already rounded for display. */
  field: string | null;
}

const YourRecordHere: React.FC<Props> = ({ rounds, best, average, field }) => {
  const { t } = useTranslation('courses');
  const single = rounds === 1;

  const caption = field
    ? single
      ? t('courseDetail.youTab.basisOne', { field })
      : t('courseDetail.youTab.basisMany', { count: rounds, rounds, field })
    : single
      ? t('courseDetail.youTab.basisOneNoField')
      : t('courseDetail.youTab.basisManyNoField', { count: rounds, rounds });

  return (
    <AboutSection first>
      <div style={{ display: 'flex', gap: 14 }}>
        <YouFigure label={t('courseDetail.youTab.rounds')} value={String(rounds)} />
        <YouFigure
          label={t('courseDetail.youTab.best')}
          value={best != null ? String(best) : '\u2014'}
          tone={A.AMBER_DEEP}
        />
        <YouFigure
          /* §3.1 — one round is not an average. */
          label={single ? t('courseDetail.youTab.yourRound') : t('courseDetail.youTab.yourAverage')}
          value={average != null ? (single ? String(Math.round(average)) : average.toFixed(1)) : '\u2014'}
        />
        <YouFigure label={t('courseDetail.youTab.field')} value={field ?? '\u2014'} />
      </div>
      <YouCaption>{caption}</YouCaption>
    </AboutSection>
  );
};

export default YourRecordHere;
