/**
 * TournamentHoleRow — the hole-by-hole row in the analytical treatment, for a
 * PROFESSIONAL field (BRIEF_TOUR_HOLE_BY_HOLE_ANALYTICAL).
 *
 * It follows HoleRowV2's rules and shares its positioning + ranking helpers
 * (markerOffset, rankHolesByDifficulty) rather than forking them. It is a
 * separate row because two of HoleRowV2's three jobs do not exist here:
 *
 *   - NO VIEWING MEMBER. No amber dot, no YOU figure, no YOU legend entry.
 *     Amber is reserved app-wide for the viewing member and there isn't one.
 *   - NO STROKE INDEX. stroke_index is always NULL for tournaments, so the
 *     column is dropped entirely rather than rendered blank. Absent renders
 *     nothing.
 *
 * Colour: every figure here is a COURSE-DIFFICULTY statistic, never a player's
 * score, so all of them take neutral ink. The tour convention (under par RED,
 * over par INK, level muted — tourhub/_shared/scoreColor.ts) applies to player
 * scores and is deliberately NOT used on this surface.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { TournamentHole } from '../data/useTournamentHoleAnalysis';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import {
  A, FIGS, Hairline, LABEL, SANS, toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import {
  BUCKETS,
  DistributionStrip,
  courseBucketShares,
  markerOffset,
  rankHolesByDifficulty,
  type BucketShares,
} from '@/features/courses/components/holes/analytical/HoleRowV2';
import { formatNumber } from '@/i18n/format';

export { DistributionStrip };
export type { BucketShares };

/**
 * The tournament surface's aggregate distribution, summed across the VISIBLE
 * holes of the current round filter. Delegates to the course page's
 * courseBucketShares so the two surfaces cannot compute the same four buckets
 * two different ways - the dist shape is identical, only the row type differs.
 */
export function tourBucketShares(holes: ReadonlyArray<TournamentHole>): BucketShares | null {
  return courseBucketShares(holes as unknown as CourseHole[]);
}

/** HoleRowV2's HOLE_GRID_V2 minus the SI column. Columns never size to content. */
export const TOUR_HOLE_GRID = '26px 26px 1fr';

/** The four most notable holes: two hardest, two easiest, hardest first. */
export const TOUR_PREVIEW_COUNT = 4;

/** Expanded detail is inset to the bar column so it reads as a footnote. */
const DETAIL_INSET = 42;

export interface TourHoleScale {
  /** Lower bound of the shared marker domain (to-par strokes, may be negative). */
  min: number;
  /** Upper bound of the shared marker domain. */
  max: number;
  rankByHole: Map<number, number>;
}

/**
 * ONE marker domain for every row on the surface, computed ACROSS ALL EIGHTEEN
 * holes so a tick further right always means a harder hole. Signed, unlike the
 * member scale: a professional field plays plenty of holes under par and
 * flooring the domain at zero would pin every one of them to the left edge.
 */
export function buildTourHoleScale(holes: ReadonlyArray<TournamentHole>): TourHoleScale {
  const played = holes.filter((h) => Number.isFinite(h.avg_to_par));
  const values = played.map((h) => h.avg_to_par);
  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 0.1;
  // Guarantee a usable span so a field that plays dead level cannot divide by ~0.
  const min = Math.min(rawMin, rawMax - 0.2);
  const max = Math.max(rawMax, min + 0.2);
  return { min, max, rankByHole: rankHolesByDifficulty(played) };
}

/**
 * Band mapping. Buckets, their key order AND their tones come from the course
 * page's BUCKETS (RAMP_TOPAR) - BRIEF_TOURNAMENT_HOLES_MATCH_COURSE. The
 * previous neutral RAMP made this surface answer the same question in grey and
 * is deliberately not used here any more. No second palette is defined.
 */
function bands(row: TournamentHole, t: (k: string) => string) {
  const d = (row.dist ?? {}) as unknown as Record<string, number>;
  return BUCKETS.map((b) => ({
    key: b.key,
    pctValue: b.keys.reduce((s, k) => s + (d[k as string] ?? 0), 0),
    bg: b.bg,
    label: t(b.labelKey),
  }));
}

