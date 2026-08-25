/**
 * TYPE — THE HERO EXCEPTION (BRIEF_TOUR_OVERVIEW_TYPE_SCALE, Part 2).
 * The hero is a broadcast surface. Tracked-out caps over photography read
 * larger than their point size, so a ticker segment, a band label or a rank
 * marker takes the AXIS floor of 10 rather than the READ floor of 11 — the
 * same exception granted to the scorecard axis and the chart ticks. It covers
 * COORDINATES AND MARKERS ONLY. It does NOT cover leader names, tournament
 * names, course names, scores, or any sentence: those are language and take
 * 11. Nothing goes below 10.
 */
/**
 * CourseShapePanel — the hole-shape chart, extracted verbatim in geometry from
 * the deleted LiveFieldPanel (bar geometry, centre line, "awaiting players"
 * caption, the same get_tournament_hole_averages call — NO NEW SQL) and
 * retinted for the dark hero block.
 *
 * COLOUR, AND A KNOWN COLLISION BEN ACCEPTED KNOWINGLY — DO NOT "FIX" IT:
 * on the board above, RED means UNDER PAR (good, a player's score). In this
 * chart RED means PLAYING HARD (bad, a course-difficulty axis) and GREEN means
 * easiest. Two meanings for one hue on one dark surface. It is tolerable
 * because the panel is COLLAPSED BY DEFAULT and carries its own EASIER /
 * HARDER headers. If it reads badly on device the fallback is a neutral ink
 * ramp on the bars with red/green kept on the figures only.
 *
 * The chart STOPS WHERE THE DATA STOPS: get_tournament_hole_averages omits
 * holes below its min-players gate, so mid-round the tail is genuinely absent
 * and gets the dim note — never an interpolated bar.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { WHITE_ALPHA_10, WHITE_ALPHA_55, WHITE_ALPHA_65, TOPAR_UNDER_DARK, FONT } from '../../../_shared/tokens';
import { useTournamentHoleAverages, type HoleAverageRow } from '../../../overview/data/useTournamentHoleAverages';

const FIGS = { fontVariantNumeric: 'tabular-nums' as const, fontFeatureSettings: '"kern" 1, "liga" 1' };

/** HARD is the tour red; EASIEST is the green used for good news on dark. */
const HARD = TOPAR_UNDER_DARK;
const EASY = '#55BD8B';

const COL_HOLE = 20;
const COL_PAR = 30;
const COL_FIG = 46;
const ROW_GAP = 8;
const BAR_H = 7;

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

interface LadderRow {
  hole: number;
  par: number;
  toPar: number;
}

function HoleNumeral({ hole, par }: { hole: number; par: number }) {
  const { t } = useTranslation('tourhub');
  return (
    <>
      <div style={{ width: COL_HOLE, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: '#FFFFFF', ...FIGS }}>
        {hole}
      </div>
      <div
        style={{
          width: COL_PAR,
          fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: WHITE_ALPHA_55,
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
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: v > 0 ? HARD : v < 0 ? EASY : WHITE_ALPHA_65,
        ...FIGS,
      }}
    >
      {fmtAvgToPar(v)}
    </div>
  );
}

/**
 * One row of the diverging chart. `maxAbs` is computed across ALL holes with a
 * figure by the caller — never within the rows shown, which would make the
 * easiest hole's bar as long as the hardest hole's.
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
        borderTop: first ? 'none' : `0.5px solid ${WHITE_ALPHA_10}`,
      }}
    >
      <HoleNumeral hole={r.hole} par={r.par} />
      <div style={{ flex: 1, minWidth: 0, position: 'relative', height: BAR_H }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: WHITE_ALPHA_10 }} />
        {pct > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: '100%',
              width: `${pct}%`,
              left: over ? '50%' : undefined,
              right: over ? undefined : '50%',
              background: over ? HARD : EASY,
              opacity: 0.85,
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
        borderTop: first ? 'none' : `0.5px solid ${WHITE_ALPHA_10}`,
      }}
    >
      <HoleNumeral hole={r.hole} par={r.par} />
      <div style={{ flex: 1, minWidth: 0, height: BAR_H, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: HARD, opacity: 0.85 }} />
      </div>
      <Figure v={r.toPar} />
    </div>
  );
}

function AxisMarkers() {
  const { t } = useTranslation('tourhub');
  const label = {
    fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: WHITE_ALPHA_55,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: ROW_GAP, marginBottom: 6 }}>
      <div style={{ width: COL_HOLE }} />
      <div style={{ width: COL_PAR }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...label, color: EASY }}>{t('overview.onTheCourse.axisEasier')}</span>
        <span style={{ ...label, color: HARD }}>{t('overview.onTheCourse.axisHarder')}</span>
      </div>
      <div style={{ width: COL_FIG }} />
    </div>
  );
}

/**
 * The fetch lives in a hook so the CALLER can decide whether the toggle is
 * offered at all — a control that opens onto nothing is worse than no control.
 */
export function useCourseShapeRows(tournamentId: string, round: number) {
  const { data } = useTournamentHoleAverages(tournamentId || undefined, round, { live: true });
  const rows: HoleAverageRow[] = data ?? [];
  const usable = rows.filter((r) => Number.isFinite(Number(r.field_avg) - Number(r.par))).length >= 3;
  return { rows, usable };
}

export function CourseShapePanel({
  rows,
}: {
  rows: HoleAverageRow[];
}) {
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

  const maxAbs = Math.max(0.15, ...all.map((r) => Math.abs(r.toPar)));
  const desc = [...all].sort((a, b) => b.toPar - a.toPar);
  const hardest = desc.slice(0, 3);
  const easiest = all.length >= 6 ? [...all].sort((a, b) => a.toPar - b.toPar).slice(0, 3) : [];
  const merged = easiest.length === 3 ? [...hardest, ...[...easiest].reverse()] : hardest;
  const gaps = missingRanges(new Set(all.map((r) => r.hole)));

  return (
    <div style={{ padding: '4px 16px 16px', fontFamily: FONT, borderTop: `0.5px solid ${WHITE_ALPHA_10}` }}>
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
              fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: WHITE_ALPHA_55,
              marginTop: 8,
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
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: WHITE_ALPHA_55, ...FIGS }}>
          {t('overview.onTheCourse.awaitingPlayers', { range: gaps })}
        </div>
      )}
    </div>
  );
}

export default CourseShapePanel;
