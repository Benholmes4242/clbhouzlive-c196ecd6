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
import { B, Facts, Said, Sec, Verd, signed1 } from './many/manyBits';
import { ordinal } from './youBits';

/** Mock you-tab-final.html draws the chart at 96px. */
const CHART_HEIGHT = 96;
const GAP = 3;
/* YOU_TAB_STATE_AUDIT_1 W1 — FIELD_CHART_MIN_ROUNDS is deleted. There is no
   visibility floor: the chart renders from ONE tracked round, and the round
   count drives only the wording (fieldSample), never whether the section
   appears. One threshold, one home: COURSE_FIELD_MIN_ROUNDS in
   lib/courseYou/youDerivations.ts. */

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
export const FieldShotsSection: React.FC<{ holes: CourseHole[]; totalRounds: number; courseName: string; withFacts?: boolean }> = ({
  holes,
  totalRounds,
  courseName,
  withFacts = false,
}) => {
  const { t } = useTranslation('courses');
  return (
    <AboutSection
      heading={t('courseDetail.youTab.connect.fieldShotsHeading', { courseName })}
      meta={t('courseDetail.youTab.connect.roundsMeta', { count: totalRounds, rounds: formatNumber(totalRounds) })}
      /* YOU_TAB_THIN_COURSE_1 P5 — a long course name wraps, never truncates. */
      wrapHeading
    >
      <FieldHoleBars holes={holes} />
      {withFacts ? <FieldHoleFacts holes={holes} /> : null}
      <div style={{ marginTop: 12 }}>
        <YouSentence quiet>{t('courseDetail.youTab.connect.fieldChartLede', { courseName, count: totalRounds, rounds: formatNumber(totalRounds) })}</YouSentence>
      </div>
    </AboutSection>
  );
};

const SLOT_BORDER = '1px dashed rgba(248,250,252,0.30)';

/**
 * YOU_TAB_STATE_1 X3 — on a course with ZERO tracked rounds (`waiting`) the
 * birdie section keeps its grid and caption but gains the canonical
 * kicker + title pair, and the slots take the mock's size so they read as
 * eighteen holes. On courses WITH rounds (`waiting` false) nothing changes.
 */
export const EmptyBirdiesSection: React.FC<{ waiting?: boolean }> = ({ waiting = false }) => {
  const { t } = useTranslation('courses');
  const grid = (
    <div aria-hidden="true" style={{ display: 'flex', gap: GAP, marginTop: waiting ? 15 : 0 }}>
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          style={
            waiting
              ? { flex: 1, height: 15, borderRadius: 3, border: '1px dashed rgba(255,255,255,0.26)', background: 'rgba(255,255,255,0.03)' }
              : { flex: 1, height: 14, borderRadius: 2, border: SLOT_BORDER }
          }
        />
      ))}
    </div>
  );
  const caption = (
    <div style={{ marginTop: 11 }}>
      <YouSentence quiet>{t('courseDetail.youTab.connect.birdiesCaption')}</YouSentence>
    </div>
  );
  if (waiting) {
    return (
      <Sec kicker={t('courseDetail.youTab.sections.birdiesHere')} title={t('courseDetail.youTab.birdiesWaiting.title')}>
        {grid}
        {caption}
      </Sec>
    );
  }
  return (
    // YOU_TAB_SPARSE_2 Q1 — no "0 of 18" counter: the one element that stated a
    // score, and the score is nothing. The grid, heading and caption stand as a
    // preview of what a connection unlocks.
    <AboutSection heading={t('courseDetail.youTab.sections.birdiesHere')}>
      {grid}
      {caption}
    </AboutSection>
  );
};

/**
 * YOU_TAB_STATE_2 Z4 — three course facts under the field chart, from the SAME
 * hole analysis the chart draws. Hardest / easiest are the highest / lowest
 * avg_to_par, the Course tab's single definition (first hole wins a tie, as
 * CourseHolePanel's reduce does). Each figure takes its own bar's hue, so the
 * tiles read as captions of the chart; no new colour value.
 */
export const FieldHoleFacts: React.FC<{ holes: CourseHole[] }> = ({ holes }) => {
  const { t } = useTranslation('courses');
  if (holes.length === 0) return null;
  const hardest = holes.reduce((m, h) => (h.avg_to_par > m.avg_to_par ? h : m), holes[0]);
  const easiest = holes.reduce((m, h) => (h.avg_to_par < m.avg_to_par ? h : m), holes[0]);
  return (
    <Facts
      marginTop={14}
      items={[
        { value: String(hardest.hole_no), label: t('courseDetail.youTab.holeFacts.hardest'), tone: barFill(hardest) },
        { value: String(easiest.hole_no), label: t('courseDetail.youTab.holeFacts.letOff'), tone: barFill(easiest) },
        { value: signed1(hardest.avg_to_par), label: t('courseDetail.youTab.holeFacts.costs', { ordinal: ordinal(hardest.hole_no) }) },
      ]}
    />
  );
};

/**
 * YOU_TAB_STATE_2 Z2/Z3 — branch B, course WITH tracked rounds: the field's
 * verdict, first under the tabs. The figure is the inclusive average over par
 * (useCourseStatsDetail.avg_over_par, the source the retired strip read); the
 * member has no connected rounds so there is nobody to exclude. Caller renders
 * nothing when the figure is unavailable - never a gross fallback. Z5: no
 * button here; the one connect call stays at the foot of the tab.
 */
export const FieldVerdictSection: React.FC<{ overPar: number; rounds: number; courseName: string }> = ({ overPar, rounds, courseName }) => {
  const { t } = useTranslation('courses');
  const shots = (Math.round(overPar * 10) / 10).toFixed(1);
  return (
    <Sec kicker={t('courseDetail.youTab.fieldVerdict.kicker')} title={t('courseDetail.youTab.fieldVerdict.title', { shots })}>
      <Verd
        value={signed1(overPar)}
        size={46}
        line1={t('courseDetail.youTab.fieldVerdict.over')}
        line2={t('courseDetail.youTab.fieldVerdict.across', { count: rounds, rounds: formatNumber(rounds) })}
      />
      <Said>
        {t('courseDetail.youTab.fieldVerdict.saidPre')}
        <B>{t('courseDetail.youTab.fieldVerdict.saidField', { courseName })}</B>
        {t('courseDetail.youTab.fieldVerdict.saidMid')}
        <B>{t('courseDetail.youTab.fieldVerdict.saidLine')}</B>
        {t('courseDetail.youTab.fieldVerdict.saidPost')}
      </Said>
    </Sec>
  );
};
