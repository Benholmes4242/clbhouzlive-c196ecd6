/**
 * BoardTable — Tour Book leaderboard rows.
 *
 * TWO-LINE ROW. A single line carrying POS + name + R1..R4 + THRU + TOT does
 * not fit a full name on a 390pt device, so the row splits:
 *   LINE 1  POS (46) | PLAYER (1fr, wraps — never truncates) | TOT (52, right)
 *   LINE 2  six LABELLED cells, repeat(6, 1fr): R1 R2 R3 R4 THRU MOV
 * The labels are the point of the split: those figures were unlabelled
 * numerals before. Line 2 is indented 54 so it hangs under the name.
 *
 * Score colours resolved via getScoreColor (canonical to-par grammar:
 * red under par, ink over par, muted-gray even).
 *
 * TWO ABSENCES, TWO TREATMENTS.
 *  - MOV renders an EN DASH when the delta is zero or unavailable: holding
 *    your position IS a value, not an absence.
 *  - Every OTHER numeric cell (an unplayed round, a missing thru, a missing
 *    total) renders NOTHING. The grid holds the column, so the board stays
 *    aligned without placeholder dashes.
 * Deltas come from movementFromRounds using standard-competition ranking on
 * prior-round strokes. CUT/WD/DQ rows never show a delta at all.
 *
 * No horizontal rule is drawn between rows — alignment and whitespace
 * separate peers. The leader carries a faint wash; the CUT sentence keeps its
 * rule because it separates two GROUPS, not two peers.
 *
 * CUT sentence and CUT/WD/DQ demoted rows are inserted inline by
 * this component; the parent supplies cut state via props.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { movementFromRounds } from './movementFromRounds';
import CountryFlag from '@/components/ui/country-flag';
import { getScoreColor } from '../_shared/scoreColor';
import { TREND_UP, TREND_DOWN, AMBER, INK as TOUR_INK, INK_SOFT as TOUR_INK_SOFT, INK_FAINT as TOUR_INK_FAINT, SLATE_50 as TOUR_SLATE_50 } from '../_shared/tokens';
import { A, LABEL } from '@/features/courses/components/holes/analytical/tokens';

// Dark ramp, imported so the board follows the tour token file (was four pinned light literals).
const INK = TOUR_INK;
const SECONDARY = TOUR_INK_SOFT;
const MUTED = TOUR_INK_FAINT;
const HAIRLINE = 'rgba(255,255,255,0.12)';

const CANVAS = TOUR_SLATE_50;
/** Leader wash — the only per-row emphasis left on the board. */
const LEADER_WASH = 'rgba(255,255,255,0.05)';

const POS_NUM_W = 32;
const POS_MOVE_W = 20;
const NUM_W = 44;
/** Line-1 geometry, shared with the parent-rendered header. */
const POS_W = 46;
const TOT_W = 52;
/** MOV only: zero or unavailable movement is a STATEMENT, so it gets a mark. */
const MOV_DASH = '\u2013';


const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';


export interface BoardEntry {
  id: string;
  position: number | null;
  position_tied?: boolean | null;
  score: number | null;
  thru: number | null;
  today?: number | null;
  today_round?: number | null;
  status?: string | null;
  round_1?: number | null;
  round_2?: number | null;
  round_3?: number | null;
  round_4?: number | null;
  raw_data?: unknown;
  player?: {
    id: string;
    full_name: string;
    country_code?: string | null;
    country?: string | null;
    photo_url?: string | null;
  } | null;
}

export interface CutState {
  kind: 'none' | 'projected' | 'actual';
  cutline: number | null;
  extraCount: number;
}

interface Props {
  entries: BoardEntry[];
  cutState: CutState;
  currentRound?: number | null;
  onRowClick?: (entry: BoardEntry) => void;
}

function houseColor(score: number | null | undefined): string {
  if (score == null) return INK;
  return getScoreColor(score, 'dark');
}


/** Absent figures render NOTHING — the grid holds the column. */
function fmtScore(score: number | null | undefined): string {
  if (score == null) return '';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : String(score);
}

function fmtThru(thru: number | null | undefined): string {
  if (thru == null) return '';
  if (thru >= 18) return 'F';
  return String(thru);
}

