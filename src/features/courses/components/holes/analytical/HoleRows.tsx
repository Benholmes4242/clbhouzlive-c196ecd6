/**
 * Hole-by-hole rows for the analytical Course tab.
 *
 * One implementation shared by the inline preview and the 75dvh sheet - the
 * grid is load-bearing: with no row separators, columns holding their
 * positions is the only thing making the list scannable.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { DIST_SEG_COLORS } from '../HoleDataSheet';
import { A, LABEL, NUM, SANS, StatRow, toParParts } from './tokens';

export const HOLE_GRID = '26px 32px 32px 1fr 52px 48px';
/** Tournament variant: no stroke index (always null) and no viewing member. */
export const HOLE_GRID_TOURNAMENT = '26px 32px 1fr 56px';

/** Preview row count shared by the course panel and the tournament section. */
export const PREVIEW_COUNT = 4;

export type HoleRowVariant = 'course' | 'tournament';

function pct(row: CourseHole, keys: (keyof CourseHole['dist'])[]): number {
  return keys.reduce((s, k) => s + (row.dist[k] ?? 0), 0);
}


export const HoleColumnHeader: React.FC<{ variant?: HoleRowVariant }> = ({ variant = 'course' }) => {
  const { t } = useTranslation(['courses']);
  const tournament = variant === 'tournament';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: tournament ? HOLE_GRID_TOURNAMENT : HOLE_GRID,
        gap: 10,
        paddingBottom: 8,
      }}
    >
      <span style={{ ...LABEL, textAlign: 'center' }}>{t('courses:courseDetail.holes.colHole')}</span>
      <span style={{ ...LABEL, textAlign: 'center' }}>{t('courses:courseDetail.holes.colPar')}</span>
      {!tournament && (
        <span style={{ ...LABEL, textAlign: 'center' }}>{t('courses:courseDetail.holes.colSi')}</span>
      )}
      <span style={LABEL}>{t('courses:courseDetail.holes.colDist')}</span>
      <span style={{ ...LABEL, textAlign: 'right' }}>{t('courses:courseDetail.holes.colField')}</span>
      {!tournament && (
        <span style={{ ...LABEL, textAlign: 'right' }}>{t('courses:courseDetail.holes.colYou')}</span>
      )}
    </div>
  );
};

export const HoleRow: React.FC<{

  row: CourseHole;
  mine?: MyHolePerformanceRow | null;
  open: boolean;
  onToggle: () => void;
  variant?: HoleRowVariant;
}> = ({ row, mine = null, open, onToggle, variant = 'course' }) => {
  const tournament = variant === 'tournament';

  const { t } = useTranslation(['courses', 'tourhub']);
  const field = toParParts(row.avg_to_par);
  const you = toParParts(mine?.avg_to_par);


  const segs: { pctValue: number; bg: string; label: string }[] = [
    {
      pctValue: pct(row, ['ace', 'albatross', 'eagle', 'birdie']),
      bg: DIST_SEG_COLORS.birdie,
      label: t('courses:holes.preview.legendBirdie'),
    },
    { pctValue: row.dist.par ?? 0, bg: DIST_SEG_COLORS.par, label: t('courses:holes.preview.legendPar') },
    { pctValue: row.dist.bogey ?? 0, bg: DIST_SEG_COLORS.bogey, label: t('courses:holes.preview.legendBogey') },
    { pctValue: row.dist.double ?? 0, bg: DIST_SEG_COLORS.double, label: t('courses:holes.preview.legendDouble') },
  ];
  const total = segs.reduce((s, x) => s + x.pctValue, 0) || 1;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: 'grid',
          gridTemplateColumns: tournament ? HOLE_GRID_TOURNAMENT : HOLE_GRID,
          alignItems: 'center',
          gap: 10,
          padding: '9px 0',
          width: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: SANS,
          textAlign: 'left',
        }}
      >
        <span style={{ ...NUM, fontSize: 15, color: A.INK, textAlign: 'center' }}>{row.hole_no}</span>
        <span
          style={{
            fontFamily: SANS,
            fontVariantNumeric: 'tabular-nums lining-nums',
            fontSize: 12,
            fontWeight: 600,
            color: A.MUTE,
            textAlign: 'center',
          }}
        >
          {row.par}
        </span>
        {!tournament && (
          <span
            style={{
              fontFamily: SANS,
              fontVariantNumeric: 'tabular-nums lining-nums',
              fontSize: 12,
              fontWeight: 600,
              color: A.MUTE,
              textAlign: 'center',
            }}
          >
            {row.stroke_index ?? ''}
          </span>
        )}
        <span style={{ height: 5, borderRadius: 3, overflow: 'hidden', display: 'flex', background: A.TRACK }}>
          {segs.map((s) => (
            <i key={s.label} style={{ width: `${(s.pctValue / total) * 100}%`, background: s.bg }} />

          ))}
        </span>
        <span style={{ ...NUM, fontSize: 13, color: field?.tone ?? A.INK, textAlign: 'right' }}>
          {field?.text ?? ''}
        </span>
        {!tournament && (
          <span style={{ ...NUM, fontSize: 13, color: A.AMBER, textAlign: 'right' }}>{you?.text ?? ''}</span>
        )}

      </button>

      {open && (
        <div style={{ padding: '2px 0 14px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {segs.map((s) => (
              <div key={s.label} style={{ textAlign: 'center', minWidth: 0 }}>
                <div style={{ height: 3, borderRadius: 2, background: s.bg, marginBottom: 6 }} />
                <div style={LABEL}>{s.label}</div>
                <div style={{ ...NUM, fontSize: 15, color: A.INK, marginTop: 2 }}>
                  {Math.round((s.pctValue / total) * 100)}%
                </div>
              </div>
            ))}
          </div>
          <StatRow
            size={16}
            items={[
              ...(row.yards != null
                ? [{ label: t('courses:courseDetail.holes.yards'), value: row.yards }]
                : []),
              ...(field ? [{ label: t('courses:courseDetail.plays.fieldAvg'), value: field.text, tone: field.tone }] : []),
              ...(tournament
                ? [{ label: t('tourhub:tournament.course.colPlayers'), value: row.rounds }]
                : you
                ? [{ label: t('courses:courseDetail.plays.yourAvg'), value: you.text, tone: A.AMBER }]
                : []),

            ]}
          />
        </div>
      )}
    </div>
  );
};
