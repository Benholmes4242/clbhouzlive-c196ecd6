/**
 * HoleRowV2 - the hole-by-hole row in the analytical treatment
 * (BRIEF_COURSE_TAB_ANALYTICAL_V2, section 4).
 *
 * The row is a fixed grid: HOLE / PAR / SI / distribution + figures. The bar is
 * a NEUTRAL INK RAMP (light = birdie or better, dark = double or worse); colour
 * is reserved for the two figures beneath it. Two markers sit on the bar: a
 * BODY tick for the field average and, when the viewing member has played the
 * hole, an amber dot for theirs. Both are positioned against ONE shared scale
 * (scaleMax) computed across every hole on the course, so a marker further right
 * always means a harder hole.
 *
 * Derivation only - the rows come from get_course_hole_analysis and
 * get_my_hole_performance, both already loaded by the page.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { A, FIGS, Hairline, LABEL, RAMP, SANS, toParParts } from './tokens';

/** HOLE / PAR / SI / bar+figures. Load-bearing: columns never size to content. */
export const HOLE_GRID_V2 = '26px 26px 24px 1fr';

export const PREVIEW_COUNT_V2 = 4;

/** Expanded detail is inset to the bar column so it reads as a footnote. */
const DETAIL_INSET = 66;

export interface HoleScale {
  /** Upper bound of the shared marker scale (to-par strokes). Never below 0.1. */
  scaleMax: number;
  /** Hole number -> difficulty rank, 1 = hardest by field average. */
  rankByHole: Map<number, number>;
}

/**
 * Marker placement against a SHARED domain. Extracted so the tournament
 * hole row can share the positioning rule instead of forking it: the member
 * surface passes min = 0 (its averages are floored at 0.1 and clamp there),
 * the tour surface passes a signed domain because a professional field plays
 * many holes under par and those must not all pin to the left edge.
 */
export function markerOffset(value: number, min: number, max: number): string {
  const span = Math.max(0.0001, max - min);
  const ratio = Math.max(0, Math.min(1, (value - min) / span));
  return `${ratio * 100}%`;
}

/** Hole number -> difficulty rank, 1 = hardest by field average. Shared. */
export function rankHolesByDifficulty(
  holes: ReadonlyArray<{ hole_no: number; avg_to_par: number }>,
): Map<number, number> {
  const rankByHole = new Map<number, number>();
  [...holes]
    .sort((a, b) => b.avg_to_par - a.avg_to_par)
    .forEach((h, i) => rankByHole.set(h.hole_no, i + 1));
  return rankByHole;
}

/**
 * ONE scale for every marker on the page: the largest average on the course,
 * field or member, floored at 0.1 so a course that plays to par cannot divide
 * by zero. Ranks are derived here too so the row and the sheet agree.
 */
export function buildHoleScale(
  holes: CourseHole[],
  myByHole: Map<number, MyHolePerformanceRow>,
): HoleScale {
  const values: number[] = [];
  holes.forEach((h) => {
    if (Number.isFinite(h.avg_to_par)) values.push(h.avg_to_par);
    const mine = myByHole.get(h.hole_no)?.avg_to_par;
    if (mine != null && Number.isFinite(mine)) values.push(mine);
  });
  const scaleMax = Math.max(0.1, ...values, 0.1);

  return { scaleMax, rankByHole: rankHolesByDifficulty(holes) };
}

function pct(row: CourseHole, keys: (keyof CourseHole['dist'])[]): number {
  return keys.reduce((s, k) => s + (row.dist[k] ?? 0), 0);
}

function markerLeft(value: number, scaleMax: number): string {
  return markerOffset(value, 0, scaleMax);
}


/** Legend for the ink ramp. Rendered ONCE per surface, above the rows. */
export const HoleRampLegend: React.FC<{ hasYou: boolean }> = ({ hasYou }) => {
  const { t } = useTranslation(['courses']);
  const items = [
    { bg: RAMP.birdie, label: t('courses:holes.preview.legendBirdie') },
    { bg: RAMP.par, label: t('courses:holes.preview.legendPar') },
    { bg: RAMP.bogey, label: t('courses:holes.preview.legendBogey') },
    { bg: RAMP.double, label: t('courses:holes.preview.legendDouble') },
  ];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 10,
      }}
    >
      {items.map((it) => (
        <span key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <i
            style={{ width: 10, height: 6, borderRadius: 2, background: it.bg, display: 'block' }}
          />
          <span style={{ ...LABEL, fontSize: 8 }}>{it.label}</span>
        </span>
      ))}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
        <i style={{ width: 2, height: 10, background: A.BODY, display: 'block' }} />
        <span style={{ ...LABEL, fontSize: 8 }}>{t('courses:courseDetail.plays.legendField')}</span>
      </span>
      {hasYou && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <i
            style={{ width: 8, height: 8, borderRadius: 999, background: A.AMBER, display: 'block' }}
          />
          <span style={{ ...LABEL, fontSize: 8 }}>{t('courses:courseDetail.plays.legendYou')}</span>
        </span>
      )}
    </div>
  );
};