export function todayFromEntry(
  e: BoardEntry,
  currentRound?: number | null,
): number | null {
  if (e.today != null) {
    if (
      e.today_round == null ||
      currentRound == null ||
      e.today_round === currentRound
    ) {
      return e.today;
    }
    return null;
  }
  // When we know the active round, read ONLY that round. Never fall back to
  // the previous round: a scheduled-but-not-started round must show a dash,
  // not yesterday's score under a TODAY heading.
  if (currentRound != null) {
    const byRound = [e.round_1, e.round_2, e.round_3, e.round_4][currentRound - 1];
    return byRound ?? null;
  }
  const roundNum = [e.round_1, e.round_2, e.round_3, e.round_4].filter(
    (r) => r != null,
  ).length;
  if (roundNum === 0) return null;
  const active =
    roundNum === 1
      ? e.round_1
      : roundNum === 2
      ? e.round_2
      : roundNum === 3
      ? e.round_3
      : e.round_4;
  return active ?? null;
}

export interface BoardColumns {
  rounds: number[];
  cellW: number;
  gap: number;
  liveRound: number | null;
  /** Movement column width: 20 when ANY row has movement, else 0. */
  moveW: number;
  /** POS + MOVE block width, for parent-rendered headers. */
  posBlockW: number;
}

/**
 * Adaptive per-round column spec. ONE source of truth shared by the row
 * renderer and by every parent-rendered column header, so the two can
 * never drift.
 */
export function computeBoardColumns(
  entries: BoardEntry[],
  currentRound?: number | null,
): BoardColumns {
  let highest = 0;
  for (const e of entries) {
    const rs = [e.round_1, e.round_2, e.round_3, e.round_4];
    for (let i = 0; i < 4; i++) if (rs[i] != null) highest = Math.max(highest, i + 1);
  }
  const n = Math.max(1, Math.min(4, Math.max(highest, currentRound ?? 0)));
  const rounds = Array.from({ length: n }, (_, i) => i + 1);
  const cellW = n >= 4 ? 24 : n === 3 ? 27 : 30;
  const gap = n >= 4 ? 4 : 6;
  // "Live" only once play has actually started in the current round.
  const started =
    currentRound != null &&
    entries.some((e) => todayFromEntry(e, currentRound) != null);
  // Movement column is reserved at the TABLE level only: either every row
  // gets the slot or none do, so player names never go ragged.
  const moves = boardMovementMap(entries, currentRound ?? null);
  let hasMovement = false;
  for (const e of entries) {
    if (isDemoted(e.status)) continue;
    const d = e.player?.id ? moves.get(e.player.id) : undefined;
    if (d != null && d !== 0) { hasMovement = true; break; }
  }
  const moveW = hasMovement ? POS_MOVE_W : 0;
  return {
    rounds,
    cellW,
    gap,
    liveRound: started ? currentRound! : null,
    moveW,
    posBlockW: POS_NUM_W + moveW,
  };
}

/** Shared movement source for both the column spec and the row renderer. */
export function boardMovementMap(entries: BoardEntry[], currentRound: number | null) {
  return movementFromRounds(
    entries.map((e) => ({
      id: e.id,
      playerId: e.player?.id ?? null,
      position: e.position,
      status: e.status ?? null,
      round_1: e.round_1 ?? null,
      round_2: e.round_2 ?? null,
      round_3: e.round_3 ?? null,
      round_4: e.round_4 ?? null,
    })),
    currentRound,
  );
}

export const BOARD_NUM_W = NUM_W;

/**
 * Header cells for the numeric block (R1..Rn | THRU | TOT). Rendered by the
 * parents inside their own header bar so typography stays theirs, while the
 * widths/centring come from computeBoardColumns.
 */
/** Fixed width of the R1..Rn block — never sized to its content. */
export function boardRoundsWidth(c: BoardColumns): number {
  return c.rounds.length * c.cellW + Math.max(0, c.rounds.length - 1) * c.gap;
}

/**
 * ONE grid template shared by the header row and LINE 1 of every body row, so
 * the two can never drift. The detail figures live on line 2 with their own
 * labels, so the header carries POS / PLAYER / TOT and nothing else.
 */
export function boardGridTemplate(_c: BoardColumns): string {
  return `${POS_W}px minmax(0,1fr) ${TOT_W}px`;
}

/**
 * Header cell for the answer column. R1..Rn and THRU are no longer header
 * columns — they are labelled in-row on line 2.
 */
export function BoardHeaderCells({
  totLabel,
}: {
  columns?: BoardColumns;
  totLabel: string;
}) {
  return (
    <div style={{ width: TOT_W, textAlign: 'right', whiteSpace: 'nowrap' }}>{totLabel}</div>
  );
}



function isDemoted(s?: string | null): boolean {
  if (!s) return false;
  const u = s.toUpperCase();
  return u === 'MC' || u === 'CUT' || u === 'WD' || u === 'DQ' || u === 'MDF' || u === 'DNS';
}

