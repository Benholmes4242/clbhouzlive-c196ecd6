/**
 * CourseAnalyticsPanels - Blocks 2 and 3 of the analytical Course tab.
 *
 *   Block 2 "How it plays": centred stat row (field avg / your avg / you beat
 *     field on) + the shape chart (hardest bar inked, scaled to max(field, you),
 *     no in-card legend) + the two extremes as centred cells.
 *   Block 3 "Hole by hole": column header, four-hole preview, 75dvh sheet with
 *     all holes. Same row component, shared expansion state.
 *
 * Client-only: every value comes from the queries that already fed the skyline
 * chart and the hole rows.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useCourseHoleAnalysis, type CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { useCourseProHoleAnalysis } from '@/hooks/gam/useCourseProHoleAnalysis';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';


import { useMyHolePerformance, type MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { A, FIGS, Hairline, KICKER, LABEL, Panel, difficultyRampColor, toParParts } from './tokens';
import { monotonePath, roundedCourseBarPath } from './chartGeometry';
import { ParTypeBars } from './ParTypeBars';
import {
  DistributionStrip,
  HoleRowV2,
  PREVIEW_COUNT_V2,
  buildHoleScale,
  courseBucketShares,
} from './HoleRowV2';


/** Labelled figure cell used by the How-it-plays strip and the extremes row. */
const Figure: React.FC<{ label: string; value: React.ReactNode; tone?: string; sub?: string }> = ({
  label,
  value,
  tone = A.INK,
  sub,
}) => (
  <div style={{ textAlign: 'center', minWidth: 0 }}>
    <div style={LABEL}>{label}</div>
    <div
      style={{
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: tone,
        marginTop: 3,
        whiteSpace: 'nowrap',
        ...FIGS,
      }}
    >
      {value}
    </div>
    {sub ? (
      <div style={{ fontSize: 11.5, fontWeight: 600, color: A.BODY, marginTop: 2 }}>{sub}</div>
    ) : null}
  </div>
);



interface Props {
  courseId: string | undefined;
}

/**
 * DIFFICULTY RAMP - one hue, varying intensity, across the course's OWN spread.
 *
 * Deliberately NOT the green/amber/red zone ramp used by the course card and
 * the handicap tile: amber on this panel means THE MEMBER (the line, the
 * your-avg figure, the legend swatch). Amber bars behind an amber line would
 * strip that colour of its one meaning. Red here reads DEMANDING, not bad -
 * the slope scale's convention.
 */
/* Values live in ./tokens as difficultyRampColor so the hole rows grade on the
   SAME ramp as this chart (BRIEF_HOLE_BY_HOLE_COLOUR §2). Unchanged tones. */
const rampColor = difficultyRampColor;

/**
 * Shape chart - graded bars are the field, the amber line is the member.
 *
 * THE EXTREMES ARE LABELLED ON THEIR OWN BARS (§A2). The hardest and easiest
 * holes are already drawn as the tallest and shortest bar here, so a sentence
 * naming them narrated the chart. Labels are DERIVED (max / min of the field's
 * per-hole average), the FIRST of any tie takes the label, and a FLAT chart
 * (max equals min) labels neither.
 */
