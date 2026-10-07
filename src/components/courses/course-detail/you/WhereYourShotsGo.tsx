/**
 * BRIEF_YOU_TAB_REBUILD §3.3 — WHERE YOUR SHOTS GO.
 *
 * Under five rounds there is no chart, only a sentence that says why. At five
 * and over: eighteen bars of the member's OWN average over par, three figures,
 * the member's hardest hole, then the one drill-down.
 *
 * THE CHART IS LOCAL, AMBER, AND NOT ShapeChart. Amber because every bar is the
 * viewing member's own figure.
 *
 * TAPPABLE (BRIEF — THE CHARTS BECOME TAPPABLE, option A). Each bar is a
 * button whose hit area fills the chart height. Selection never uses the colour
 * channel — the fill already encodes the value — so the OTHER bars dim instead.
 * Selecting a hole replaces the three figures in place, inside a shared
 * min-height, so nothing below moves.
 *
 * The scoring distribution is the FIELD'S. It is shown only in the labelled
 * hardest-hole block, never under the member's selected-hole figures.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { A, BAR_RADIUS, FIGS, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { courseBucketShares } from '@/features/courses/components/holes/analytical/HoleRowV2';
import AboutSection, { ABOUT_KICKER } from '../about/AboutSection';
import { CompactHoleRow } from '../about/AllHolesSheet';
import { CourseDistributionSummary } from '../about/HowItPlays';
import CenteredStatStrip from '../about/CenteredStatStrip';
import { YouFigure, YouLinkRow, YouSentence } from './youBits';

const CHART_HEIGHT = 74;
/** Shared by the figures row and the selected-hole band so swapping never shifts the page. */
const BAND_MIN_HEIGHT = 74;
const DIMMED_OPACITY = 0.35;

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: A.DIM,
};

