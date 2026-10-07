/**
 * BRIEF_YOU_TAB_REBUILD §3.1 — YOUR RECORD HERE.
 *
 * No heading: a flat figure row directly under the tab strip. The strip's
 * figures are the whole statement — the old "basis" caption beneath them is
 * gone (both figures were already labelled ROUNDS and FIELD in the strip).
 *
 * THE ONE-ROUND LABEL RULE. An average of one round is a score wearing a
 * statistician's hat, so at exactly one round the kicker reads "Your round".
 * Nothing else about the row changes.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from '../about/AboutSection';
import CenteredStatStrip from '../about/CenteredStatStrip';

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

  return (
    <AboutSection first>
      <CenteredStatStrip
        items={[
          { label: t('courseDetail.youTab.rounds'), value: String(rounds) },
          { label: t('courseDetail.youTab.best'), value: best != null ? String(best) : '\u2014', tone: A.AMBER_DEEP },
          {
            label: single ? t('courseDetail.youTab.yourRound') : t('courseDetail.youTab.yourAverage'),
            value: average != null ? (single ? String(Math.round(average)) : average.toFixed(1)) : '\u2014',
          },
          { label: t('courseDetail.youTab.field'), value: field ?? '\u2014' },
        ]}
      />
    </AboutSection>
  );
};

export default YourRecordHere;