function statusWord(s?: string | null): string {
  const u = (s || '').toUpperCase();
  if (u === 'CUT' || u === 'MC') return 'CUT';
  if (u === 'MDF') return 'MDF';
  return u || '-';
}

export function BoardTable({ entries, cutState, currentRound, onRowClick }: Props) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();

  const columns = useMemo(
    () => computeBoardColumns(entries, currentRound),
    [entries, currentRound],
  );


  // Computed round-start deltas (empty in R1 / when unavailable).
  const movementMap = useMemo(
    () => boardMovementMap(entries, currentRound ?? null),
    [entries, currentRound],
  );

  // Partition: active rows first (in incoming order), demoted after.
  const { active, demoted, insertionIndex } = useMemo(() => {
    const act: BoardEntry[] = [];
    const dem: BoardEntry[] = [];
    for (const e of entries) (isDemoted(e.status) ? dem : act).push(e);

    let idx = act.length; // default: after all active rows
    if (cutState.kind === 'projected' && cutState.cutline != null) {
      // insert between last player at/inside the number and first outside
      const cutTot = cutState.cutline;
      idx = act.findIndex((e) => e.score != null && e.score > cutTot);
      if (idx < 0) idx = act.length;
    }
    return { active: act, demoted: dem, insertionIndex: idx };
  }, [entries, cutState]);

  const renderCutSentence = () => {
    if (cutState.kind === 'none') return null;
    const isProjected = cutState.kind === 'projected';
    const label = isProjected ? t('tour.projectedCut') : t('tour.cut');
    const cl = cutState.cutline;
    const numTxt =
      cl == null ? '' : cl === 0 ? 'E' : cl > 0 ? `+${cl}` : String(cl);
    // Players INSIDE the number: everyone above the insertion point when
    // projected, every non-demoted row once the cut is actual.
    const advanceCount = isProjected ? insertionIndex : active.length;
    return (
      <div
        key="__cut__"
        style={{
          background: 'rgba(255,255,255,0.04)',
          padding: '10px 16px',
          // The ONE horizontal rule left on the board: it separates two
          // GROUPS, not two peers.
          borderTop: `1px solid ${HAIRLINE}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: F,
        }}
      >
        <span style={{ ...LABEL, color: A.INK, flexShrink: 0 }}>{label}</span>
        <span aria-hidden style={{ flex: 1, height: 1, background: HAIRLINE }} />
        {numTxt && (
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: houseColor(cl),
              fontVariantNumeric: 'tabular-nums lining-nums',
              flexShrink: 0,
            }}
          >
            {numTxt}
          </span>
        )}
        {advanceCount > 0 && (
          <span style={{ ...LABEL, flexShrink: 0 }}>
            {t('tour.nAdvance', { count: advanceCount, n: String(advanceCount) })}
          </span>
        )}
      </div>
    );

  };

  /**
   * One labelled figure cell on line 2. The label sits over a fixed 16px-tall
   * figure box, so every figure on the board shares a baseline whether or not
   * it has a value.
   */
  const DetailCell = ({
    label,
    labelColor,
    children,
  }: {
    label: string;
    labelColor?: string;
    children?: React.ReactNode;
  }) => (
    <div style={{ minWidth: 0, textAlign: 'center' }}>
      <div
        style={{
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: labelColor ?? A.DIM,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {children}
      </div>
    </div>
  );

  const renderRow = (e: BoardEntry, opts?: { demoted?: boolean }) => {
    const demotedRow = !!opts?.demoted;
    const posText = demotedRow
      ? statusWord(e.status)
      : e.position == null
      ? ''
      : `${e.position_tied ? 'T' : ''}${e.position}`;
    const isLeader = !demotedRow && e.position === 1;
    const totColor = demotedRow ? SECONDARY : houseColor(e.score);
    const totalDisplay = fmtScore(e.score);
    const todayVal = todayFromEntry(e, currentRound);
    // THRU must agree with the live round: if the active round has not started
    // for this player, the stale top-level thru (yesterday's "F") is hidden.
    const thruEmpty = demotedRow || todayVal == null;
    const thruDisplay = thruEmpty ? '' : fmtThru(e.thru);
    const roundVals = [e.round_1, e.round_2, e.round_3, e.round_4];
    const cc = e.player?.country_code || e.player?.country || '';
    const pid = e.player?.id;
    const mov = !demotedRow && pid ? movementMap.get(pid) : undefined;



    return (
      <div
        key={e.id}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (onRowClick) return onRowClick(e);
          if (e.player?.id) navigate(`/tourhub/player/${e.player.id}`);
        }}
        onKeyDown={(k) => {
          if (k.key === 'Enter' || k.key === ' ') {
            if (onRowClick) return onRowClick(e);
            if (e.player?.id) navigate(`/tourhub/player/${e.player.id}`);
          }
        }}
        style={{
          padding: '11px 16px 12px',
          background: isLeader ? LEADER_WASH : CANVAS,
          opacity: demotedRow ? 0.55 : 1,
          cursor: 'pointer',
          fontFamily: F,
        }}
      >
        {/* LINE 1 — POS | PLAYER (wraps) | TOT */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: boardGridTemplate(columns),
            gap: 8,
            alignItems: 'baseline',
          }}
        >
          <div
            style={{
              fontSize: demotedRow ? 9 : 13,
              fontWeight: demotedRow ? 700 : isLeader ? 700 : 700,
              color: demotedRow ? SECONDARY : isLeader ? A.INK : A.BODY,
              fontVariantNumeric: 'tabular-nums lining-nums',
              letterSpacing: demotedRow ? '0.06em' : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            {posText}
          </div>

          {/* PLAYER — NEVER truncates. A long name takes a second line and the
              row grows; naming the player is the board's one job. */}
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '-0.015em',
                color: A.INK,
                overflowWrap: 'anywhere',
              }}
            >
              {e.player?.full_name || t('board.unknownPlayer')}
            </span>
            {cc && (
              <span style={{ marginLeft: 5, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
                <CountryFlag country={cc} size="sm" />
              </span>
            )}
          </div>

          {/* TOT — the answer column, right edge, largest figure in the row. */}
          <div
            style={{
              textAlign: 'right',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: totColor,
              fontVariantNumeric: 'tabular-nums lining-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {totalDisplay}
          </div>
        </div>

        {/* LINE 2 — six labelled cells, evenly distributed, hung under the name */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0,1fr))',
            gap: 4,
            marginLeft: 54,
            marginTop: 7,
          }}
        >
          {[1, 2, 3, 4].map((r) => {
            const isLive = columns.liveRound === r;
            const val = r === currentRound ? todayVal : roundVals[r - 1] ?? null;
            const settled = r < 4;
            return (
              <DetailCell
                key={r}
                label={`R${r}`}
                // AMBER on this page means THE LIVE ROUND, not the viewing
                // member. There is no viewing member on a tour board. Bounded,
                // local, deliberate — do not "correct" this to the app-wide rule.
                labelColor={r === 4 || isLive ? AMBER : undefined}
              >
                {val == null || demotedRow ? null : (
                  <span
                    style={{
                      fontSize: 12.5,
                      // History is settled; the live round is what is happening.
                      fontWeight: settled ? 600 : 700,
                      opacity: settled ? 0.55 : 1,
                      color: houseColor(val),
                    }}
                  >
                    {fmtScore(val)}
                  </span>
                )}
              </DetailCell>
            );
          })}

          <DetailCell label={t('board.columns.thru')}>
            {thruDisplay === '' ? null : (
              <span
                style={{
                  fontSize: 12.5,
                  // Still out there = a number, stated. Settled = a quiet 'F'.
                  fontWeight: thruDisplay === 'F' ? 600 : 700,
                  color: thruDisplay === 'F' ? A.DIM : A.BODY,
                }}
              >
                {thruDisplay}
              </span>
            )}
          </DetailCell>

          <DetailCell label={t('board.columns.mov')}>
            {(() => {
              // CUT/WD/DQ rows never show a delta at all — not even the dash.
              if (demotedRow) return null;
              // Zero or unavailable movement IS a statement: they held.
              if (mov == null || mov === 0) {
                return (
                  <span style={{ fontSize: 12, fontWeight: 700, color: A.DIM }}>{MOV_DASH}</span>
                );
              }
              const climbed = mov > 0;
              const n = Math.abs(mov);
              return (
                <span
                  aria-label={
                    climbed
                      ? t('board.movement.up', { count: n })
                      : t('board.movement.down', { count: n })
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    fontSize: 11,
                    fontWeight: 700,
                    color: climbed ? TREND_UP : TREND_DOWN,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  <span aria-hidden style={{ fontSize: 8 }}>
                    {climbed ? '\u25B2' : '\u25BC'}
                  </span>
                  {n}
                </span>
              );
            })()}
          </DetailCell>
        </div>
      </div>

    );
  };

  const parts: React.ReactNode[] = [];
  active.forEach((e, i) => {
    if (i === insertionIndex) parts.push(renderCutSentence());
    parts.push(renderRow(e));
  });
  if (insertionIndex >= active.length && cutState.kind !== 'none') {
    parts.push(renderCutSentence());
  }
  demoted.forEach((e) => parts.push(renderRow(e, { demoted: true })));

  return <div>{parts}</div>;
}

export default BoardTable;
