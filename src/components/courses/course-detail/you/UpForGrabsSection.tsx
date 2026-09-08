/**
 * BRIEF_YOU_TAB_REBUILD §3.8 — UP FOR GRABS.
 *
 * The one section that renders in EVERY state, including no handicap: an
 * unclaimed record is worth seeing whether or not the member has a round here.
 * Same read as before — useCourseRecordSummary over the existing
 * get_course_legends RPC. No new query.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { formatLegendValueCompact } from '@/lib/gam/visuals';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from '../about/AboutSection';
import { YouAction } from './youBits';

interface Props {
  /** The course record gross, when someone holds it. */
  recordValue: number | null;
  holderName: string | null;
  /** True when the viewing member holds it. */
  holderIsYou: boolean;
  unclaimedCount: number;
  /** The member's own best gross here, when they have played. */
  yourBest: number | null;
  onAllBoards: () => void;
}

const UpForGrabsSection: React.FC<Props> = ({
  recordValue,
  holderName,
  holderIsYou,
  unclaimedCount,
  yourBest,
  onAllBoards,
}) => {
  const { t } = useTranslation('courses');

  const body = recordValue != null
    ? holderIsYou
      ? t('courseDetail.youTab.grabs.yours', {
          value: formatLegendValueCompact('lowest_gross_all_time', recordValue),
        })
      : t('courseDetail.youTab.grabs.held', {
          name: holderName ?? t('courseDetail.records.holder', { defaultValue: 'A member' }),
          value: formatLegendValueCompact('lowest_gross_all_time', recordValue),
        })
    : yourBest != null
      ? t('courseDetail.youTab.grabs.played', { score: yourBest })
      : t('courseDetail.youTab.grabs.notPlayed');

  return (
    <AboutSection
      heading={t('courseDetail.youTab.sections.upForGrabs')}
      meta={
        unclaimedCount > 0
          ? t('courseDetail.records.unclaimedMeta', {
              count: unclaimedCount,
              unclaimed: formatNumber(unclaimedCount),
            })
          : null
      }
    >
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, fontWeight: 700, color: A.INK, fontFamily: SANS, ...FIGS }}>
        {body}
      </p>
      <YouAction label={t('courseDetail.youTab.grabs.allBoards')} onPress={onAllBoards} />
    </AboutSection>
  );
};

export default UpForGrabsSection;
