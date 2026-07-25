/**
 * BoardTable — Tour Book leaderboard rows.
 *
 * Columns: POS(32) + MOVE(20) = 52 left | PLAYER(flex) | THRU(44) | TODAY(44) | TOT(44)
 * Header rendered by parent (LeaderboardTab) with a single 52px POS
 * label; the delta lives inside that footprint so the outer layout
 * is unchanged.
 *
 * Score colours resolved via getScoreColor (canonical to-par grammar:
 * red under par, ink over par, muted-gray even).
 *
 * MOVEMENT COLUMN (live — computed round-start deltas).
 * POS is a two-slot cell: position (T-prefixed) in a 26px slot,
 * delta in an adjacent 20px slot. That guarantees deltas ('UP N' /
 * 'DN N') sit on the same vertical line whether the position is '1'
 * or 'T44'. Deltas come from movementFromRounds using standard-
 * competition ranking on prior-round strokes. Zero delta / no delta
 * renders empty (quiet board). CUT/WD/DQ rows never show a delta.
 *
 * CUT sentence and CUT/WD/DQ demoted rows are inserted inline by
 * this component; the parent supplies cut state via props.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { movementFromRounds } from './movementFromRounds';
import { countryFlag, countryFallback } from './countryFlag';
import { getScoreColor } from '../_shared/scoreColor';
import { TREND_UP, TREND_DOWN, AMBER } from '../_shared/tokens';

const INK = '#0F172A';
const SECONDARY = '#4B5563';
const MUTED = '#94A3B8';
const HAIRLINE = 'rgba(0,0,0,0.08)';
const BAND = 'rgba(31,36,40,0.03)';
const CANVAS = '#F8FAFC';

const POS_NUM_W = 32;
const POS_MOVE_W = 20;
const NUM_W = 44;

const F = 'Geist, system-ui, sans-serif';


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
  return getScoreColor(score, 'light');
}


function fmtScore(score: number | null | undefined): string {
  if (score == null) return '-';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : String(score);
}

function fmtThru(thru: number | null | undefined): string {
  if (thru == null) return '-';
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
  return { rounds, cellW, gap, liveRound: started ? currentRound! : null };
}

export const BOARD_NUM_W = NUM_W;

/**
 * Header cells for the numeric block (R1..Rn | THRU | TOT). Rendered by the
 * parents inside their own header bar so typography stays theirs, while the
 * widths/centring come from computeBoardColumns.
 */
