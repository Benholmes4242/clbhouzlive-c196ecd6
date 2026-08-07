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

function tourFigColor(v: number | null | undefined): string {
  if (v == null || v === 0) return A.INK;
  return v < 0 ? TOUR_UNDER : A.INK;
}

/** "+0.41" / "−0.58" / "E" — two decimals, true minus. */
function fmtAvgToPar(v: number): string {
  const r = Number(v.toFixed(2));
  if (Math.abs(r) < 0.005) return 'E';
  if (r > 0) return `+${r.toFixed(2)}`;
  return `\u2212${Math.abs(r).toFixed(2)}`;
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

function Cell({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string | null;
}) {
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
      {sub && (
        <div
          style={{
            marginTop: 3,
            fontSize: 10.5,
            fontWeight: 600,
            color: A.BODY,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

interface LadderRow {
  hole: number;
  par: number;
  toPar: number;
}

/**
 * One ranked row. The bar's denominator is `maxAbs`, computed across ALL
 * eighteen holes by the caller — never within the three rows shown, which
 * would make the easiest hole's bar as long as the hardest hole's.
 */
function HoleRow({ r, maxAbs, first }: { r: LadderRow; maxAbs: number; first: boolean }) {
  const { t } = useTranslation('tourhub');
  const pct = Math.min(100, (Math.abs(r.toPar) / maxAbs) * 100);
  const over = r.toPar > 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        borderTop: first ? 'none' : `1px solid ${A.HAIRLINE}`,
      }}
    >
      <div style={{ width: 22, fontSize: 12.5, fontWeight: 800, color: A.INK, ...FIGS }}>
        {r.hole}
      </div>
      <div
        style={{
          width: 30,
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: A.DIM,
          whiteSpace: 'nowrap',
        }}
      >
        {t('overview.onTheCourse.parShort', { par: r.par })}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: 6,
          borderRadius: 2,
          background: 'rgba(14,18,22,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 2,
            background: over ? 'rgba(14,18,22,0.62)' : 'rgba(14,18,22,0.28)',
          }}
        />
      </div>
      <div
        style={{
          width: 46,
          textAlign: 'right',
          fontSize: 13,
          fontWeight: 800,
          color: A.INK,
          ...FIGS,
        }}
      >
        {fmtAvgToPar(r.toPar)}
      </div>
    </div>
  );
}

function HoleLadder({ rows }: { rows: HoleAverageRow[] }) {
  const { t } = useTranslation('tourhub');

  const all = useMemo<LadderRow[]>(
    () =>
      rows
        .map((r) => ({
          hole: r.hole_number,
          par: Number(r.par),
          toPar: Number(r.field_avg) - Number(r.par),
        }))
        .filter((r) => Number.isFinite(r.toPar)),
    [rows],
  );

  if (all.length < 3) return null;

  // Denominator spans EVERY hole with a figure, not the six rows shown.
  const maxAbs = Math.max(0.15, ...all.map((r) => Math.abs(r.toPar)));

  const desc = [...all].sort((a, b) => b.toPar - a.toPar);
  const hardest = desc.slice(0, 3);
  const easiest = all.length >= 6 ? [...all].sort((a, b) => a.toPar - b.toPar).slice(0, 3) : [];

  const gaps = missingRanges(new Set(all.map((r) => r.hole)));

  return (
    <div style={{ paddingTop: 8 }}>
      <Group label={t('overview.onTheCourse.playingHardest')} rows={hardest} maxAbs={maxAbs} />
      {easiest.length === 3 && (
        <div style={{ marginTop: 12 }}>
          <Group label={t('overview.onTheCourse.playingEasiest')} rows={easiest} maxAbs={maxAbs} />
        </div>
      )}
      {gaps && (
        <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, color: A.DIM, ...FIGS }}>
          {t('overview.onTheCourse.awaitingPlayers', { range: gaps })}
        </div>
      )}
    </div>
  );
}

function Group({ label, rows, maxAbs }: { label: string; rows: LadderRow[]; maxAbs: number }) {
  return (
    <div>
      <div
        style={{
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: A.MUTE,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      {rows.map((r, i) => (
        <HoleRow key={r.hole} r={r} maxAbs={maxAbs} first={i === 0} />
      ))}
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
            label={
              low && low.tied > 1
                ? t('overview.onTheCourse.sharedByLabel')
                : t('overview.onTheCourse.heldByLabel')
            }
            value={
              low
                ? low.tied > 1
                  ? t('overview.onTheCourse.nShare', { count: low.tied })
                  : shortPlayerName(low.playerName)
                : '—'
            }
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
