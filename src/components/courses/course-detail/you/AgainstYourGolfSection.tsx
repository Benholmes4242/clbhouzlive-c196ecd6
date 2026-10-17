/**
 * BRIEF_YOU_TAB_BRANCH_C_SCOUTING_REPORT §6 — "Against the golf you play".
 * Both percentages are derived by CourseYouTab and passed in; nothing is
 * computed here. "Here" is MUTE, "You, so far" is the member's amber.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, BAR_RADIUS, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { formatNumber } from '@/i18n/format';
import AboutSection, { AboutHairline } from '../about/AboutSection';
import { YouSentence } from './youBits';

interface Props {
  /**
   * The field's par-or-better rate here. YOU_TAB_NO_GATE_1 U1 — no sample
   * gate: the "Here" row renders from one tracked round; null only when the
   * course has no hole analysis at all.
   */
  fieldParOrBetterPct: number | null;
  yourParOrBetterPct: number;
  courseCount: number;
  harderThanPct: number | null;
}

const Row: React.FC<{ name: string; pct: number; fill: string }> = ({ name, pct, fill }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{ width: 74, flexShrink: 0, fontSize: 11, fontWeight: 700, color: A.MUTE }}>{name}</span>
    <span style={{ flex: 1, height: 8, borderRadius: BAR_RADIUS, background: A.TRACK, overflow: 'hidden' }}>
      <span
        style={{
          display: 'block',
          height: '100%',
          borderRadius: BAR_RADIUS,
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: fill,
        }}
      />
    </span>
    <span
      style={{
        width: 40,
        flexShrink: 0,
        textAlign: 'right',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color: A.INK,
        ...FIGS,
      }}
    >
      {`${Math.round(pct)}%`}
    </span>
  </div>
);

const AgainstYourGolfSection: React.FC<Props> = ({
  fieldParOrBetterPct,
  yourParOrBetterPct,
  courseCount,
  harderThanPct,
}) => {
  const { t } = useTranslation(['courses', 'common']);
  return (
    <AboutSection
      heading={t('courseDetail.youTab.againstYourGolf.heading')}
      meta={t('courseDetail.youTab.againstYourGolf.meta', { count: courseCount, courses: formatNumber(courseCount) })}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: SANS }}>
        {fieldParOrBetterPct != null ? (
          <Row name={t('courseDetail.youTab.againstYourGolf.here')} pct={fieldParOrBetterPct} fill={A.MUTE} />
        ) : null}
        <Row name={t('courseDetail.youTab.againstYourGolf.you')} pct={yourParOrBetterPct} fill={A.AMBER} />
      </div>
      <p
        style={{
          margin: '13px 0 0',
          fontSize: 11,
          lineHeight: 1.5,
          fontWeight: 500,
          color: A.DIM,
          fontFamily: SANS,
          ...FIGS,
        }}
      >
        {t('courseDetail.youTab.againstYourGolf.basis')}
      </p>
      {harderThanPct != null ? (
        <>
          <AboutHairline style={{ marginTop: 18 }} />
          <div style={{ marginTop: 14 }}>
            {/* YOU_TAB_THIN_COURSE_1 P3 — no "That": the figure is its own fact
                (average over par), not a conclusion from the par-or-better bars.
                The shared common: string stays for CourseStatsSheet. */}
            <YouSentence>{t('courseDetail.youTab.againstYourGolf.harderThan', { pct: Math.round(harderThanPct) })}</YouSentence>
          </div>
        </>
      ) : null}
    </AboutSection>
  );
};

export default AgainstYourGolfSection;
