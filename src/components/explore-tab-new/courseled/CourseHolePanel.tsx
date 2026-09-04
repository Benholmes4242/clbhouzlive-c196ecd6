import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { useCourseHoleAnalysis, type CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { useMyHolePerformance, type MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import {
  A,
  DIFFICULTY_HARD_HEX,
  FIGS,
  KICKER,
  difficultyRampColor,
  toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import {
  DistributionStrip,
  courseBucketShares,
} from '@/features/courses/components/holes/analytical/HoleRowV2';
import { buildParTypeRows } from '@/features/courses/components/holes/analytical/CourseAnalyticsPanels';
import { SANS } from './tokens';

/**
 * HOW A COURSE PLAYS, INSIDE A DISCOVER ROW (BRIEF_COURSES_HOW_THEY_PLAYED S5-S7).
 *
 * THE SOURCE IS get_course_hole_analysis, LAZILY (S5.1) — the same RPC and the
 * same shapes that power the course detail page. NO NEW SQL.
 *
 * IT IS COURSE-WIDE AND IGNORES THE BOARD'S FILTERS (S5.2), so every block that
 * reads it states its own basis: "All N rounds here". Two unlabelled bases in one
 * panel is the exact fault removed from the course page this week.
 */

/** S7.1 — below this many hole-detail rounds there is no course picture. */
const SAMPLE_FLOOR = 5;

const CAP: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: A.DIM,
};

const BLOCK_TITLE: React.CSSProperties = {
  ...KICKER,
  fontSize: 10,
  color: A.INK,
};

export interface CourseHolePanelProps {
  courseId: string;
  userId: string | undefined;
  onCoursePress?: (courseId: string) => void;
}

export function CourseHolePanel({ courseId, userId, onCoursePress }: CourseHolePanelProps) {
  const { t } = useTranslation('courses');
  const analysis = useCourseHoleAnalysis(courseId);
  const mine = useMyHolePerformance(userId, courseId, { enabled: Boolean(userId) });

  const holes: CourseHole[] = analysis.data?.holes ?? [];
  const totalRounds = analysis.data?.total_rounds ?? 0;

  const myByHole = useMemo(() => {
    const m = new Map<number, MyHolePerformanceRow>();
    (mine.data ?? []).forEach((r) => m.set(r.hole_no, r));
    return m;
  }, [mine.data]);

  /* Acceptance 12 — nothing renders then swaps. Both reads settle first. */
  const settling = analysis.isPending || (Boolean(userId) && mine.isPending);
  if (settling) return null;

  /* S7.1 — the sample gate. A course with no hole data at all lands here too:
     get_course_hole_analysis returns available: false with zero rounds. */
  if (!analysis.data?.available || holes.length === 0 || totalRounds < SAMPLE_FLOOR) {
    return (
      <div style={{ ...CAP, padding: '2px 0 4px', lineHeight: 1.5 }}>
        {t(
          'discover.coursesPlayed.notEnoughDetail',
          '{{count}} rounds here carry hole detail \u2014 not enough for a course picture yet',
          { count: totalRounds },
        )}
      </div>
    );
  }

  const mineRows = holes
    .map((h) => myByHole.get(h.hole_no))
    .filter((r): r is MyHolePerformanceRow => r != null);
  const hasYou = mineRows.length > 0;
  const myRounds = mineRows.length > 0 ? Math.max(...mineRows.map((r) => Number(r.times_played) || 0)) : 0;
  /* S7.2 — THE FIELD-OF-ONE GUARD. The member IS the field, so FIELD AVG would
     be their own average renamed and the beat count 0/18 by arithmetic. */
  const fieldIsOnlyYou = hasYou && totalRounds > 0 && myRounds >= totalRounds;

  const fieldAvg = holes.reduce((s, h) => s + h.avg_to_par, 0) / holes.length;
  const yourAvg = hasYou ? mineRows.reduce((s, r) => s + r.avg_to_par, 0) / mineRows.length : null;
  const beat = holes.filter((h) => {
    const m = myByHole.get(h.hole_no);
    return m != null && m.avg_to_par < h.avg_to_par;
  }).length;
  const hardest = holes.reduce((m, h) => (h.avg_to_par > m.avg_to_par ? h : m), holes[0]);
  const easiest = holes.reduce((m, h) => (h.avg_to_par < m.avg_to_par ? h : m), holes[0]);

  const parRows = buildParTypeRows(holes, myByHole);
  const shares = courseBucketShares(holes);

  const basis = t('discover.coursesPlayed.allRoundsHere', 'All {{count}} rounds here', {
    count: totalRounds,
  });

  const field = toParParts(fieldAvg);
  const you = toParParts(yourAvg);

  return (
    <div style={{ fontFamily: SANS, ...FIGS }}>
      {/* BLOCK 1 — HOW IT PLAYS (S5.3). */}
      <Block title={t('discover.coursesPlayed.howItPlays', 'How it plays')} note={basis} first>
        <HoleChart
          holes={holes}
          myByHole={myByHole}
          hasYou={hasYou}
          fieldIsOnlyYou={fieldIsOnlyYou}
          initialHole={hardest.hole_no}
        />
        {!fieldIsOnlyYou && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: 14,
              marginTop: 10,
            }}
          >
            <InlineFigure
              label={t('courseDetail.plays.fieldAvg', 'Field avg')}
              value={field?.text ?? ''}
              tone={field?.tone ?? A.INK}
            />
            {hasYou && you && (
              <InlineFigure
                label={t('courseDetail.plays.yourAvg', 'Your avg')}
                value={you.text}
                tone={A.AMBER}
              />
            )}
            {hasYou && (
              <InlineFigure
                label={t('courseDetail.plays.youBeat', 'You beat field on')}
                value={`${beat}/${mineRows.length}`}
                tone={A.INK}
              />
            )}
          </div>
        )}
      </Block>

      {/* BLOCK 2 — HOW EACH PAR PLAYS (S5.4). */}
      {parRows.length > 0 && (
        <Block title={t('discover.coursesPlayed.howEachPar', 'How each par plays')} note={basis}>
          <ParBars rows={parRows} fieldIsOnlyYou={fieldIsOnlyYou} />
        </Block>
      )}

      {/* BLOCK 3 — HOLE BY HOLE (S5.5). */}
      <Block
        title={t('holes.preview.eyebrow', 'Hole by hole')}
        action={{
          label: t('discover.coursesPlayed.allHoles', 'All {{count}}', { count: holes.length }),
          onPress: () => onCoursePress?.(courseId),
        }}
      >
        {shares && <DistributionStrip shares={shares} />}
        <Extremes hardest={hardest} easiest={easiest} />
      </Block>
    </div>
  );
}

