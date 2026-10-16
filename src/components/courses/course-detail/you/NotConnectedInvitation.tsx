/**
 * BRIEF_YOU_TAB_CONNECT_INVITATION §2.2-2.3 — the field's chart and the empty
 * birdie strip, for branch B (not connected) of CourseYouTab ONLY.
 *
 * Each bar takes the RAMP_TOPAR hue of the hole's dominant bucket via the
 * shared `dominantBucket` helper, which the intro screen and the member's own
 * chart also call. The chart carries NO amber example line: here a real "you" is coming. The birdie slots
 * are dashed WHITE, never amber - amber marks the member's own data, and there
 * is none yet.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { courseBucketShares, dominantBucket } from '@/features/courses/components/holes/analytical/HoleRowV2';
import { A, BAR_RADIUS, FIGS, RAMP_TOPAR, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { formatNumber } from '@/i18n/format';
import AboutSection from '../about/AboutSection';
import { YouSentence } from './youBits';

/** Mock you-tab-final.html draws the chart at 96px. */
const CHART_HEIGHT = 96;
const GAP = 3;
/** Visibility floor, not significance: the round count always sits beside the heading. */
export const FIELD_CHART_MIN_ROUNDS = 5;

function barFill(h: CourseHole): string {
  const seg = courseBucketShares([h]);
  if (!seg) return A.DIM;
  return RAMP_TOPAR[dominantBucket(seg)];
}

/** The field's 18 bars and their 1 / 9 / 18 axis. ONE home: branch B and branch C both draw this. */
export const FieldHoleBars: React.FC<{ holes: CourseHole[] }> = ({ holes }) => {
  const sorted = [...holes].sort((a, b) => a.hole_no - b.hole_no);
  const maxField = Math.max(0.01, ...sorted.map((h) => Math.max(0, h.avg_to_par)));
  const n = sorted.length;
  return (
    <>
        <div
        aria-hidden="true"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          alignItems: 'end',
          gap: GAP,
          height: CHART_HEIGHT,
        }}
      >
        {sorted.map((h) => (
          <span
            key={h.hole_no}
            style={{
              display: 'block',
              width: '100%',
              height: Math.max(2, (Math.max(0, h.avg_to_par) / maxField) * CHART_HEIGHT),
              borderRadius: BAR_RADIUS,
              background: barFill(h),
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          color: A.DIM,
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 700,
          ...FIGS,
        }}
      >
        <span>1</span>
        <span>{String(Math.ceil(n / 2))}</span>
        <span>{String(n)}</span>
      </div>
  </>
);
};

/** YOU_TAB_SPARSE_1 N2: the field's chart names the course, never the reader. */
export const FieldShotsSection: React.FC<{ holes: CourseHole[]; totalRounds: number; courseName: string }> = ({
  holes,
  totalRounds,
  courseName,
}) => {
  const { t } = useTranslation('courses');
  return (
    <AboutSection
      heading={t('courseDetail.youTab.connect.fieldShotsHeading', { courseName })}
      meta={t('courseDetail.youTab.connect.roundsMeta', { count: totalRounds, rounds: formatNumber(totalRounds) })}
    >
      <FieldHoleBars holes={holes} />
      <div style={{ marginTop: 12 }}>
        <YouSentence quiet>{t('courseDetail.youTab.connect.fieldChartLede', { courseName, count: totalRounds, rounds: formatNumber(totalRounds) })}</YouSentence>
      </div>
    </AboutSection>
  );
};

const SLOT_BORDER = '1px dashed rgba(248,250,252,0.30)';

export const EmptyBirdiesSection: React.FC = () => {
  const { t } = useTranslation('courses');
  return (
    <AboutSection heading={t('courseDetail.youTab.sections.birdiesHere')} meta={t('courseDetail.youTab.connect.birdiesMeta')}>
      <div aria-hidden="true" style={{ display: 'flex', gap: GAP }}>
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} style={{ flex: 1, height: 14, borderRadius: 2, border: SLOT_BORDER }} />
        ))}
      </div>
      <div style={{ marginTop: 11 }}>
        <YouSentence quiet>{t('courseDetail.youTab.connect.birdiesCaption')}</YouSentence>
      </div>
    </AboutSection>
  );
};
