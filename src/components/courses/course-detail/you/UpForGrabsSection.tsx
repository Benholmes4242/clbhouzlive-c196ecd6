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
import type { CourseLegendRow } from '@/lib/gam/types';

interface Props {
  /** The course record gross, when someone holds it. */
  recordValue: number | null;
  /** Every holder of the record, viewer first then earliest attained. */
  holders: CourseLegendRow[];
  unclaimedCount: number;
  /** The member's own best gross here, when they have played. */
  yourBest: number | null;
  onAllBoards: () => void;
}

const UpForGrabsSection: React.FC<Props> = ({
  recordValue,
  holders,
  unclaimedCount,
  yourBest,
  onAllBoards,
}) => {
  const { t } = useTranslation('courses');

  const holderIsYou = holders.some((h) => h.is_self);
  const fallbackName = t('courseDetail.records.holder', { defaultValue: 'A member' });
  const nm = (h: CourseLegendRow | undefined) => h?.user_display_name ?? fallbackName;
  const others = holders.filter((h) => !h.is_self);
  const value = recordValue != null ? formatLegendValueCompact('lowest_gross_all_time', recordValue) : '';
  const joint = holders.length >= 2
    ? holderIsYou
      ? holders.length === 2
        ? t('courseDetail.youTab.grabs.yoursJointTwo', { other: nm(others[0]), value })
        : t('courseDetail.youTab.grabs.yoursJointMany', { count: holders.length - 1, value })
      : holders.length === 2
        ? t('courseDetail.youTab.grabs.heldJointTwo', { first: nm(holders[0]), second: nm(holders[1]), value })
        : t('courseDetail.youTab.grabs.heldJointMany', { first: nm(holders[0]), count: holders.length - 1, value })
    : null;

  const body = recordValue != null && joint
    ? joint
    : recordValue != null
    ? holderIsYou
      ? t('courseDetail.youTab.grabs.yours', {
          value: formatLegendValueCompact('lowest_gross_all_time', recordValue),
        })
      : t('courseDetail.youTab.grabs.held', {
          name: nm(holders[0]),
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