/** Legend for the ramp. Rendered ONCE per surface, above the rows. */
export const TourHoleRampLegend: React.FC = () => {
  const { t } = useTranslation(['courses']);
  const items = BUCKETS.map((b) => ({ bg: b.bg, label: t(b.labelKey) }));
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
          <i style={{ width: 10, height: 6, borderRadius: 2, background: it.bg, display: 'block' }} />
          <span style={LABEL}>{it.label}</span>
        </span>
      ))}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
        <i style={{ width: 2, height: 10, background: A.BODY, display: 'block' }} />
        <span style={LABEL}>{t('courses:courseDetail.plays.legendField')}</span>
      </span>
    </div>
  );
};

export const TournamentHoleRow: React.FC<{
  row: TournamentHole;
  scale: TourHoleScale;
  totalHoles: number;
  open: boolean;
  onToggle: () => void;
  /** Last row on the surface: no trailing hairline. */
  last?: boolean;
}> = ({ row, scale, totalHoles, open, onToggle, last = false }) => {
  const { t } = useTranslation(['courses', 'tourhub']);
  // One decimal, matching the member row. Text only — the tone that
  // toParParts carries is the member green/red convention and is discarded:
  // difficulty is not a score.
  const field = toParParts(row.avg_to_par, 1);
  const rank = scale.rankByHole.get(row.hole_no) ?? null;

  const segs = bands(row, t as (k: string) => string);
  const total = segs.reduce((s, x) => s + x.pctValue, 0) || 1;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: 'grid',
          gridTemplateColumns: TOUR_HOLE_GRID,
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
        {/* AXIS: the hole number is a coordinate, not a headline. The AXIS floor
            is 10 and this sits ABOVE it at 15 — a floor is a minimum, so it holds
            where the grid put it, and its quiet BODY-adjacent tone is unchanged. */}
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}>
          {row.hole_no}
        </span>
        {/* AXIS: par is a COLUMN VALUE in a 26px fixed column, centred under no
            header — a coordinate. Already above the AXIS floor of 10, so it holds
            at 12. Yardage, by contrast, is a read figure (see DetailFigure). */}
        <span style={{ fontSize: 12, fontWeight: 700, color: A.BODY, textAlign: 'center', ...FIGS }}>
          {row.par}
        </span>

        <span style={{ display: 'block', minWidth: 0 }}>
          {/* Ramp bar with the field-average tick — the only marker here. */}
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
                  left: markerOffset(row.avg_to_par, scale.min, scale.max),
                  width: 2,
                  height: 13,
                  marginLeft: -1,
                  background: A.BODY,
                  borderRadius: 1,
                }}
              />
            )}
          </span>

          {/* Labelled figure. A bare number is never left to explain itself. */}
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
                <span style={LABEL}>
                  {t('courses:courseDetail.plays.legendField')}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: A.INK, ...FIGS }}>{field.text}</span>
              </span>
            )}
          </span>
        </span>
      </button>

      {open && (
        <div style={{ padding: `0 0 16px ${DETAIL_INSET}px` }}>
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
                    <span style={LABEL}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: A.INK, ...FIGS }}>
                      {Math.round(share)}%
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: A.TRACK }}>
                    <div
                      style={{ width: `${share}%`, height: '100%', borderRadius: 2, background: s.bg }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Hairline style={{ margin: '12px 0 10px' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', ...FIGS }}>
            {row.yards != null && (
              <DetailFigure
                label={t('courses:courseDetail.holes.yards')}
                value={formatNumber(row.yards)}
              />
            )}
            {rank != null && (
              <DetailFigure
                label={t('courses:courseDetail.holes.difficultyRank')}
                value={t('courses:courseDetail.holes.rankOf', { rank, total: totalHoles })}
              />
            )}
          </div>
        </div>
      )}

      {!last && <Hairline />}
    </div>
  );
};

const DetailFigure: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
    <span style={LABEL}>{label}</span>
    <span style={{ fontSize: 12.5, fontWeight: 700, color: A.INK, ...FIGS }}>{value}</span>
  </span>
);

export default TournamentHoleRow;
