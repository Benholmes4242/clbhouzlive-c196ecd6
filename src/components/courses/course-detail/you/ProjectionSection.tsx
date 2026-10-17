/**
 * BRIEF_YOU_TAB_BRANCH_C_SCOUTING_REPORT §4 / §10 — section 1 of branch C.
 *
 * Three states, chosen by the caller in this order: DEGRADE A (no index or no
 * CR / slope / par -> field vs the member's own average), DEGRADE B (fewer than
 * eight differentials -> a round played TO handicap), FULL (typical round from
 * the median differential). "typically" and "off your handicap" are different
 * claims and are never swapped. Every figure here comes from coursePlay.ts.
 *
 * Amber marks the member only: the band, the typical tick and its label.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, BAR_RADIUS, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import {
  axisScale,
  courseHandicap,
  timesPlayedToStandard,
  type CoursePlayInputs,
  type CourseProjection,
} from '@/lib/whs/coursePlay';
import AboutSection, { ABOUT_KICKER } from '../about/AboutSection';
import { YouSentence } from './youBits';

export type ProjectionState =
  | { kind: 'full'; inputs: CoursePlayInputs; projection: CourseProjection; differentials: number[] }
  | { kind: 'handicap_only'; inputs: CoursePlayInputs; sample: number }
  | { kind: 'compare'; fieldOverPar: number; yourOverPar: number; courseCount: number }
  | { kind: 'none' };

const WORKING: React.CSSProperties = {
  marginTop: 13,
  marginBottom: 0,
  fontSize: 11,
  lineHeight: 1.5,
  fontWeight: 500,
  color: A.DIM,
  fontFamily: SANS,
  ...FIGS,
};

const signed1 = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`;

/* The band is the member's amber at 16%, mixed from the token so no new local amber is declared. */
const BAND = `color-mix(in srgb, ${A.AMBER} 16%, transparent)`;

const Hero: React.FC<{ figure: string; unit: string; right: string; rightLabel: string }> = ({
  figure,
  unit,
  right,
  rightLabel,
}) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
    <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.88, color: A.INK, ...FIGS }}>
      {figure}
    </span>
    <span style={{ fontSize: 13, fontWeight: 700, color: A.MUTE, paddingBottom: 5, letterSpacing: '-0.01em' }}>{unit}</span>
    <div style={{ marginLeft: 'auto', textAlign: 'right', paddingBottom: 3 }}>
      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1, color: A.INK, ...FIGS }}>
        {right}
      </div>
      <div style={{ ...ABOUT_KICKER, marginTop: 5 }}>{rightLabel}</div>
    </div>
  </div>
);

const MARK_LABEL: React.CSSProperties = {
  position: 'absolute',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  transform: 'translateX(-50%)',
  fontFamily: SANS,
  ...FIGS,
};

const END_NUM: React.CSSProperties = {
  position: 'absolute',
  top: 62,
  fontSize: 10,
  fontWeight: 700,
  color: A.DIM,
  transform: 'translateX(-50%)',
  fontFamily: SANS,
  ...FIGS,
};

interface Props {
  courseName: string;
  state: ProjectionState;
  recordGross: number | null;
  /** Tracked rounds at the course, when known. */
  fieldRounds?: number | null;
  /**
   * YOU_TAB_THIN_COURSE_1 P2 — true below COURSE_FIELD_MIN_ROUNDS: the
   * "played to that standard N times" sentence comes off, replaced with the
   * honest version (only N rounds logged, so the best of them is what there
   * is to beat). The range, projection and course handicap are untouched.
   */
  thinField?: boolean;
}

