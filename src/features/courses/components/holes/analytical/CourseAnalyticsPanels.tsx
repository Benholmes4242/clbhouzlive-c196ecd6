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
        fontWeight: 800,
        letterSpacing: '-0.02em',
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

/** Shape chart - bars are the field, the amber line is the member. */
const ShapeChart: React.FC<{
  holes: CourseHole[];
  myByHole: Map<number, MyHolePerformanceRow>;
  hardestHole: number;
  hasYou: boolean;
}> = ({ holes, myByHole, hardestHole, hasYou }) => {
  const W = 340;
  const H = 74;
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
  const barW = Math.max(5, slot - 6);
  const y = (v: number) => 4 + (1 - (v - domainMin) / span) * (H - 10);
  const yBase = y(0);

  const points = hasYou
    ? holes
        .map((h, i) => {
          const mine = myByHole.get(h.hole_no)?.avg_to_par;
          return mine == null ? null : `${i * slot + slot / 2},${y(mine)}`;
        })
        .filter((p): p is string => p !== null)
    : [];

  const axisIdx = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }} aria-hidden="true">
        {holes.map((h, i) => {
          const yv = y(h.avg_to_par);
          const top = Math.min(yv, yBase);
          const height = Math.max(2, Math.abs(yBase - yv));
          return (
            <rect
              key={h.hole_no}
              x={i * slot + (slot - barW) / 2}
              y={top}
              width={barW}
              height={height}
              rx={2}
              fill={h.hole_no === hardestHole ? A.BODY : A.TRACK}
            />
          );
        })}
        {points.length > 1 && (
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke={A.AMBER}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 2px 0' }}>
        {axisIdx.map((i) => (
          <span
            key={i}
            style={{ ...LABEL, fontSize: 8.5, color: i === n - 1 ? A.INK : A.DIM }}
          >
            {holes[i].hole_no}
          </span>
        ))}
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
        headerGap={10}
        style={{ padding: '12px 16px' }}
      >
        <ShapeChart
          holes={holes}
          myByHole={myByHole}
          hardestHole={stats.hardest.hole_no}
          hasYou={hasYou}
        />

        {/* Legend: what the bars are, and what the line is. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 10, height: 6, borderRadius: 2, background: A.TRACK }} />
            <span style={{ ...LABEL, fontSize: 8 }}>
              {t('courses:courseDetail.plays.legendField')}
            </span>
          </span>
          {hasYou && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i style={{ width: 12, height: 2, borderRadius: 1, background: A.AMBER }} />
              <span style={{ ...LABEL, fontSize: 8 }}>
                {t('courses:courseDetail.plays.legendYou')}
              </span>
            </span>
          )}
        </div>

        <Hairline style={{ margin: '10px 0 8px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <Figure
            label={t('courses:courseDetail.plays.fieldAvg')}
            value={field ? field.text : '\u2014'}
            tone={field ? field.tone : A.INK}
          />
          {hasYou && you ? (
            <Figure
              label={t('courses:courseDetail.plays.yourAvg')}
              value={you.text}
              tone={A.AMBER_DEEP}
            />
          ) : (
            <Figure
              label={t('courses:courseDetail.plays.toughestHole')}
              value={stats.hardest.hole_no}
            />
          )}
          {hasYou ? (
            <Figure
              label={t('courses:courseDetail.plays.youBeat')}
              value={`${stats.beat}/${stats.withYou}`}
            />
          ) : (
            <Figure
              label={t('courses:courseDetail.plays.easiestHole')}
              value={stats.easiest.hole_no}
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
                <Figure
                  key={c.key}
                  label={c.label}
                  value={
                    <>
                      {t('courses:courseDetail.plays.holeN', { hole: c.hole })}
                      <span style={{ color: c.tone, marginLeft: 6 }}>{c.text}</span>
                    </>
                  }
                />
              ))}
            </div>
          </>
        )}
      </Panel>

      {/* Block 3 - Hole by hole */}
      <Panel
        kicker={t('courses:holes.preview.eyebrow')}
        aside={t('courses:courseDetail.holes.tapHint')}
        footer={t('courses:holes.preview.seeAll', { count: holes.length })}
        onOpen={() => setHolesSheetOpen(true)}
        headerGap={10}
        style={{ padding: '12px 16px' }}
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
        maxHeight="90dvh"
        ariaLabelledBy="course-holes-sheet-title"
        style={{
          height: '75dvh',
          maxHeight: '75dvh',
          display: 'flex',
          flexDirection: 'column',
          background: A.PANEL,
        }}
      >
        <div style={{ padding: '0 16px 10px' }}>
          <div style={KICKER}>{t('courses:holes.preview.eyebrow')}</div>
          <h2
            id="course-holes-sheet-title"
            style={{ margin: '3px 0 6px', fontSize: 17, fontWeight: 800, color: A.INK }}
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
