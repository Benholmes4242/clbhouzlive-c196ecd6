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
import { useMyHolePerformance, type MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { A, FIGS, Hairline, KICKER, LABEL, Panel, toParParts } from './tokens';
import { HoleRampLegend, HoleRowV2, PREVIEW_COUNT_V2, buildHoleScale } from './HoleRowV2';

/** Labelled figure cell used by the How-it-plays strip and the extremes row. */
const Figure: React.FC<{ label: string; value: React.ReactNode; tone?: string; sub?: string }> = ({
  label,
  value,
  tone = A.INK,
  sub,
}) => (
  <div style={{ textAlign: 'center', minWidth: 0 }}>
    <div style={{ ...LABEL, fontSize: 8 }}>{label}</div>
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
      <div style={{ fontSize: 10.5, fontWeight: 600, color: A.BODY, marginTop: 2 }}>{sub}</div>
    ) : null}
  </div>
);



interface Props {
  courseId: string | undefined;
}

/**
 * Monotone cubic interpolation, Fritsch-Carlson tangents.
 *
 * Implemented here rather than pulled from d3 (curveMonotoneX) to avoid the
 * dependency: the guarantee we need is that the curve NEVER leaves the range
 * of its own data, so the member's line cannot dip under par on a hole they
 * bogeyed. A Catmull-Rom / naive spline overshoots exactly there.
 */
