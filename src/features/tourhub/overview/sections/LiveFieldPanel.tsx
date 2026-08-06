/**
 * LiveFieldPanel — the "On the course" analytical head (BRIEF_TOURHUB_ANALYTICAL
 * section 1, option B).
 *
 *   FIELD AVERAGE TODAY   +1.4  from 62 rounds in
 *   ---------------------------------------------
 *   LOW ROUND  BY  ROUNDS IN  GROUPS
 *   ---------------------------------------------
 *   hole-shape chart (over par above the centre line, under par below)
 *
 * TOUR COLOUR RULE: under par is RED, level/over is INK. Deliberately the
 * opposite of the member-analytics surfaces — do not harmonise.
 *
 * The chart stops where the data stops: get_tournament_hole_averages omits
 * holes below its min-players gate, so mid-round the tail is genuinely absent
 * and gets a DIM note on the axis row rather than an interpolated bar.
 */
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SPACE } from '@/lib/spacing';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { TOUR_UNDER } from '../../_shared/TourStatusBlock';
import { useTournamentHoleAverages, type HoleAverageRow } from '../data/useTournamentHoleAverages';
import {
  fieldAverageToday,
  lowRoundToday,
  formatToParAvg,
  formatToPar,
  shortPlayerName,
} from '../data/liveRoundStats';

const AXIS_HOLES = [1, 5, 10, 14, 18];
const BAR_HALF = 22;

function tourFigColor(v: number | null | undefined): string {
  if (v == null || v === 0) return A.INK;
  return v < 0 ? TOUR_UNDER : A.INK;
}

/** "16-18" / "17" — contiguous ranges of the holes with no field figure yet. */
function missingRanges(present: Set<number>): string | null {
  const missing: number[] = [];
  for (let h = 1; h <= 18; h += 1) if (!present.has(h)) missing.push(h);
  if (missing.length === 0) return null;
  const parts: string[] = [];
  let start = missing[0];
  let prev = missing[0];
  for (let i = 1; i <= missing.length; i += 1) {
    const cur = missing[i];
    if (cur !== prev + 1) {
      parts.push(start === prev ? String(start) : `${start}-${prev}`);
      start = cur;
    }
    prev = cur;
  }
  return parts.join(', ');
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: color ?? A.INK,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...FIGS,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 3,
          fontSize: 7,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: A.DIM,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ShapeChart({ rows }: { rows: HoleAverageRow[] }) {
  const { t } = useTranslation('tourhub');

  const bars = useMemo(
    () =>
      rows.map((r) => ({
        hole: r.hole_number,
        toPar: Number(r.field_avg) - Number(r.par),
      })),
    [rows],
  );

  if (bars.length === 0) return null;

  const max = Math.max(0.15, ...bars.map((b) => Math.abs(b.toPar)));
  const hardest = bars.reduce((a, b) => (b.toPar > a.toPar ? b : a), bars[0]);
  const easiest = bars.reduce((a, b) => (b.toPar < a.toPar ? b : a), bars[0]);
  const present = new Set(bars.map((b) => b.hole));
  const gaps = missingRanges(present);
  const showCaption = bars.length >= 9 && hardest.hole !== easiest.hole;

  return (
    <div style={{ paddingTop: 10 }}>
      <div style={{ position: 'relative', height: BAR_HALF * 2 }}>
        {/* dashed centre line = level par */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: BAR_HALF,
            borderTop: `1px dashed ${A.HAIRLINE}`,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 3, height: '100%' }}>
          {bars.map((b) => {
            const h = Math.max(1.5, (Math.abs(b.toPar) / max) * BAR_HALF);
            const emphasis = b.hole === hardest.hole || b.hole === easiest.hole;
            const fill = emphasis ? 'rgba(14,18,22,0.62)' : 'rgba(14,18,22,0.20)';
            const over = b.toPar > 0;
            return (
              <div key={b.hole} style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: h,
                    background: fill,
                    borderRadius: 1,
                    ...(over ? { bottom: BAR_HALF } : { top: BAR_HALF }),
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Axis row */}
      <div
        style={{
          marginTop: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          {AXIS_HOLES.filter((h) => present.has(h)).map((h) => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: A.DIM, ...FIGS }}>
              {h}
            </span>
          ))}
        </div>
        {gaps && (
          <span style={{ fontSize: 9, fontWeight: 700, color: A.DIM, ...FIGS }}>
            {t('overview.onTheCourse.awaitingPlayers', { range: gaps })}
          </span>
        )}
      </div>

      {showCaption && (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: A.BODY, lineHeight: 1.4 }}>
          {t('overview.onTheCourse.shapeCaption', { hard: hardest.hole, easy: easiest.hole })}
        </div>
      )}
    </div>
  );
}

export function LiveFieldPanel({
  entries,
  round,
  tournamentId,
  groupCount,
  live,
}: {
  entries: any[];
  round: number;
  tournamentId: string;
  groupCount: number | null;
  live: boolean;
}) {
  const { t } = useTranslation('tourhub');
  const field = useMemo(() => fieldAverageToday(entries as any, round), [entries, round]);
  const low = useMemo(() => lowRoundToday(entries as any, round), [entries, round]);
  const { data: holeRows } = useTournamentHoleAverages(tournamentId || undefined, round, { live });
  const rows = holeRows ?? [];

  useEffect(() => {
    if (!field || !tournamentId) return;
    analyticsEvents.track('tour_field_average_shown', {
      tournament_id: tournamentId,
      round,
      completed_count: field.count,
    });
  }, [field, tournamentId, round]);

  if (!field && !low && rows.length === 0) return null;

  return (
    <div style={{ padding: `0 ${SPACE.pagePadX}px 10px` }}>
      <div
        style={{
          background: A.PANEL,
          border: `1px solid ${A.BORDER}`,
          borderRadius: 16,
          padding: '12px 14px 14px',
        }}
      >
        {/* Headline */}
        {field && (
          <>
            <div
              style={{
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: A.DIM,
              }}
            >
              {t('overview.onTheCourse.fieldAverageToday')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 2 }}>
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: tourFigColor(field.avg),
                  ...FIGS,
                }}
              >
                {formatToParAvg(field.avg)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: A.BODY }}>
                {t('overview.onTheCourse.fromNRoundsIn', { n: field.count })}
              </span>
            </div>
          </>
        )}

        {/* Counter strip */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: `1px solid ${A.HAIRLINE}`,
            display: 'flex',
            gap: 10,
          }}
        >
          <Cell
            label={t('overview.onTheCourse.lowRoundLabel')}
            value={low ? formatToPar(low.toPar) : '—'}
            color={low ? tourFigColor(low.toPar) : A.DIM}
          />
          <Cell
            label={t('overview.onTheCourse.byLabel')}
            value={
              low
                ? low.tied > 1
                  ? t('overview.onTheCourse.nShare', { count: low.tied })
                  : shortPlayerName(low.playerName)
                : '—'
            }
          />
          <Cell
            label={t('overview.onTheCourse.roundsInLabel')}
            value={field ? String(field.count) : '—'}
          />
          <Cell
            label={t('overview.onTheCourse.groupsLabel')}
            value={groupCount != null ? String(groupCount) : '—'}
          />
        </div>

        {/* Shape chart */}
        {rows.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 4, borderTop: `1px solid ${A.HAIRLINE}` }}>
            <ShapeChart rows={rows} />
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveFieldPanel;