const MyHoleChart: React.FC<{
  rows: MyHolePerformanceRow[];
  selected: number | null;
  onSelect: (hole: number) => void;
}> = ({ rows, selected, onSelect }) => {
  const { t } = useTranslation('courses');
  const sorted = [...rows].sort((a, b) => a.hole_no - b.hole_no);
  const max = Math.max(0.01, ...sorted.map((r) => Math.max(0, r.avg_to_par)));

  return (
    <div>
      <div
        role="group"
        aria-label={t('courseDetail.youTab.sections.shotsGo')}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${sorted.length}, minmax(0, 1fr))`,
          gap: 3,
          height: CHART_HEIGHT,
        }}
      >
        {sorted.map((row) => {
          const value = Math.max(0, row.avg_to_par);
          const height = Math.max(2, (value / max) * CHART_HEIGHT);
          const strong = row.avg_to_par > 0.6;
          const overPar = row.avg_to_par > 0;
          const isSelected = selected === row.hole_no;
          const figure = toParParts(row.avg_to_par, 1)?.text ?? '';
          return (
            <button
              key={row.hole_no}
              type="button"
              aria-pressed={isSelected}
              aria-label={t('courseDetail.youTab.shots.barLabel', { hole: row.hole_no, value: figure })}
              onClick={() => onSelect(row.hole_no)}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '100%',
                padding: 0,
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  height,
                  borderRadius: BAR_RADIUS,
                  opacity: selected != null && !isSelected ? DIMMED_OPACITY : 1,
                  transition: 'opacity 160ms ease',
                  background: overPar && !strong
                    ? `color-mix(in srgb, ${A.AMBER} 50%, transparent)`
                    : overPar
                      ? A.AMBER
                      : A.MUTE,
                }}
              />
            </button>
          );
        })}
      </div>
      <div
        aria-hidden="true"
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
  courseId: string;
  /** The member's rounds here — the gate, and the meta. */
  rounds: number;
  mine: MyHolePerformanceRow[];
  field: CourseHole[];
  onAllHoles: () => void;
}

/** §3.3 — five rounds before a hole-by-hole pattern is drawn. */
const MIN_ROUNDS = 5;

const WhereYourShotsGo: React.FC<Props> = ({ courseId, rounds, mine, field, onAllHoles }) => {
  const { t } = useTranslation('courses');
  const [selected, setSelected] = useState<number | null>(null);
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

  const fieldByHole = new Map(field.map((h) => [h.hole_no, h]));
  const si = (n: number) => fieldByHole.get(n)?.stroke_index ?? Number.POSITIVE_INFINITY;

  /* C2 — the member's OWN hardest hole; ties break on the lower stroke index. */
  const worst = mine.reduce((m, r) =>
    r.avg_to_par > m.avg_to_par || (r.avg_to_par === m.avg_to_par && si(r.hole_no) < si(m.hole_no)) ? r : m,
  mine[0]);
  const worstField = fieldByHole.get(worst.hole_no) ?? null;
  const you = toParParts(worst.avg_to_par, 1);
  const theirs = toParParts(worstField?.avg_to_par ?? null, 1);

  const onSelect = (hole: number) => {
    if (selected === hole) {
      setSelected(null);
      return;
    }
    setSelected(hole);
    analyticsEvents.track('course_you_hole_selected', { course_id: courseId, hole_no: hole });
  };

  const sel = selected != null ? mine.find((r) => r.hole_no === selected) ?? null : null;
  const selField = sel ? fieldByHole.get(sel.hole_no) ?? null : null;

  const band = sel ? (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: A.INK, ...FIGS }}>
          {t('courseDetail.youTab.shots.holeN', { n: sel.hole_no })}
        </span>
        <span style={{ ...ABOUT_KICKER, flex: 1, minWidth: 0 }}>
          {selField?.stroke_index != null
            ? t('courseDetail.youTab.shots.parSi', { par: sel.par, si: selField.stroke_index })
            : t('courseDetail.youTab.shots.parOnly', { par: sel.par })}
        </span>
        <button
          type="button"
          onClick={() => setSelected(null)}
          style={{ ...ABOUT_KICKER, color: A.MUTE, background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
        >
          {t('courseDetail.youTab.clear')}
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <CenteredStatStrip
          items={[
            { label: t('courseDetail.plays.legendYou'), value: toParParts(sel.avg_to_par, 1)?.text ?? '\u2014', tone: A.AMBER_DEEP },
            {
              label: t('courseDetail.plays.legendField'),
              value: toParParts(selField?.avg_to_par ?? null, 1)?.text ?? '\u2014',
              tone: toParParts(selField?.avg_to_par ?? null, 1)?.tone ?? A.INK,
            },
            { label: t('courseDetail.youTab.shots.yourBest'), value: toParParts(sel.best_to_par, 0)?.text ?? '\u2014' },
            { label: t('courseDetail.youTab.shots.birdies'), value: formatNumber(sel.birdie_count) },
          ]}
        />
      </div>
    </div>
  ) : (
    <div style={{ display: 'flex', gap: 14 }}>
      <YouFigure label={t('courseDetail.youTab.shots.worstHole')} value={String(worst.hole_no)} />
      <YouFigure label={t('courseDetail.youTab.shots.youLose')} value={you ? you.text : '\u2014'} tone={A.AMBER_DEEP} />
      <YouFigure
        label={t('courseDetail.youTab.shots.fieldLoses')}
        value={theirs ? theirs.text : '\u2014'}
        tone={theirs ? theirs.tone : A.INK}
      />
    </div>
  );

  const shares = worstField ? courseBucketShares([worstField]) : null;

  return (
    <AboutSection
      heading={heading}
      meta={t('courseDetail.plays.rounds', { count: rounds, rounds: formatNumber(rounds) })}
    >
      <MyHoleChart rows={mine} selected={selected} onSelect={onSelect} />

      <div style={{ marginTop: 18, minHeight: BAND_MIN_HEIGHT }}>{band}</div>

      {worstField ? (
        <div>
          {/* The rule marks where the chart stops; the block groups with the link below. */}
          <AboutHairline style={{ marginTop: 18 }} />
          <div style={{ ...EYEBROW, marginTop: 14 }}>{t('courseDetail.youTab.shots.yourHardest')}</div>
          <div style={{ marginTop: 6 }}>
            <CompactHoleRow hole={worstField} mine={worst} hasYou last />
          </div>
          {shares ? <CourseDistributionSummary shares={shares} /> : null}
        </div>
      ) : null}

      <YouLinkRow
        label={t('courseDetail.plays.allHoles', { count: mine.length, holes: formatNumber(mine.length) })}
        sub={t('courseDetail.youTab.shots.allHolesSub')}
        onPress={onAllHoles}
        hairline={worstField ? false : undefined}
      />
    </AboutSection>
  );
};

export default WhereYourShotsGo;