function Block({
  title,
  note,
  action,
  first,
  children,
}: {
  title: string;
  note?: string;
  action?: { label: string; onPress: () => void };
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderTop: first ? 'none' : `1px solid ${A.BORDER}`,
        padding: first ? '2px 0 12px' : '12px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={BLOCK_TITLE}>{title}</span>
        {note ? <span style={{ ...CAP, marginLeft: 'auto' }}>{note}</span> : null}
        {action ? (
          <button
            type="button"
            onClick={action.onPress}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: SANS,
              ...CAP,
              color: A.BODY,
            }}
          >
            {action.label}
            <ChevronRight size={12} aria-hidden />
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function InlineFigure({ label, value, tone }: { label: string; value: string; tone: string }) {
  if (!value) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
      <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: tone }}>
        {value}
      </span>
      <span style={CAP}>{label}</span>
    </span>
  );
}

/**
 * S6 — THE CHART IS INTERACTIVE. Tap or DRAG selects a hole; the readout above
 * holds its height at all times and OPENS ON THE HARDEST HOLE, so there is never
 * an empty readout and never a "tap a hole" helper.
 */
function HoleChart({
  holes,
  myByHole,
  hasYou,
  fieldIsOnlyYou,
  initialHole,
}: {
  holes: CourseHole[];
  myByHole: Map<number, MyHolePerformanceRow>;
  hasYou: boolean;
  fieldIsOnlyYou: boolean;
  initialHole: number;
}) {
  const { t } = useTranslation('courses');
  const [sel, setSel] = useState(() => Math.max(0, holes.findIndex((h) => h.hole_no === initialHole)));
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const pick = useCallback(
    (clientX: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width <= 0) return;
      const k = (clientX - r.left) / r.width;
      const i = Math.floor(k * holes.length);
      setSel(Math.max(0, Math.min(holes.length - 1, i)));
    },
    [holes.length],
  );

  const W = 340;
  const H = 74;
  /* Reserve a fixed label lane above the tallest possible bar. The plot starts
     below it, so the selected figure cannot clip or collide with the block
     heading/readout even when the hardest hole owns the domain maximum. */
  const TOP = 16;
  const n = holes.length;

  const values = holes.flatMap((h) => {
    const m = myByHole.get(h.hole_no)?.avg_to_par;
    return hasYou && m != null ? [h.avg_to_par, m] : [h.avg_to_par];
  });
  const domainMax = Math.max(0.1, ...values);
  const domainMin = Math.min(0, ...values);
  const span = Math.max(0.1, domainMax - domainMin);
  const slot = W / n;
  const barW = Math.max(4, slot - 4);
  const y = (v: number) => TOP + (1 - (v - domainMin) / span) * (H - TOP - 8);
  const yBase = y(0);
  const cx = (i: number) => i * slot + slot / 2;

  /* S5.6 — THE TINT IS THE COURSE'S OWN SPREAD, never an absolute scale. */
  const fieldVals = holes.map((h) => h.avg_to_par);
  const fMin = Math.min(...fieldVals);
  const fMax = Math.max(...fieldVals);
  const fSpan = Math.max(0.01, fMax - fMin);

  const linePts = hasYou
    ? holes
        .map((h, i) => {
          const m = myByHole.get(h.hole_no)?.avg_to_par;
          return m == null ? null : { x: cx(i), y: y(m) };
        })
        .filter((p): p is { x: number; y: number } => p !== null)
    : [];
  const linePath =
    linePts.length > 1
      ? linePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
      : '';

  const selHole = holes[sel];
  const selMine = myByHole.get(selHole.hole_no)?.avg_to_par ?? null;
  const selField = toParParts(selHole.avg_to_par);
  const selYou = toParParts(selMine);
  const dotY = selMine == null ? null : y(selMine);
  const selectedBarTop = Math.min(y(selHole.avg_to_par), yBase);

  return (
    <div>
      {/* S6.2 — the readout holds its height at all times. */}
      <div
        style={{
          minHeight: 20,
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 700, color: A.INK }}>
          {t('discover.coursesPlayed.holeN', 'Hole {{n}}', { n: selHole.hole_no })}
        </span>
        {hasYou && selYou && (
          <InlineFigure label={t('courseDetail.holes.colYou', 'You')} value={selYou.text} tone={A.AMBER} />
        )}
      </div>

      <div
        ref={wrapRef}
        role="presentation"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e.clientX);
        }}
        onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
        /* S6.5 — a horizontal drag reads the chart instead of scrolling. */
        style={{ position: 'relative', height: H, touchAction: 'none', cursor: 'pointer' }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
          style={{ display: 'block' }}
          aria-hidden="true"
        >
          {!fieldIsOnlyYou &&
            holes.map((h, i) => {
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
                  fill={difficultyRampColor((h.avg_to_par - fMin) / fSpan)}
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

        {/* Amendment A: the field figure is the sole selection indicator. */}
        {!fieldIsOnlyYou && selField && (
          <span
            className="tabular-nums"
            style={{
              position: 'absolute',
              left: `${(cx(sel) / W) * 100}%`,
              top: Math.max(0, selectedBarTop - 13),
              transform: 'translateX(-50%)',
              color: selField.tone,
              fontSize: 8.5,
              fontWeight: 700,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {selField.text}
          </span>
        )}

        {/* The amber dot moves to the member's value on the selected hole. */}
        {hasYou && dotY != null && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: `${(cx(sel) / W) * 100}%`,
              top: dotY,
              transform: 'translate(-50%, -50%)',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: A.AMBER,
              boxShadow: `0 0 0 2px ${A.PANEL}`,
            }}
          />
        )}
      </div>
    </div>
  );
}

function ParBars({
  rows,
  fieldIsOnlyYou,
}: {
  rows: ReturnType<typeof buildParTypeRows>;
  fieldIsOnlyYou: boolean;
}) {
  const { t } = useTranslation('courses');
  const domain = Math.max(0.2, ...rows.map((r) => r.field), ...rows.map((r) => r.you ?? 0));
  const fMin = Math.min(...rows.map((r) => r.field));
  const fMax = Math.max(...rows.map((r) => r.field));
  const fSpan = Math.max(0.01, fMax - fMin);
  const anyYou = !fieldIsOnlyYou && rows.some((r) => r.you != null);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {rows.map((r) => {
          const fig = toParParts(r.field);
          return (
            <div
              key={r.par}
              style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 40px',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: A.INK }}>
                {t('courseDetail.parTypes.parNPlural', { n: r.par, defaultValue: 'Par {{n}}s' })}
              </span>
              <span
                style={{
                  position: 'relative',
                  display: 'block',
                  height: 7,
                  borderRadius: 4,
                  background: A.TRACK,
                }}
              >
                <i
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${Math.max(2, Math.min(100, (Math.max(0, r.field) / domain) * 100))}%`,
                    borderRadius: 4,
                    background: difficultyRampColor((r.field - fMin) / fSpan),
                    display: 'block',
                  }}
                />
                {r.you != null && !fieldIsOnlyYou && (
                  <i
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: -3,
                      bottom: -3,
                      left: `${Math.min(100, (Math.max(0, r.you) / domain) * 100)}%`,
                      width: 2,
                      borderRadius: 1,
                      background: A.AMBER,
                      display: 'block',
                    }}
                  />
                )}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  textAlign: 'right',
                  color: fig ? fig.tone : A.INK,
                }}
              >
                {fig ? fig.text : ''}
              </span>
            </div>
          );
        })}
      </div>
      {!fieldIsOnlyYou && (
        <div style={{ ...CAP, marginTop: 9 }}>
          {t('discover.coursesPlayed.barIsField', 'Bar is the field')}
          {anyYou ? (
            <>
              {' \u00b7 '}
              {t('discover.coursesPlayed.tickIsYou', 'tick is you')}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * S5.7 — two centred columns: the label, the hole NUMBER large, and to the RIGHT
 * of the number a small labelled stack. A bare 1.4 beside a hole number says
 * nothing, so the figure carries FIELD AVG beneath it.
 */
function Extremes({ hardest, easiest }: { hardest: CourseHole; easiest: CourseHole }) {
  const { t } = useTranslation('courses');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 10 }}>
      <Extreme
        label={t('discover.coursesPlayed.hardest', 'Hardest')}
        hole={hardest}
        tone={DIFFICULTY_HARD_HEX}
      />
      <Extreme label={t('discover.coursesPlayed.easiest', 'Easiest')} hole={easiest} />
    </div>
  );
}

function Extreme({ label, hole, tone }: { label: string; hole: CourseHole; tone?: string }) {
  const { t } = useTranslation('courses');
  const fig = toParParts(hole.avg_to_par);
  return (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <div style={CAP}>{label}</div>
      <div
        style={{
          marginTop: 3,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          className="tabular-nums"
          style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.025em', color: A.INK, lineHeight: 1 }}
        >
          {hole.hole_no}
        </span>
        {fig && (
          <span style={{ textAlign: 'left' }}>
            <span
              className="tabular-nums"
              style={{ display: 'block', fontSize: 12, fontWeight: 700, color: tone ?? fig.tone, lineHeight: 1.1 }}
            >
              {fig.text}
            </span>
            <span style={{ ...CAP, display: 'block', fontSize: 8.5 }}>
              {t('courseDetail.plays.fieldAvg', 'Field avg')}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

export default CourseHolePanel;
