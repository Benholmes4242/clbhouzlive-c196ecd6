/**
 * LiveFieldPanel — the "On the course" analytical head (BRIEF_TOURHUB_ANALYTICAL
 * section 1, option B).
 *
 *   FIELD AVERAGE TODAY   +1.4  from 62 rounds in
 *   ---------------------------------------------
 *   LOW ROUND            UNDER PAR TODAY
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
  FIELD_GATE,
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

/**
 * Local to this file — not exported, and the counter strip below is its only
 * consumer, so the figure size moves outright to 26px (no size prop needed).
 */
function Cell({
  label,
  value,
  color,
  sub,
  align = 'left',
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string | null;
  align?: 'left' | 'right';
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: align }}>
      <div
        style={{
          fontSize: 25,
          fontWeight: 700,
          lineHeight: 1,
          color: color ?? A.INK,
          letterSpacing: '-0.03em',
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
          fontWeight: 700,
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
            fontSize: 12,
            fontWeight: 700,
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

const COL_HOLE = 20;
const COL_PAR = 26;
const COL_FIG = 44;
const ROW_GAP = 8;
const BAR_H = 7;

const HARDER_FILL = 'linear-gradient(to right, rgba(14,18,22,0.34), rgba(14,18,22,0.62))';
const EASIER_FILL = 'linear-gradient(to left, rgba(14,18,22,0.20), rgba(14,18,22,0.40))';

function HoleNumeral({ hole, par }: { hole: number; par: number }) {
  const { t } = useTranslation('tourhub');
  return (
    <>
      <div
        style={{
          width: COL_HOLE,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: A.INK,
          ...FIGS,
        }}
      >
        {hole}
      </div>
      <div
        style={{
          width: COL_PAR,
          fontSize: 6.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: A.DIM,
          whiteSpace: 'nowrap',
        }}
      >
        {t('overview.onTheCourse.parShort', { par })}
      </div>
    </>
  );
}

function Figure({ v }: { v: number }) {
  return (
    <div
      style={{
        width: COL_FIG,
        textAlign: 'right',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: A.INK,
        ...FIGS,
      }}
    >
      {fmtAvgToPar(v)}
    </div>
  );
}

/**
 * One row of the diverging chart. `maxAbs` is computed across ALL eighteen
 * holes by the caller — never within the rows shown, which would make the
 * easiest hole's bar as long as the hardest hole's. Half-width denominator
 * because the column now holds two directions off a shared centre baseline.
 */
function DivergingRow({ r, maxAbs, first }: { r: LadderRow; maxAbs: number; first: boolean }) {
  const pct = Math.min(50, (Math.abs(r.toPar) / maxAbs) * 50);
  const over = r.toPar > 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: ROW_GAP,
        padding: '8px 0',
        borderTop: first ? 'none' : `1px solid ${A.HAIRLINE}`,
      }}
    >
      <HoleNumeral hole={r.hole} par={r.par} />
      <div style={{ flex: 1, minWidth: 0, position: 'relative', height: BAR_H }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: A.HAIRLINE,
          }}
        />
        {pct > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: '100%',
              width: `${pct}%`,
              left: over ? '50%' : undefined,
              right: over ? undefined : '50%',
              background: over ? HARDER_FILL : EASIER_FILL,
              borderRadius: over ? '1px 4px 4px 1px' : '4px 1px 1px 4px',
            }}
          />
        )}
      </div>
      <Figure v={r.toPar} />
    </div>
  );
}

/** Fallback shape below six holes: plain left-aligned bar, no baseline. */
function PlainRow({ r, maxAbs, first }: { r: LadderRow; maxAbs: number; first: boolean }) {
  const pct = Math.min(100, (Math.abs(r.toPar) / maxAbs) * 100);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: ROW_GAP,
        padding: '8px 0',
        borderTop: first ? 'none' : `1px solid ${A.HAIRLINE}`,
      }}
    >
      <HoleNumeral hole={r.hole} par={r.par} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: BAR_H,
          borderRadius: 2,
          background: 'rgba(14,18,22,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: HARDER_FILL }} />
      </div>
      <Figure v={r.toPar} />
    </div>
  );
}

function AxisMarkers() {
  const { t } = useTranslation('tourhub');
  const label = {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: A.DIM,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: ROW_GAP, marginBottom: 6 }}>
      <div style={{ width: COL_HOLE }} />
      <div style={{ width: COL_PAR }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between' }}>
        <span style={label}>{t('overview.onTheCourse.axisEasier')}</span>
        <span style={label}>{t('overview.onTheCourse.axisHarder')}</span>
      </div>
      <div style={{ width: COL_FIG }} />
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

  // One continuously ranked list: hardest descending, then easiest ending at
  // the easiest hole of all.
  const merged = easiest.length === 3 ? [...hardest, ...[...easiest].reverse()] : hardest;

  const gaps = missingRanges(new Set(all.map((r) => r.hole)));

  return (
    <div style={{ paddingTop: 8 }}>
      {easiest.length === 3 ? (
        <>
          <AxisMarkers />
          {merged.map((r, i) => (
            <DivergingRow key={r.hole} r={r} maxAbs={maxAbs} first={i === 0} />
          ))}
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: 7.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: A.MUTE,
              marginBottom: 2,
            }}
          >
            {t('overview.onTheCourse.playingHardest')}
          </div>
          {merged.map((r, i) => (
            <PlainRow key={r.hole} r={r} maxAbs={maxAbs} first={i === 0} />
          ))}
        </>
      )}
      {gaps && (
        <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, color: A.DIM, ...FIGS }}>
          {t('overview.onTheCourse.awaitingPlayers', { range: gaps })}
        </div>
      )}
    </div>
  );
}