const ShapeChart: React.FC<{
  holes: CourseHole[];
  myByHole: Map<number, MyHolePerformanceRow>;
  hardestHole: number;
  hardestText: string;
  /** To-par tone for the hardest figure (§2.2) - never the difficulty ramp. */
  hardestTone?: string;
  easiestHole: number;
  easiestText: string;
  easiestTone?: string;
  flat: boolean;
  hasYou: boolean;
  /** NO FIELD (BRIEF_HOW_IT_PLAYS_NO_FIELD): the pool is the viewer's own
   *  rounds, so the field bars would redraw the member's line under another
   *  name. Drop them; the line alone carries the shape. */
  fieldIsOnlyYou: boolean;
}> = ({
  holes,
  myByHole,
  hardestHole,
  hardestText,
  hardestTone = A.INK,
  easiestHole,
  easiestText,
  easiestTone = A.INK,
  flat,
  hasYou,
  fieldIsOnlyYou,
}) => {

  const W = 340;
  /** Condensed plot (BRIEF §6): 92 -> 78, headroom included. */
  const H = 78;
  /** Headroom for the hardest hole's own figure - the line shares it. */
  const TOP = 18;
  const n = holes.length;
  if (n === 0) return null;

  const values = holes.flatMap((h) => {
    const mine = myByHole.get(h.hole_no)?.avg_to_par;
    return hasYou && mine != null ? [h.avg_to_par, mine] : [h.avg_to_par];
  });
  const domainMax = Math.max(0.1, ...values);
  const domainMin = Math.min(0, ...values);
  const span = Math.max(0.1, domainMax - domainMin);

  const slot = W / n;
  const barW = Math.max(5, slot - 4);
  const y = (v: number) => TOP + 3 + (1 - (v - domainMin) / span) * (H - TOP - 8);
  const yBase = y(0);
  const cx = (i: number) => i * slot + slot / 2;

  // Bar tint spread: the course's own easiest -> hardest, not an absolute scale.
  const fieldVals = holes.map((h) => h.avg_to_par);
  const fMin = Math.min(...fieldVals);
  const fMax = Math.max(...fieldVals);
  const fSpan = Math.max(0.01, fMax - fMin);
  const tint = (v: number) => 0.06 + 0.94 * ((v - fMin) / fSpan);

  const linePts = hasYou
    ? holes
        .map((h, i) => {
          const mine = myByHole.get(h.hole_no)?.avg_to_par;
          return mine == null ? null : { x: cx(i), y: y(mine) };
        })
        .filter((p): p is { x: number; y: number } => p !== null)
    : [];
  const linePath = linePts.length > 1 ? monotonePath(linePts) : '';
  const endPt = linePts.length > 1 ? linePts[linePts.length - 1] : null;

  const hardestIdx = holes.findIndex((h) => h.hole_no === hardestHole);
  const hardestTopY = hardestIdx >= 0 ? Math.min(y(holes[hardestIdx].avg_to_par), yBase) : null;
  const easiestIdx = holes.findIndex((h) => h.hole_no === easiestHole);
  const easiestTopY = easiestIdx >= 0 ? Math.min(y(holes[easiestIdx].avg_to_par), yBase) : null;


  /* §4.1 - 1, 9, 18. THREE COORDINATES, NOT FOUR AND NOT EIGHTEEN: the ends are
     read, the turn orients, and anything more is a second chart competing with
     the first. PAR sits on its own row above the datum at the left. */
  const axisIdx = Array.from(new Set([0, Math.min(n - 1, 8), n - 1])).sort((a, b) => a - b);
  const datumLabelClearance = 24;

  return (
    <>
      {/* Overlays are positioned in REAL PIXELS: preserveAspectRatio="none"
          stretches the viewBox non-uniformly, so an SVG circle would render
          as an ellipse. */}
      <div style={{ position: 'relative', height: H }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
          style={{ display: 'block' }}
          aria-hidden="true"
        >
          {/* THE PAR DATUM (§4.2). FIRST CHILD, so bars, curve and dot all sit
              above it. Without a drawn zero, a level hole is a bar of no height
              with nothing to be level with. */}
          <line
            x1={datumLabelClearance}
            x2={W}
            y1={yBase}
            y2={yBase}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={0}
            y={yBase - 4}
            fill={A.DIM}
            fontSize={8.5}
            fontWeight={700}
            textAnchor="start"
          >
            PAR
          </text>
          {!fieldIsOnlyYou && holes.map((h, i) => {
            const yv = y(h.avg_to_par);
            const top = Math.min(yv, yBase);
            const height = Math.max(2, Math.abs(yBase - yv));
            const x = i * slot + (slot - barW) / 2;
            const d = roundedCourseBarPath(x, top, barW, height);
            return <path key={h.hole_no} d={d} fill={rampColor(tint(h.avg_to_par))} />;
          })}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={A.AMBER}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* THE TWO EXTREMES CARRY THEIR OWN FIGURES, each above its own bar.
            §2.2: BOTH obey the to-par law - over par is ink, under par is red -
            because the difficulty ramp is carried by the BARS. A red figure here
            used to mean "hardest" while a red figure everywhere else meant
            "under par", which is two meanings for one colour. */}
        {!flat && hardestTopY != null && hardestText && (
          <span
            style={{
              position: 'absolute',
              left: `${(cx(hardestIdx) / W) * 100}%`,
              top: Math.max(0, hardestTopY - 14),
              transform: 'translateX(-50%)',
              /* AXIS, STATED EXCEPTION (floor 10): a figure pinned to a point
                 on the curve, not a line of language. */
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: hardestTone,
              whiteSpace: 'nowrap',
              ...FIGS,
            }}
          >
            {hardestText}
          </span>
        )}
        {!flat && easiestTopY != null && easiestText && (
          <span
            style={{
              position: 'absolute',
              left: `${(cx(easiestIdx) / W) * 100}%`,
              top: Math.max(0, easiestTopY - 14),
              transform: 'translateX(-50%)',
              /* AXIS, STATED EXCEPTION (floor 10): a figure pinned to a point
                 on the curve, not a line of language. */
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: easiestTone,
              whiteSpace: 'nowrap',
              ...FIGS,
            }}
          >
            {easiestText}
          </span>
        )}


        {/* End dot in real pixels so it stays circular. Amber is the fill; the
            thin canvas stroke only separates it from the bar beneath. */}
        {endPt && (
          <span
            style={{
              position: 'absolute',
              left: `${(endPt.x / W) * 100}%`,
              top: endPt.y,
              transform: 'translate(-50%, -50%)',
              width: 6.8,
              height: 6.8,
              borderRadius: '50%',
              background: A.AMBER,
              border: `1.2px solid ${A.CANVAS}`,
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>

      <div style={{ position: 'relative', height: 11, margin: '7px 0 0' }}>
        {axisIdx.map((i) => {
          const end = i === 0 || i === n - 1;
          return (
            <span
              key={i}
              style={{
                ...LABEL,
                position: 'absolute',
                left: `${(cx(i) / W) * 100}%`,
                transform: 'translateX(-50%)',
                /* AXIS, STATED EXCEPTION (floor 10): hole numbers on the
                   chart's x-axis are coordinates and stay quiet. */
                fontSize: 10,
                fontWeight: end ? 700 : 600,
                color: end ? A.BODY : A.DIM,
              }}
            >
              {holes[i].hole_no}
            </span>
          );
        })}
      </div>
    </>
  );
};

/**
 * HOW EACH PAR PLAYS (§A4) - one row per par type PRESENT at this course.
 *
 * The bar is the FIELD's mean shots over par for that par type, on the demanding
 * ramp; the tick is the VIEWER's on the same track. Both derive from the
 * per-hole averages already loaded for the shape chart and the hole rows - no
 * new query, no hook, no SQL.
 *
 * COMMENSURABILITY: the viewer's tick renders ONLY where the viewer has an

 * average for EVERY hole of that par type, so the two sides derive identically
 * over the same holes. A par 6 or par 2 gets its own row and is never folded in.
 * A member with no rounds here sees the field alone - the course's own shape is
 * worth showing to someone who has never played it.
 */
export interface ParTypeRow {
  par: number;
  holes: number;
  field: number;
  you: number | null;
}

export function buildParTypeRows(
  holes: CourseHole[],
  myByHole: Map<number, MyHolePerformanceRow>,
): ParTypeRow[] {
  const byPar = new Map<number, CourseHole[]>();
  holes.forEach((h) => {
    if (h.par == null || !Number.isFinite(h.avg_to_par)) return;
    const list = byPar.get(h.par) ?? [];
    list.push(h);
    byPar.set(h.par, list);
  });
  return [...byPar.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([par, list]) => {
      const field = list.reduce((s, h) => s + h.avg_to_par, 0) / list.length;
      const mine = list.map((h) => myByHole.get(h.hole_no)?.avg_to_par ?? null);
      const complete = mine.every((v) => v != null && Number.isFinite(v));
      return {
        par,
        holes: list.length,
        field,
        you: complete ? (mine as number[]).reduce((s, v) => s + v, 0) / mine.length : null,
      };
    });
}

const ParTypePanel: React.FC<{ rows: ParTypeRow[]; fieldAvg: number; fieldIsOnlyYou: boolean }> = ({ rows, fieldIsOnlyYou }) => {
  const { t } = useTranslation(['courses']);
  if (rows.length === 0) return null;

  return (
    <Panel
      kicker={t('courses:courseDetail.parTypes.kicker')}
      headerGap={12}
      style={{ padding: '14px 13px 12px' }}
    >
      {/* ONE component with the Discover panel - BRIEF_BY_PAR_SIGNED_SCALE.
          No caption: with a signed, centred scale the amber tick and the side of
          the zero rule explain themselves. */}
      <ParTypeBars rows={rows} fieldIsOnlyYou={fieldIsOnlyYou} density="default" showYouFigure />
    </Panel>
  );
};


export const CourseAnalyticsPanels: React.FC<Props> = ({ courseId }) => {
  const { t } = useTranslation(['courses']);
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const { data } = useCourseHoleAnalysis(courseId);
  const { data: pro } = useCourseProHoleAnalysis(courseId);
  /* THE HERO'S OWN FIGURE. The hero counts every round posted at the course;
     this panel can only pool rounds that carry hole detail, so the two numbers
     sit inches apart and disagree. Reading the hero's number here lets the
     basis line say WHY. Same query key as the hero, so no extra request. */
  const { data: courseStats } = useCourseStatsDetail(courseId, true);
  const { data: myPerf } = useMyHolePerformance(user?.id, courseId, {
    enabled: Boolean(user?.id && courseId && connection),
  });


  const [holesSheetOpen, setHolesSheetOpen] = useState(false);
  const [openHoles, setOpenHoles] = useState<Set<number>>(() => new Set());
  /* The toggle exists only where pro data resolves and passes the par guard. */
  const proHoles = pro?.available ? (pro.holes ?? []) : [];
  const hasPro = proHoles.length > 0;
  const [view, setView] = useState<'members' | 'pros'>('members');
  const activeView = hasPro ? view : 'members';

  const holes = useMemo(
    () =>
      activeView === 'pros'
        ? ([...proHoles] as unknown as CourseHole[]).sort((a, b) => a.hole_no - b.hole_no)
        : [...(data?.holes ?? [])].sort((a, b) => a.hole_no - b.hole_no),
    [data?.holes, proHoles, activeView],
  );

  const myByHole = useMemo(() => {
    const m = new Map<number, MyHolePerformanceRow>();
    (myPerf ?? []).forEach((r) => m.set(r.hole_no, r));
    return m;
  }, [myPerf]);

  const hasYou = myByHole.size > 0 && holes.some((h) => myByHole.has(h.hole_no));

  const totalRounds =
    activeView === 'pros' ? (pro?.total_rounds ?? 0) : (data?.total_rounds ?? 0);

  /** Every round posted at this course - the hero's own ROUNDS figure. */
  const courseRoundsTracked = Number(courseStats?.rounds_tracked ?? 0);


  /* The member's own rows decide whether a field exists at all; until that
     query resolves the panel cannot know which anatomy to render. */
  const awaitingMine =
    activeView === 'members' && Boolean(user?.id && courseId && connection) && myPerf == null;

  const stats = useMemo(() => {
    if (holes.length === 0) return null;
    const fieldAvg = holes.reduce((s, h) => s + h.avg_to_par, 0) / holes.length;
    const mineRows = holes
      .map((h) => myByHole.get(h.hole_no))
      .filter((r): r is MyHolePerformanceRow => r != null);
    const yourAvg = mineRows.length > 0
      ? mineRows.reduce((s, r) => s + r.avg_to_par, 0) / mineRows.length
      : null;
    const beat = holes.filter((h) => {
      const mine = myByHole.get(h.hole_no);
      return mine != null && mine.avg_to_par < h.avg_to_par;
    }).length;
    const hardest = holes.reduce((m, h) => (h.avg_to_par > m.avg_to_par ? h : m), holes[0]);
    const easiest = holes.reduce((m, h) => (h.avg_to_par < m.avg_to_par ? h : m), holes[0]);
    /* NO FIELD (BRIEF_HOW_IT_PLAYS_NO_FIELD): the pool is only a field when it
       contains rounds beyond the viewer's own. times_played is the viewer's
       OWN round count per hole; total_rounds is every round in the pool. When
       the viewer's rounds account for the whole pool, FIELD AVG is their own
       average renamed and 0/18 means "you did not beat yourself". Members
       view only - the pros pool never contains the viewer. */
    const myRounds = Math.max(0, ...mineRows.map((r) => Number(r.times_played) || 0));
    const fieldIsOnlyYou =
      activeView === 'members' && hasYou && totalRounds > 0 && myRounds >= totalRounds;
    return { fieldAvg, yourAvg, beat, withYou: mineRows.length, hardest, easiest, fieldIsOnlyYou };
  }, [holes, myByHole, hasYou, totalRounds, activeView]);

  const toggle = (holeNo: number, surface: 'preview' | 'sheet') => {
    setOpenHoles((prev) => {
      const next = new Set(prev);
      if (next.has(holeNo)) {
        next.delete(holeNo);
      } else {
        next.add(holeNo);
        analyticsEvents.track('hole_row_expanded', {
          course_id: courseId,
          hole_no: holeNo,
          surface,
        });
      }
      return next;
    });
  };

  const sourceAvailable = activeView === 'pros' ? hasPro : Boolean(data?.available);
  if (!courseId || !sourceAvailable || holes.length === 0 || !stats) return null;

  /* HOLD UNTIL BOTH QUERIES SETTLE (acceptance §7): a connected member's own
     rows decide whether there IS a field, so render nothing rather than a
     field comparison that then disappears. */
  if (awaitingMine) return null;

  /* THE BASIS LINE states what was pooled - tournaments and player-rounds. */
  const basis =
    activeView === 'pros' ? (
      /* Two facts, two lines - tournaments tracked, then pro rounds pooled. */
      <span style={{ display: 'block', textAlign: 'right' }}>
        <span style={{ display: 'block' }}>
          {t('courses:courseDetail.proView.proTournaments', {
            count: pro?.total_tournaments ?? 0,
            tournaments: formatNumber(pro?.total_tournaments ?? 0),
          })}
        </span>
        <span style={{ display: 'block' }}>
          {t('courses:courseDetail.proView.proRounds', {
            count: totalRounds,
            rounds: formatNumber(totalRounds),
          })}
        </span>
      </span>
    ) : courseRoundsTracked > totalRounds ? (
      /* THE TWO NUMBERS DISAGREE, SO SAY SO. The hero's ROUNDS counts every
         round posted here; only rounds carrying hole detail can be pooled. */
      t('courses:courseDetail.plays.roundsWithDetail', {
        count: totalRounds,
        pooled: formatNumber(totalRounds),
        total: formatNumber(courseRoundsTracked),
      })
    ) : (
      t('courses:courseDetail.plays.rounds', {
        count: totalRounds,
        rounds: formatNumber(totalRounds),
      })
    );


  const field = toParParts(stats.fieldAvg);
  const you = toParParts(stats.yourAvg);
  const beastFig = toParParts(stats.hardest.avg_to_par);
  const bestFig = toParParts(stats.easiest.avg_to_par);

  const scale = buildHoleScale(holes, myByHole, totalRounds);

  /* A FLAT CHART LABELS NEITHER EXTREME (§A2). */
  const flatShape = stats.hardest.avg_to_par === stats.easiest.avg_to_par;

  /** §A4 and §A5 - both derived from the per-hole data already loaded. */
  const parRows = buildParTypeRows(holes, myByHole);
  const courseShares = courseBucketShares(holes);

  /* RECONCILIATION (§A4): each par type weighted by its hole count must return
     the field average this section states. Reported in dev when it does not. */
  if (import.meta.env.DEV && parRows.length > 0) {
    const wHoles = parRows.reduce((s, r) => s + r.holes, 0);
    const weighted = parRows.reduce((s, r) => s + r.field * r.holes, 0) / (wHoles || 1);
    const stated =
      holes.filter((h) => h.par != null && Number.isFinite(h.avg_to_par)).reduce((s, h) => s + h.avg_to_par, 0) /
      Math.max(1, holes.filter((h) => h.par != null && Number.isFinite(h.avg_to_par)).length);
    if (Math.abs(weighted - stated) > 0.005) {
      // eslint-disable-next-line no-console
      console.warn('[par-type reconciliation]', { weighted, stated, fieldAvg: stats.fieldAvg });
    }
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
      {/* GOLFERS / TOUR PROS — a segmented control in the tab's own pill shape. */}
      {hasPro && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(['members', 'pros'] as const).map((k) => {
              const on = activeView === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setView(k)}
                  aria-pressed={on}
                  style={{
                    appearance: 'none',
                    padding: '7px 15px',
                    borderRadius: 999,
                    border: on ? '1px solid transparent' : `1px solid ${A.BORDER}`,
                    background: on ? A.INK : A.PANEL,
                    color: on ? A.PANEL : A.MUTE,
                    fontSize: 12.5,
                    fontWeight: on ? 700 : 600,
                    lineHeight: 1,
                    cursor: 'pointer',
                  }}
                >
                  {t(`courses:courseDetail.proView.${k}`)}
                </button>
              );
            })}
          </div>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              lineHeight: 1.3,
              color: A.BODY,
            }}
          >
            {t(
              activeView === 'pros'
                ? 'courses:courseDetail.proView.prosSub'
                : 'courses:courseDetail.proView.membersSub',
            )}
          </div>
        </div>
      )}

      {/* Block 2 - How it plays: the chart leads, the figures support it. */}
      <Panel
        kicker={t('courses:courseDetail.blocks.howItPlays')}
        aside={basis}
        headerGap={12}
        style={{ padding: '14px 13px 11px' }}
      >

        <ShapeChart
          holes={holes}
          myByHole={myByHole}
          hardestHole={stats.hardest.hole_no}
          hardestText={beastFig ? beastFig.text : ''}
          hardestTone={beastFig ? beastFig.tone : A.INK}
          easiestHole={stats.easiest.hole_no}
          easiestText={bestFig ? bestFig.text : ''}
          easiestTone={bestFig ? bestFig.tone : A.INK}
          flat={flatShape}
          hasYou={hasYou}
          fieldIsOnlyYou={stats.fieldIsOnlyYou}
        />


        {/* THE COMPRESSION IS THE FINDING (Pros only): the chart is not rescaled,
            so a line states what the flatness means, derived from the average. */}
        {activeView === 'pros' && (
          <div style={{ ...LABEL, marginTop: 8, textTransform: 'none', letterSpacing: 0 }}>
            {Math.abs(stats.fieldAvg) <= 0.05
              ? t('courses:courseDetail.proView.fieldLevel')
              : t(
                  stats.fieldAvg > 0
                    ? 'courses:courseDetail.proView.fieldOver'
                    : 'courses:courseDetail.proView.fieldUnder',
                  { figure: field ? field.text : '' },
                )}
          </div>
        )}

        {/* Legend: member line only. */}
        {hasYou && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i style={{ width: 12, height: 2, borderRadius: 1, background: A.AMBER }} />
              <span style={{ ...LABEL, fontSize: 7 }}>
                {t('courses:courseDetail.plays.legendYou')}
              </span>
            </span>
          </div>
        )}


        {/* THE HARDEST / EASIEST SUMMARY LINE IS GONE (§A2) - both figures now sit
            on their own bars in the chart above, so the figures beneath carry only
            what the chart cannot say. */}
        {stats.fieldIsOnlyYou ? (
          /* NO FIELD: the pool is the member's own rounds, so FIELD AVG and
             YOU BEAT FIELD ON would judge them against themselves. Two true
             figures instead, and one line stating the fact about the pool. */
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {you && (
                <Figure
                  label={t('courses:courseDetail.plays.yourAvg')}
                  value={you.text}
                  tone={A.AMBER_DEEP}
                />
              )}
              <Figure
                label={t('courses:courseDetail.plays.roundsHere', 'Rounds here')}
                value={formatNumber(totalRounds)}
              />
            </div>
            <div style={{ ...LABEL, color: A.DIM, textAlign: 'center', marginTop: 8 }}>
              {t(
                'courses:courseDetail.plays.noFieldYet',
                'No one else has posted a hole-by-hole round here yet',
              )}
            </div>
          </>
        ) : hasYou ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <Figure
              label={t('courses:courseDetail.plays.fieldAvg')}
              value={field ? field.text : '\u2014'}
              tone={field ? field.tone : A.INK}
            />
            {you && (
              <Figure
                label={t('courses:courseDetail.plays.yourAvg')}
                value={you.text}
                tone={A.AMBER_DEEP}
              />
            )}
            <Figure
              label={t('courses:courseDetail.plays.youBeat')}
              value={`${stats.beat}/${stats.withYou}`}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <Figure
              label={t('courses:courseDetail.plays.fieldAvg')}
              value={field ? field.text : '\u2014'}
              tone={field ? field.tone : A.INK}
            />
          </div>
        )}
      </Panel>

      {/* §A4 - How each par plays, between How it plays and Hole by hole. */}
      <ParTypePanel rows={parRows} fieldAvg={stats.fieldAvg} fieldIsOnlyYou={stats.fieldIsOnlyYou} />


      {/* Block 3 - Hole by hole. THE NARRATION IS GONE (§A1): the columns beneath
          are labelled HOLE / PAR / SI / FIELD / YOU, and the section now opens
          with the WHOLE course's spread before the parts (§A5). */}
      <Panel
        kicker={t('courses:holes.preview.eyebrow')}
        action={{
          label: t('courses:holes.preview.seeAllShort', { count: holes.length }),
          onClick: () => setHolesSheetOpen(true),
        }}
        aside={totalRounds > 0 ? basis : undefined}

        headerGap={10}
        style={{ padding: '18px 16px 12px' }}
      >
        {courseShares && <DistributionStrip shares={courseShares} />}

        {holes.slice(0, PREVIEW_COUNT_V2).map((h, i, arr) => (
          <HoleRowV2
            key={h.hole_no}
            row={h}
            mine={myByHole.get(h.hole_no) ?? null}
            scale={scale}
            totalHoles={holes.length}
            open={openHoles.has(h.hole_no)}
            onToggle={() => toggle(h.hole_no, 'preview')}
            last={i === arr.length - 1}
            hasYou={hasYou}
            courseShares={courseShares}
          />
        ))}
      </Panel>

      <BottomSheet
        open={holesSheetOpen}
        onClose={() => setHolesSheetOpen(false)}
        variant="light"
        maxHeight="85dvh"
        ariaLabelledBy="course-holes-sheet-title"
        style={{
          height: 'auto',
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
          background: A.PANEL,
        }}
      >
        <div style={{ padding: '0 16px 10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={KICKER}>{t('courses:holes.preview.eyebrow')}</div>
            {/* THE ROUNDS COUNT IS META (§B2), right-aligned, the same treatment
                every other panel's sample size takes - not a sentence. */}
            {totalRounds > 0 && (
              <div style={{ ...LABEL, ...FIGS }}>{basis}</div>
            )}

          </div>
          <h2
            id="course-holes-sheet-title"
            style={{ margin: '3px 0 6px', fontSize: 17, fontWeight: 700, color: A.INK }}
          >
            {t('courses:courseDetail.holes.sheetTitle')}
          </h2>
          {/* THE INSTRUCTION SERVES ITS PURPOSE ONCE (§B2): after a hole has been
              opened it does not persist. */}
          {openHoles.size === 0 && (
            <div style={LABEL}>{t('courses:courseDetail.holes.tapHint')}</div>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 28px' }}>
          {courseShares && <DistributionStrip shares={courseShares} />}
          {holes.map((h, i, arr) => (
            <HoleRowV2
              key={h.hole_no}
              row={h}
              mine={myByHole.get(h.hole_no) ?? null}
              scale={scale}
              totalHoles={holes.length}
              open={openHoles.has(h.hole_no)}
              onToggle={() => toggle(h.hole_no, 'sheet')}
              last={i === arr.length - 1}
              hasYou={hasYou}
              courseShares={courseShares}
            />
          ))}
        </div>
      </BottomSheet>

    </div>
  );
};

export default CourseAnalyticsPanels;