export const HoleRowV2: React.FC<{
  row: CourseHole;
  mine?: MyHolePerformanceRow | null;
  scale: HoleScale;
  totalHoles: number;
  open: boolean;
  onToggle: () => void;
  /** Last row on the surface: no trailing hairline. */
  last?: boolean;
}> = ({ row, mine = null, scale, totalHoles, open, onToggle, last = false }) => {
  const { t } = useTranslation(['courses']);
  const field = toParParts(row.avg_to_par);
  const you = toParParts(mine?.avg_to_par);
  const rank = scale.rankByHole.get(row.hole_no) ?? null;

  const segs = [
    {
      key: 'birdie',
      pctValue: pct(row, ['ace', 'albatross', 'eagle', 'birdie']),
      bg: RAMP.birdie,
      label: t('courses:holes.preview.legendBirdie'),
    },
    {
      key: 'par',
      pctValue: row.dist.par ?? 0,
      bg: RAMP.par,
      label: t('courses:holes.preview.legendPar'),
    },
    {
      key: 'bogey',
      pctValue: row.dist.bogey ?? 0,
      bg: RAMP.bogey,
      label: t('courses:holes.preview.legendBogey'),
    },
    {
      key: 'double',
      pctValue: row.dist.double ?? 0,
      bg: RAMP.double,
      label: t('courses:holes.preview.legendDouble'),
    },
  ];
  const total = segs.reduce((s, x) => s + x.pctValue, 0) || 1;

  const gap =
    mine?.avg_to_par != null && Number.isFinite(row.avg_to_par)
      ? toParParts(mine.avg_to_par - row.avg_to_par)
      : null;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: 'grid',
          gridTemplateColumns: HOLE_GRID_V2,
          alignItems: 'center',
          gap: 8,
          padding: '12px 0',
          width: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: SANS,
          textAlign: 'left',
          ...FIGS,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK }}>
          {row.hole_no}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: A.BODY, textAlign: 'center' }}>
          {row.par}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: A.DIM, textAlign: 'center' }}>
          {row.stroke_index ?? ''}
        </span>

        <span style={{ display: 'block', minWidth: 0 }}>
          {/* Ramp bar with the two scale markers on top. */}
          <span style={{ position: 'relative', display: 'block', paddingTop: 2 }}>
            <span
              style={{
                height: 7,
                borderRadius: 3,
                overflow: 'hidden',
                display: 'flex',
                background: A.TRACK,
              }}
            >
              {segs.map((s) => (
                <i key={s.key} style={{ width: `${(s.pctValue / total) * 100}%`, background: s.bg }} />
              ))}
            </span>
            {Number.isFinite(row.avg_to_par) && (
              <i
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: -1,
                  left: markerLeft(row.avg_to_par, scale.scaleMax),
                  width: 2,
                  height: 13,
                  marginLeft: -1,
                  background: A.BODY,
                  borderRadius: 1,
                }}
              />
            )}
            {mine?.avg_to_par != null && (
              <i
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 1,
                  left: markerLeft(mine.avg_to_par, scale.scaleMax),
                  width: 9,
                  height: 9,
                  marginLeft: -4.5,
                  borderRadius: 999,
                  background: A.AMBER,
                  boxShadow: `0 0 0 1.5px ${A.PANEL}`,
                }}
              />
            )}
          </span>

          {/* Labelled figures. A bare number is never left to explain itself. */}
          <span
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              marginTop: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {field && (
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ ...LABEL, fontSize: 7.5 }}>
                  {t('courses:courseDetail.plays.legendField')}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: field.tone }}>
                  {field.text}
                </span>
              </span>
            )}
            {you && (
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ ...LABEL, fontSize: 7.5 }}>
                  {t('courses:courseDetail.plays.legendYou')}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: A.AMBER_DEEP }}>
                  {you.text}
                </span>
              </span>
            )}
          </span>
        </span>
      </button>

      {open && (
        <div style={{ padding: `0 0 16px ${DETAIL_INSET}px` }}>
          {/* Proportional bands: each band's width is its own share. */}
          <div style={{ display: 'grid', gap: 8 }}>
            {segs.map((s) => {
              const share = (s.pctValue / total) * 100;
              return (
                <div key={s.key} style={{ display: 'grid', gap: 4 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span style={{ ...LABEL, fontSize: 8 }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: A.INK, ...FIGS }}>
                      {Math.round(share)}%
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: A.TRACK }}>
                    <div
                      style={{
                        width: `${share}%`,
                        height: '100%',
                        borderRadius: 2,
                        background: s.bg,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Hairline style={{ margin: '12px 0 10px' }} />

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 18px',
              ...FIGS,
            }}
          >
            {row.yards != null && (
              <DetailFigure label={t('courses:courseDetail.holes.yards')} value={String(row.yards)} />
            )}
            {rank != null && (
              <DetailFigure
                label={t('courses:courseDetail.holes.difficultyRank')}
                value={t('courses:courseDetail.holes.rankOf', { rank, total: totalHoles })}
              />
            )}
            {gap && (
              <DetailFigure
                label={t('courses:courseDetail.holes.yourGap')}
                value={gap.text}
                tone={gap.tone}
              />
            )}
          </div>
        </div>
      )}

      {!last && <Hairline />}
    </div>
  );
};

const DetailFigure: React.FC<{ label: string; value: string; tone?: string }> = ({
  label,
  value,
  tone = A.INK,
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
    <span style={{ ...LABEL, fontSize: 8 }}>{label}</span>
    <span style={{ fontSize: 12.5, fontWeight: 800, color: tone }}>{value}</span>
  </span>
);

export default HoleRowV2;