export function LiveFieldPanel({
  entries,
  round,
  tournamentId,
  live,
}: {
  entries: any[];
  round: number;
  tournamentId: string;
  live: boolean;
}) {
  const { t } = useTranslation('tourhub');
  const field = useMemo(() => fieldAverageToday(entries as any, round), [entries, round]);
  const low = useMemo(() => lowRoundToday(entries as any, round), [entries, round]);
  const { data: holeRows } = useTournamentHoleAverages(tournamentId || undefined, round, { live });
  const rows = holeRows ?? [];

  /**
   * Surnames of everyone on the low round — one name when outright, all of
   * them when shared. Read off the same completed-round figures lowRoundToday
   * used, so the set can never disagree with the figure above it.
   */
  const holders = useMemo(() => {
    if (!low) return [] as string[];
    const key = ['round_1', 'round_2', 'round_3', 'round_4'][round - 1];
    if (!key) return [] as string[];
    const names: string[] = [];
    for (const e of entries as any[]) {
      const v = e?.[key];
      if (v == null || Number(v) !== low.toPar) continue;
      if (e?.thru != null && e.thru < 18) continue;
      const full = (e?.player?.full_name ?? '').trim();
      if (!full) continue;
      const parts = full.split(/\s+/);
      names.push(parts[parts.length - 1]);
    }
    if (names.length === 0 && low.playerName) {
      const parts = low.playerName.trim().split(/\s+/);
      names.push(parts[parts.length - 1]);
    }
    return names;
  }, [entries, round, low]);


  useEffect(() => {
    if (!field || !tournamentId) return;
    analyticsEvents.track('tour_field_average_shown', {
      tournament_id: tournamentId,
      round,
      completed_count: field.count,
    });
  }, [field, tournamentId, round]);

  /**
   * The ladder's own gate (three holes with a finite figure) mirrored here, so
   * the rule above it is never drawn over a HoleLadder that returned null.
   */
  const hasLadder = useMemo(
    () =>
      rows.filter((r) => Number.isFinite(Number(r.field_avg) - Number(r.par))).length >= 3,
    [rows],
  );

  const hasStrip = !!field || !!low;

  if (!field && !low && !hasLadder) return null;

  return (
    <div style={{ padding: `0 ${SPACE.pagePadX}px 10px` }}>
      <div
        style={{
          background: A.PANEL,
          border: `1px solid ${A.BORDER}`,
          borderRadius: 16,
          padding: '18px 16px 14px',
        }}
      >
        {/* Headline */}
        {field && (
          <>
            <div
              style={{
                fontSize: 7.5,
                fontWeight: 700,
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
                  fontSize: 44,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 0.9,
                  color: tourFigColor(field.avg),
                  ...FIGS,
                }}
              >
                {formatToParAvg(field.avg)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: A.MUTE, ...FIGS }}>
                {t('overview.onTheCourse.fromNRoundsIn', { n: field.count })}
              </span>
            </div>
          </>
        )}

        {/* Counter strip — only when it has a figure of its own to carry. */}
        {hasStrip && (
          <>
            <div
              style={{
                // No block above => no rule, and no space reserved for one.
                marginTop: field ? 16 : 0,
                paddingTop: field ? 14 : 0,
                borderTop: field ? `1px solid ${A.HAIRLINE}` : undefined,
                display: 'flex',
                gap: 10,
              }}
            >
              {low && (
                <Cell
                  label={t('overview.onTheCourse.lowRoundLabel')}
                  value={formatToPar(low.toPar)}
                  color={tourFigColor(low.toPar)}
                  sub={holders.length > 0 ? holders.join(', ') : null}
                />
              )}
              {field && field.count > 0 && (
                <Cell
                  // A lone cell takes the row on its own, left-aligned.
                  align={low ? 'right' : 'left'}
                  label={t('overview.onTheCourse.underParTodayLabel')}
                  value={t('overview.onTheCourse.underParTodayValue', {
                    n: field.underPar,
                    m: field.count,
                  })}
                  sub={t('overview.onTheCourse.underParTodaySub')}
                />
              )}
            </div>
            {low && !field && (
              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 500, color: A.MUTE }}>
                {t('overview.onTheCourse.fieldAverageWaiting', { n: FIELD_GATE })}
              </div>
            )}
          </>
        )}

        {/* Ranked hole chart */}
        {hasLadder && (
          <div
            style={{
              marginTop: hasStrip ? 16 : 0,
              paddingTop: hasStrip ? 4 : 0,
              borderTop: hasStrip ? `1px solid ${A.HAIRLINE}` : undefined,
            }}
          >
            <HoleLadder rows={rows} />
          </div>
        )}


      </div>
    </div>
  );
}

export default LiveFieldPanel;