function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n < 2) return '';
  const dx: number[] = [];
  const dy: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    dy.push(pts[i + 1].y - pts[i].y);
    slope.push(dx[i] === 0 ? 0 : dy[i] / dx[i]);
  }
  // Initial tangents = average of neighbouring slopes.
  const m: number[] = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) m[i] = 0;
    else m[i] = (slope[i - 1] + slope[i]) / 2;
  }
  // Fritsch-Carlson limiter - clamps tangents so no segment overshoots.
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * slope[i];
      m[i + 1] = tau * b * slope[i];
    }
  }
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const c1x = pts[i].x + h;
    const c1y = pts[i].y + m[i] * h;
    const c2x = pts[i + 1].x - h;
    const c2y = pts[i + 1].y - m[i + 1] * h;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${pts[i + 1].x.toFixed(2)} ${pts[i + 1].y.toFixed(2)}`;
  }
  return d;
}

/** Shape chart - bars are the field, the amber line is the member. */
const ShapeChart: React.FC<{
  holes: CourseHole[];
  myByHole: Map<number, MyHolePerformanceRow>;
  hardestHole: number;
  hardestText: string;
  hasYou: boolean;
}> = ({ holes, myByHole, hardestHole, hardestText, hasYou }) => {
  const W = 340;
  const H = 116;
  /** Headroom for the hardest hole's own figure - the line shares it. */
  const TOP = 20;
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
  const y = (v: number) => TOP + 4 + (1 - (v - domainMin) / span) * (H - TOP - 10);
  const yBase = y(0);
  const cx = (i: number) => i * slot + slot / 2;

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

  // 1, 6, 12, 18 - the ends are read, the middles orient.
  const axisIdx = Array.from(
    new Set([0, Math.min(n - 1, 5), Math.min(n - 1, 11), n - 1]),
  ).sort((a, b) => a - b);

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
          <defs>
            <linearGradient id="hip-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E4E9EF" />
              <stop offset="100%" stopColor="#EEF2F6" />
            </linearGradient>
            <linearGradient id="hip-bar-ink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(14,18,22,0.78)" />
              <stop offset="100%" stopColor="rgba(14,18,22,0.62)" />
            </linearGradient>
          </defs>
          {holes.map((h, i) => {
            const yv = y(h.avg_to_par);
            const top = Math.min(yv, yBase);
            const height = Math.max(2, Math.abs(yBase - yv));
            const x = i * slot + (slot - barW) / 2;
            const r = Math.min(3, barW / 2);
            const rb = Math.min(1, barW / 2);
            const d = [
              `M ${x} ${top + r}`,
              `Q ${x} ${top} ${x + r} ${top}`,
              `L ${x + barW - r} ${top}`,
              `Q ${x + barW} ${top} ${x + barW} ${top + r}`,
              `L ${x + barW} ${top + height - rb}`,
              `Q ${x + barW} ${top + height} ${x + barW - rb} ${top + height}`,
              `L ${x + rb} ${top + height}`,
              `Q ${x} ${top + height} ${x} ${top + height - rb}`,
              'Z',
            ].join(' ');
            return (
              <path
                key={h.hole_no}
                d={d}
                fill={h.hole_no === hardestHole ? 'url(#hip-bar-ink)' : 'url(#hip-bar)'}
              />
            );
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

        {/* The hardest hole carries its own value. ONE label only. */}
        {hardestTopY != null && (
          <span
            style={{
              position: 'absolute',
              left: `${(cx(hardestIdx) / W) * 100}%`,
              top: Math.max(0, hardestTopY - 15),
              transform: 'translateX(-50%)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: A.INK,
              whiteSpace: 'nowrap',
              ...FIGS,
            }}
          >
            {hardestText}
          </span>
        )}

        {/* End dot in real pixels so it stays circular. */}
        {endPt && (
          <span
            style={{
              position: 'absolute',
              left: `${(endPt.x / W) * 100}%`,
              top: endPt.y,
              transform: 'translate(-50%, -50%)',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: A.AMBER,
              boxShadow: '0 0 0 2.5px #FFFFFF',
            }}
          />
        )}
      </div>

      <div style={{ position: 'relative', height: 12, margin: '9px 0 0' }}>
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
                fontSize: 8.5,
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


export const CourseAnalyticsPanels: React.FC<Props> = ({ courseId }) => {
  const { t } = useTranslation(['courses']);
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const { data } = useCourseHoleAnalysis(courseId);
  const { data: myPerf } = useMyHolePerformance(user?.id, courseId, {
    enabled: Boolean(user?.id && courseId && connection),
  });

  const [holesSheetOpen, setHolesSheetOpen] = useState(false);
  const [openHoles, setOpenHoles] = useState<Set<number>>(() => new Set());

  const holes = useMemo(
    () => [...(data?.holes ?? [])].sort((a, b) => a.hole_no - b.hole_no),
    [data?.holes],
  );
  const myByHole = useMemo(() => {
    const m = new Map<number, MyHolePerformanceRow>();
    (myPerf ?? []).forEach((r) => m.set(r.hole_no, r));
    return m;
  }, [myPerf]);

  const hasYou = myByHole.size > 0 && holes.some((h) => myByHole.has(h.hole_no));

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
    return { fieldAvg, yourAvg, beat, withYou: mineRows.length, hardest, easiest };
  }, [holes, myByHole]);

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

  if (!courseId || !data?.available || holes.length === 0 || !stats) return null;

  const totalRounds = data.total_rounds;
  const field = toParParts(stats.fieldAvg);
  const you = toParParts(stats.yourAvg);
  const beastFig = toParParts(stats.hardest.avg_to_par);
  const bestFig = toParParts(stats.easiest.avg_to_par);

  const scale = buildHoleScale(holes, myByHole);

  // Extremes are LABELLED, never carried by an emoji.
  const extremes = [
    beastFig
      ? {
          key: 'beast',
          label: t('courses:courseDetail.plays.toughestHole'),
          hole: stats.hardest.hole_no,
          text: beastFig.text,
          tone: beastFig.tone,
        }
      : null,
    bestFig
      ? {
          key: 'best',
          label: t('courses:courseDetail.plays.easiestHole'),
          hole: stats.easiest.hole_no,
          text: bestFig.text,
          tone: bestFig.tone,
        }
      : null,
  ].filter((c): c is NonNullable<typeof c> => c != null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
      {/* Block 2 - How it plays: the chart leads, the figures support it. */}
      <Panel
        kicker={t('courses:courseDetail.blocks.howItPlays')}
        aside={t('courses:courseDetail.plays.rounds', {
          count: totalRounds,
          rounds: formatNumber(totalRounds),
        })}
        headerGap={16}
        style={{ padding: '18px 16px 12px' }}
      >
        <ShapeChart
          holes={holes}
          myByHole={myByHole}
          hardestHole={stats.hardest.hole_no}
          hardestText={beastFig ? beastFig.text : ''}
          hasYou={hasYou}
        />

        {/* Legend: what the bars are, and what the line is. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 12, height: 6, borderRadius: 2, background: A.TRACK }} />
            <span style={{ ...LABEL, fontSize: 7 }}>
              {t('courses:courseDetail.plays.legendField')}
            </span>
          </span>
          {hasYou && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i style={{ width: 12, height: 2, borderRadius: 1, background: A.AMBER }} />
              <span style={{ ...LABEL, fontSize: 7 }}>
                {t('courses:courseDetail.plays.legendYou')}
              </span>
            </span>
          )}
        </div>

        <Hairline style={{ margin: '10px 0 8px' }} />

        {/* Toughest/easiest live ONLY in the pair beneath, with their figures. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: hasYou ? 'repeat(3, minmax(0, 1fr))' : '1fr',
          }}
        >
          <Figure
            label={t('courses:courseDetail.plays.fieldAvg')}
            value={field ? field.text : '\u2014'}
            tone={field ? field.tone : A.INK}
          />
          {hasYou && you && (
            <Figure
              label={t('courses:courseDetail.plays.yourAvg')}
              value={you.text}
              tone={A.AMBER_DEEP}
            />
          )}
          {hasYou && (
            <Figure
              label={t('courses:courseDetail.plays.youBeat')}
              value={`${stats.beat}/${stats.withYou}`}
            />
          )}
        </div>

        {extremes.length > 0 && (
          <>
            <Hairline style={{ margin: '8px 0' }} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${extremes.length}, minmax(0, 1fr))`,
                gap: 14,
              }}
            >
              {extremes.map((c) => (
                <div key={c.key} style={{ textAlign: 'center', minWidth: 0 }}>
                  <div style={{ ...LABEL, fontSize: 7.5 }}>{c.label}</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      color: A.INK,
                      marginTop: 3,
                      whiteSpace: 'nowrap',
                      ...FIGS,
                    }}
                  >
                    {t('courses:courseDetail.plays.holeN', { hole: c.hole })}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      color: c.tone,
                      marginTop: 4,
                      whiteSpace: 'nowrap',
                      ...FIGS,
                    }}
                  >
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </Panel>

      {/* Block 3 - Hole by hole */}
      <Panel
        kicker={t('courses:holes.preview.eyebrow')}
        action={{
          label: t('courses:holes.preview.seeAllShort', { count: holes.length }),
          onClick: () => setHolesSheetOpen(true),
        }}
        subline={
          totalRounds > 0
            ? t('courses:holes.preview.description', {
                holes: formatNumber(holes.length),
                count: totalRounds,
                rounds: formatNumber(totalRounds),
                personal: hasYou ? t('courses:holes.preview.personalClause') : '',
              })
            : t('courses:holes.preview.descriptionNoRounds', { holes: formatNumber(holes.length) })
        }

        headerGap={10}
        style={{ padding: '18px 16px 12px' }}
      >
        <HoleRampLegend hasYou={hasYou} />

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
          <div style={KICKER}>{t('courses:holes.preview.eyebrow')}</div>
          <h2
            id="course-holes-sheet-title"
            style={{ margin: '3px 0 6px', fontSize: 17, fontWeight: 700, color: A.INK }}
          >
            {t('courses:courseDetail.holes.sheetTitle')}
          </h2>
          <div style={LABEL}>
            {t('courses:courseDetail.holes.sheetSub', {
              count: totalRounds,
              rounds: formatNumber(totalRounds),
            })}
            {' \u00B7 '}
            {t('courses:courseDetail.holes.tapHint')}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 28px' }}>
          <HoleRampLegend hasYou={hasYou} />
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
            />
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default CourseAnalyticsPanels;