export function BoardHeaderCells({
  columns,
  thruLabel,
  totLabel,
}: {
  columns: BoardColumns;
  thruLabel: string;
  totLabel: string;
}) {
  return (
    <>
      <div style={{ display: 'flex', gap: columns.gap, flexShrink: 0 }}>
        {columns.rounds.map((r) => (
          <div
            key={r}
            style={{
              width: columns.cellW,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              color: columns.liveRound === r ? AMBER : undefined,
            }}
          >
            {`R${r}`}
          </div>
        ))}
      </div>
      <div style={{ width: NUM_W, flexShrink: 0, textAlign: 'center', whiteSpace: 'nowrap' }}>{thruLabel}</div>
      <div style={{ width: NUM_W, flexShrink: 0, textAlign: 'center', whiteSpace: 'nowrap' }}>{totLabel}</div>
    </>
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
    () =>
      movementFromRounds(
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
        currentRound ?? null,
      ),
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
    const label = isProjected ? t('board.cut.projected') : t('board.cut.actual');
    const cl = cutState.cutline;
    const numTxt =
      cl == null ? '' : cl === 0 ? 'E' : cl > 0 ? `+${cl}` : String(cl);
    const extraTxt =
      cutState.extraCount > 0 ? ` (+${cutState.extraCount})` : '';
    return (
      <div
        key="__cut__"
        style={{
          background: BAND,
          padding: '10px 16px',
          borderTop: `1px solid ${HAIRLINE}`,
          borderBottom: `1px solid ${HAIRLINE}`,
          fontFamily: F,
          fontSize: 9.5,
          fontWeight: 700,
          color: SECONDARY,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
        {numTxt ? (
          <>
            {' '}
            <span style={{ fontWeight: 800, color: INK }}>
              {numTxt}
              {extraTxt}
            </span>
          </>
        ) : null}
      </div>
    );
  };

  const renderRow = (e: BoardEntry, opts?: { demoted?: boolean }) => {
    const demotedRow = !!opts?.demoted;
    const posText = demotedRow
      ? statusWord(e.status)
      : e.position == null
      ? '-'
      : `${e.position_tied ? 'T' : ''}${e.position}`;
    const totColor = demotedRow ? SECONDARY : houseColor(e.score);
    const totalDisplay = fmtScore(e.score);
    const todayVal = todayFromEntry(e, currentRound);
    // THRU must agree with the live round: if the active round has not started
    // for this player, the stale top-level thru (yesterday's "F") is hidden.
    const thruDisplay = todayVal == null ? '-' : fmtThru(e.thru);
    const roundVals = [e.round_1, e.round_2, e.round_3, e.round_4];
    const cc = e.player?.country_code || e.player?.country || '';


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
          display: 'flex',
          alignItems: 'center',
          padding: '8.5px 16px',
          borderBottom: `1px solid ${HAIRLINE}`,
          background: CANVAS,
          opacity: demotedRow ? 0.55 : 1,
          cursor: 'pointer',
          fontFamily: F,
        }}
      >
        {/* POS + MOVE — two fixed sub-slots so deltas align across all rows */}
        <div
          style={{
            width: POS_NUM_W,
            flexShrink: 0,
            fontSize: demotedRow ? 9 : 12.5,
            fontWeight: demotedRow ? 800 : 700,
            color: INK,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: demotedRow ? '0.06em' : undefined,
          }}
        >
          {posText}
        </div>
        <div
          style={{
            width: POS_MOVE_W,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          {(() => {
            if (demotedRow) return null;
            const pid = e.player?.id;
            const d = pid ? movementMap.get(pid) : undefined;
            if (d == null || d === 0) return null;
            const climbed = d > 0;
            const n = Math.abs(d);
            return (
              <span
                aria-label={climbed ? t('board.movement.up', { count: n }) : t('board.movement.down', { count: n })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  fontFamily: F,
                  fontSize: 8.5,
                  fontWeight: 800,
                  color: climbed ? TREND_UP : TREND_DOWN,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em',
                }}
              >
                <span aria-hidden style={{ fontSize: 8 }}>
                  {climbed ? '\u25B2' : '\u25BC'}
                </span>
                {n}
              </span>
            );
          })()}
        </div>


        {/* PLAYER — single line */}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 5,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: INK,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {e.player?.full_name || t('board.unknownPlayer')}
            </span>
            {cc && (() => {
              const flag = countryFlag(cc);
              return flag ? (
                <span
                  style={{
                    fontSize: 11,
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                  aria-label={cc}
                >
                  {flag}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: MUTED,
                    flexShrink: 0,
                    letterSpacing: '0.04em',
                  }}
                >
                  {countryFallback(cc)}
                </span>
              );
            })()}
          </div>
        </div>

        {/* R1..Rn */}
        <div style={{ display: 'flex', gap: columns.gap, flexShrink: 0 }}>
          {columns.rounds.map((r) => {
            const isLive = columns.liveRound === r;
            const val = r === currentRound ? todayVal : roundVals[r - 1] ?? null;
            const empty = val == null || demotedRow;
            return (
              <div
                key={r}
                style={{
                  width: columns.cellW,
                  textAlign: 'center',
                  fontSize: 12.5,
                  fontWeight: isLive ? 800 : 700,
                  color: empty ? EMPTY_CELL : demotedRow ? SECONDARY : houseColor(val),
                  fontVariantNumeric: 'tabular-nums',
                  background: isLive ? 'rgba(247,147,30,0.07)' : undefined,
                  borderRadius: isLive ? 4 : undefined,
                  padding: '1px 0',
                }}
              >
                {empty ? '\u2014' : fmtScore(val)}
              </div>
            );
          })}
        </div>

        {/* THRU */}
        <div
          style={{
            width: NUM_W,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 11.5,
            color: SECONDARY,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {demotedRow ? '-' : thruDisplay}
        </div>


        {/* TOT */}
        <div
          style={{
            width: NUM_W,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 13.5,
            fontWeight: 800,
            color: totColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {totalDisplay}
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