const ProjectionSection: React.FC<Props> = ({ courseName, state, recordGross, fieldRounds = null, thinField = false }) => {
  const { t } = useTranslation('courses');
  if (state.kind === 'none') return null;
  const heading = t('courseDetail.youTab.projection.heading', { courseName });

  if (state.kind === 'compare') {
    return (
      <AboutSection first heading={heading}>
        <Hero
          figure={signed1(state.fieldOverPar)}
          unit={t('courseDetail.youTab.projection.fieldLead')}
          right={signed1(state.yourOverPar)}
          rightLabel={t('courseDetail.youTab.projection.youEverywhere')}
        />
        <div style={{ marginTop: 16 }}>
          <YouSentence>
            {t('courseDetail.youTab.projection.compare', {
              field: state.fieldOverPar.toFixed(1),
              yours: state.yourOverPar.toFixed(1),
              count: state.courseCount,
            })}
          </YouSentence>
        </div>
        <p style={WORKING}>{t('courseDetail.youTab.projection.compareBasis')}</p>
      </AboutSection>
    );
  }

  const { inputs } = state;
  const working = (
    <p style={WORKING}>
      {t('courseDetail.youTab.projection.working', {
        index: inputs.index.toFixed(1),
        cr: inputs.cr.toFixed(1),
        slope: Math.round(inputs.slope),
        par: Math.round(inputs.par),
      })}
    </p>
  );

  if (state.kind === 'handicap_only') {
    const ch = courseHandicap(inputs);
    const toHandicap = inputs.par + ch;
    const recordLine =
      recordGross == null
        ? null
        : toHandicap <= recordGross
          ? t('courseDetail.youTab.projection.handicapOnlyRecord', { record: recordGross })
          : t('courseDetail.youTab.projection.handicapOnlyRecordAbove', {
              record: recordGross,
              gap: toHandicap - recordGross,
            });
    return (
      <AboutSection first heading={heading}>
        <Hero
          figure={String(toHandicap)}
          unit={t('courseDetail.youTab.projection.offHandicap')}
          right={String(ch)}
          rightLabel={t('courseDetail.youTab.projection.courseHandicap')}
        />
        {working}
        {recordLine ? (
          <div style={{ marginTop: 6 }}>
            <YouSentence>{recordLine}</YouSentence>
          </div>
        ) : null}
        <p style={WORKING}>
          {t('courseDetail.youTab.projection.handicapOnlyBasis', {
            index: inputs.index.toFixed(1),
            sample: state.sample,
          })}
        </p>
      </AboutSection>
    );
  }

  const { projection: p, differentials } = state;
  const { pos } = axisScale(p.lowGross, p.highGross, recordGross);
  const times =
    recordGross != null ? timesPlayedToStandard(differentials, recordGross, inputs.cr, inputs.slope) : 0;
  const payoff =
    recordGross == null
      ? t('courseDetail.youTab.projection.range', { low: p.lowGross, high: p.highGross })
      : thinField
        ? t('courseDetail.youTab.projection.rangeWithRecordThin', {
            low: p.lowGross,
            high: p.highGross,
            record: recordGross,
            count: fieldRounds ?? 0,
          })
        : times >= 1
        ? t('courseDetail.youTab.projection.rangeWithRecord', {
            low: p.lowGross,
            high: p.highGross,
            record: recordGross,
            count: times,
            sample: p.sampleSize,
          })
        : t('courseDetail.youTab.projection.rangeWithRecordUnbeaten', {
            low: p.lowGross,
            high: p.highGross,
            record: recordGross,
            gap: p.typicalGross - recordGross,
          });

  return (
    <AboutSection first heading={heading}>
      <Hero
        figure={String(p.typicalGross)}
        unit={t('courseDetail.youTab.projection.typically')}
        right={String(p.courseHcp)}
        rightLabel={t('courseDetail.youTab.projection.courseHandicap')}
      />
      {working}
      <div aria-hidden="true" style={{ position: 'relative', height: 78, marginTop: 18 }}>
        <span style={{ position: 'absolute', left: 0, right: 0, top: 58, height: 1, background: A.TRACK }} />
        <span
          style={{
            position: 'absolute',
            top: 34,
            height: 20,
            borderRadius: BAR_RADIUS,
            background: BAND,
            left: `${pos(p.lowGross)}%`,
            right: `${100 - pos(p.highGross)}%`,
          }}
        />
        {recordGross != null ? (
          <span
            style={{ position: 'absolute', top: 30, height: 28, width: 1, background: A.INK, left: `${pos(recordGross)}%` }}
          />
        ) : null}
        <span
          style={{ position: 'absolute', top: 30, height: 28, width: 2, background: A.AMBER, left: `${pos(p.typicalGross)}%` }}
        />
        <span style={{ ...MARK_LABEL, top: 0, left: `${pos(p.typicalGross)}%`, color: A.AMBER }}>
          {t('courseDetail.youTab.projection.youMark', { gross: p.typicalGross })}
        </span>
        {recordGross != null ? (
          <span style={{ ...MARK_LABEL, top: 16, left: `${pos(recordGross)}%`, color: A.INK }}>
            {t('courseDetail.youTab.projection.recordMark', { gross: recordGross })}
          </span>
        ) : null}
        <span style={{ ...END_NUM, left: `${pos(p.lowGross)}%` }}>{p.lowGross}</span>
        <span style={{ ...END_NUM, left: `${pos(p.highGross)}%` }}>{p.highGross}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <YouSentence>{payoff}</YouSentence>
      </div>
      <p style={WORKING}>{t('courseDetail.youTab.projection.basis', { sample: p.sampleSize })}</p>
    </AboutSection>
  );
};

export default ProjectionSection;
