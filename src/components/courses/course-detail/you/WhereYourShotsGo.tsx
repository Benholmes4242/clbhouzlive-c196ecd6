/**
 * BRIEF_YOU_TAB_REBUILD §3.3 — WHERE YOUR SHOTS GO.
 *
 * Under five rounds there is no chart, only a sentence that says why. At five
 * and over: eighteen bars of the member's OWN average over par, three figures,
 * then the one drill-down.
 *
 * THE CHART IS LOCAL, AMBER, AND NOT ShapeChart. ShapeChart is shared with
 * Explore, CourseHolesPage, CoursesPlayedSection and CourseHolePanel and is not
 * imported here. Amber because every bar is the viewing member's own figure.
 * No spline, no curve, no numeric callouts — the figures live beneath.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { A, BAR_RADIUS, FIGS, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from '../about/AboutSection';
import { YouFigure, YouLinkRow, YouSentence } from './youBits';

const CHART_HEIGHT = 74;

/** §3.3 — the member's eighteen holes. Not a sequence: eighteen comparisons. */
const MyHoleChart: React.FC<{ rows: MyHolePerformanceRow[] }> = ({ rows }) => {
  const sorted = [...rows].sort((a, b) => a.hole_no - b.hole_no);
  const max = Math.max(0.01, ...sorted.map((r) => Math.max(0, r.avg_to_par)));

  return (
    <div>
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${sorted.length}, minmax(0, 1fr))`,
          alignItems: 'end',
          gap: 3,
          height: CHART_HEIGHT,
        }}
      >
        {sorted.map((row) => {
          const value = Math.max(0, row.avg_to_par);
          const height = Math.max(2, (value / max) * CHART_HEIGHT);
          const strong = row.avg_to_par > 0.6;
          const overPar = row.avg_to_par > 0;
          return (
            <span
              key={row.hole_no}
              style={{
                display: 'block',
                width: '100%',
                height,
                borderRadius: BAR_RADIUS,
                background: overPar && !strong
                  ? `color-mix(in srgb, ${A.AMBER} 55%, transparent)`
                  : overPar
                    ? A.AMBER
                    : A.MUTE,
              }}
            />
          );
        })}
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
        <span>9</span>
        <span>18</span>
      </div>
    </div>
  );
};

interface Props {
  /** The member's rounds here — the gate, and the meta. */
  rounds: number;
  mine: MyHolePerformanceRow[];
  field: CourseHole[];
  onAllHoles: () => void;
}

/** §3.3 — five rounds before a hole-by-hole pattern is drawn. */
const MIN_ROUNDS = 5;

const WhereYourShotsGo: React.FC<Props> = ({ rounds, mine, field, onAllHoles }) => {
  const { t } = useTranslation('courses');
  const heading = t('courseDetail.youTab.sections.shotsGo');

  if (rounds < MIN_ROUNDS || mine.length === 0) {
    return (
      <AboutSection heading={heading}>
        <YouSentence quiet>
          {rounds <= 1
            ? t('courseDetail.youTab.shots.one')
            : t('courseDetail.youTab.shots.thin', { count: rounds, rounds: formatNumber(rounds) })}
        </YouSentence>
      </AboutSection>
    );
  }

  const worst = mine.reduce((m, r) => (r.avg_to_par > m.avg_to_par ? r : m), mine[0]);
  const fieldOnWorst = field.find((h) => h.hole_no === worst.hole_no)?.avg_to_par ?? null;
  const you = toParParts(worst.avg_to_par, 1);
  const theirs = toParParts(fieldOnWorst, 1);

  return (
    <AboutSection
      heading={heading}
      meta={t('courseDetail.plays.rounds', { count: rounds, rounds: formatNumber(rounds) })}
    >
      <MyHoleChart rows={mine} />

      <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
        <YouFigure label={t('courseDetail.youTab.shots.worstHole')} value={String(worst.hole_no)} />
        <YouFigure
          label={t('courseDetail.youTab.shots.youLose')}
          value={you ? you.text : '\u2014'}
          tone={A.AMBER_DEEP}
        />
        <YouFigure
          label={t('courseDetail.youTab.shots.fieldLoses')}
          value={theirs ? theirs.text : '\u2014'}
          tone={theirs ? theirs.tone : A.INK}
        />
      </div>

      <YouLinkRow
        label={t('courseDetail.plays.allHoles', { count: mine.length, holes: formatNumber(mine.length) })}
        sub={t('courseDetail.youTab.shots.allHolesSub')}
        onPress={onAllHoles}
      />
    </AboutSection>
  );
};

export default WhereYourShotsGo;
