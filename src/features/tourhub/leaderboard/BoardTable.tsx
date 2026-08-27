/**
 * BoardTable — Tour Book leaderboard rows.
 *
 * ONE LINE PER PLAYER. Labels appear ONCE, in the header strip this component
 * renders itself (parents no longer print their own column header, so header
 * and rows can never drift):
 *
 *   POS(+MOV) | PLAYER | R1..Rn | THRU (conditional) | TOT
 *
 * The width for a four-round single line came from four deliberate losses:
 *  1. The country flag is OUT of the row. Do not reintroduce it.
 *  2. MOVEMENT folds into the POS cell — movement describes a change in
 *     POSITION, so it lives with position. There is no MOV column.
 *  3. THRU renders ONLY while a round is in progress: no header cell and no
 *     grid track otherwise. Decided ONCE per table, never per row.
 *  4. Tighter geometry: name 13px, gap 4, round cells 26 (floor 22), POS 38,
 *     TOT 40.
 *
 * THE NAME NEVER CLIPS. Table-level degradation ladder, one tier for the whole
 * table so the grid stays square: full name -> initial+surname (shortenName
 * from overview-v3/HybridHero.utils) -> surname alone. If even the surname
 * does not fit, width is taken from the ROUND CELLS (26 -> 22 floor), never
 * from the name. If the 22px floor is reached and the name still overflows the
 * component warns once — it does not ellipsise and it does not shrink type.
 *
 * PRE-TOURNAMENT. With no rounds played there is no POS, no score and no TOT,
 * so the board renders PLAYER | R1 TEE (name back at 15px) instead of a grid of
 * dashes. Tee times are supplied by the parent via `teeTimes`; the leaderboard
 * row itself carries no tee time.
 *
 * Score colours resolved via getScoreColor (canonical to-par grammar:
 * red under par, ink over par, muted-gray even).
 *
 * TWO ABSENCES, TWO TREATMENTS.
 *  - MOVEMENT renders an EN DASH when the delta is zero or unavailable:
 *    holding your position IS a value, not an absence. This is deliberately
 *    NOT the Champions board's collapse rule.
 *  - Every OTHER numeric cell (an unplayed round, a missing thru, a missing
 *    total) renders NOTHING. The grid holds the column.
 * Deltas come from movementFromRounds using standard-competition ranking on
 * prior-round strokes. CUT/WD/DQ rows never show a delta at all.
 *
 * CUT sentence and CUT/WD/DQ demoted rows are inserted inline by
 * this component; the parent supplies cut state via props.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { movementFromRounds } from './movementFromRounds';
import { getScoreColor } from '../_shared/scoreColor';
import { shortenName } from '../components/overview-v3/HybridHero.utils';
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

/** TIGHTENED GEOMETRY (2.4). */
const POS_W = 38;
const TOT_W = 40;
const THRU_W = 26;
const CELL_W = 26;
const CELL_W_FLOOR = 22;
const GRID_GAP = 4;
const ROW_PAD_X = 16;
const NAME_SIZE = 13;
const PRE_NAME_SIZE = 15;
const PRE_TEE_W = 76;
/** MOVEMENT only: zero or unavailable movement is a STATEMENT, so it gets a mark. */
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
  /** Header strip is owned by this component. Off only for embedded previews. */
  showHeader?: boolean;
  /** CSS `top` for the sticky header strip (parent supplies its chrome offset). */
  headerTop?: number | string;
  /** Header/row surface. Defaults to the board canvas. */
  surface?: string;
  /** playerId -> R1 tee time label, used by the pre-tournament board only. */
  teeTimes?: Record<string, string>;
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
  /** THRU only occupies a track while a round is in progress. */
  showThru: boolean;
  /** Nothing has been played: PLAYER | R1 TEE board. */
  preTournament: boolean;
}

/**
 * Adaptive per-round column spec. ONE source of truth for the header strip and
 * every body row.
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
  // "Live" only once play has actually started in the current round.
  const started =
    currentRound != null &&
    entries.some((e) => todayFromEntry(e, currentRound) != null);
  // 2.3 — decided ONCE per table: a round is in progress when at least one
  // player is out there and has not finished it.
  const showThru =
    started &&
    entries.some((e) => {
      if (isDemoted(e.status)) return false;
      if (todayFromEntry(e, currentRound) == null) return false;
      return e.thru != null && e.thru < 18;
    });
  const preTournament =
    entries.length > 0 &&
    highest === 0 &&
    entries.every((e) => e.score == null && e.position == null);
  return { rounds, cellW: CELL_W, gap: GRID_GAP, liveRound: started ? currentRound! : null, showThru, preTournament };
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

/** Fixed width of the R1..Rn block — never sized to its content. */
export function boardRoundsWidth(c: BoardColumns): number {
  return c.rounds.length * c.cellW + Math.max(0, c.rounds.length - 1) * c.gap;
}

/**
 * ONE grid template shared by the header strip and every body row.
 */
export function boardGridTemplate(c: BoardColumns): string {
  if (c.preTournament) return `minmax(0,1fr) ${PRE_TEE_W}px`;
  const rounds = c.rounds.map(() => `${c.cellW}px`).join(' ');
  return [
    `${POS_W}px`,
    'minmax(0,1fr)',
    rounds,
    c.showThru ? `${THRU_W}px` : '',
    `${TOT_W}px`,
  ]
    .filter(Boolean)
    .join(' ');
}

// ---------------------------------------------------------------------------
// NAME LADDER (2.5)
// ---------------------------------------------------------------------------

type NameTier = 'full' | 'short' | 'surname';

function surnameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length === 1 ? parts[0] : parts[parts.length - 1];
}

function nameAtTier(fullName: string, tier: NameTier): string {
  if (tier === 'full') return fullName;
  // shortenName (HybridHero.utils) is the ONE initial-plus-surname helper.
  if (tier === 'short') return shortenName(fullName);
  return surnameOf(fullName);
}

let measureCtx: CanvasRenderingContext2D | null = null;
function measureText(text: string, font: string): number {
  if (typeof document === 'undefined') return text.length * 7;
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  if (!measureCtx) return text.length * 7;
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
}

let warnedOverflow = false;

/**
 * Table-level layout resolution: pick the widest name tier that fits, and only
 * if no tier fits take width from the round cells (26 -> 22 floor).
 */
function resolveLayout(
  names: string[],
  base: BoardColumns,
  containerW: number,
): { columns: BoardColumns; tier: NameTier } {
  if (base.preTournament || !containerW) return { columns: base, tier: 'full' };
  const font = `700 ${NAME_SIZE}px ${F}`;
  const trackCount = 2 + base.rounds.length + (base.showThru ? 1 : 0) + 1;
  const fixed =
    ROW_PAD_X * 2 +
    POS_W +
    TOT_W +
    (base.showThru ? THRU_W : 0) +
    (trackCount - 1) * base.gap;

  const widest = (tier: NameTier) =>
    names.reduce((m, n) => Math.max(m, measureText(nameAtTier(n, tier), font)), 0);

  const tiers: NameTier[] = ['full', 'short', 'surname'];
  for (const tier of tiers) {
    const need = Math.ceil(widest(tier)) + 2; // 2px optical breathing room
    const avail = containerW - fixed - boardRoundsWidth(base);
    if (need <= avail) return { columns: base, tier };
  }

  // Surname alone still overflows: take the shortfall from the ROUND CELLS.
  const need = Math.ceil(widest('surname')) + 2;
  const n = base.rounds.length;
  let cellW = base.cellW;
  while (cellW > CELL_W_FLOOR) {
    cellW -= 1;
    const avail = containerW - fixed - (n * cellW + Math.max(0, n - 1) * base.gap);
    if (need <= avail) return { columns: { ...base, cellW }, tier: 'surname' };
  }
  if (!warnedOverflow) {
    warnedOverflow = true;
    // STOP CONDITION (2.5): the layout has run out. No clip, no ellipsis, no
    // type shrink — reported instead.
    console.warn(
      `[BoardTable] name column exhausted: surname needs ${need}px, round cells at the ${CELL_W_FLOOR}px floor at container ${containerW}px.`,
    );
  }
  return { columns: { ...base, cellW: CELL_W_FLOOR }, tier: 'surname' };
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

export function BoardTable({
  entries,
  cutState,
  currentRound,
  onRowClick,
  showHeader = true,
  headerTop,
  surface = CANVAS,
  teeTimes,
}: Props) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();

  const rootRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setContainerW(Math.round(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const base = useMemo(
    () => computeBoardColumns(entries, currentRound),
    [entries, currentRound],
  );

  const names = useMemo(
    () => entries.filter((e) => !isDemoted(e.status)).map((e) => e.player?.full_name || ''),
    [entries],
  );

  const { columns, tier } = useMemo(
    () => resolveLayout(names, base, containerW),
    [names, base, containerW],
  );

  const template = boardGridTemplate(columns);

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

  /** Column labels — ONCE, above the list. */
  const renderHeader = () => {
    if (!showHeader) return null;
    const labelStyle: React.CSSProperties = {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: SECONDARY,
      whiteSpace: 'nowrap',
    };
    return (
      <div
        style={{
          position: headerTop != null ? 'sticky' : undefined,
          top: headerTop as string | number | undefined,
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: template,
          gap: columns.gap,
          alignItems: 'center',
          padding: `8px ${ROW_PAD_X}px`,
          background: surface,
          borderBottom: `1px solid ${HAIRLINE}`,
          fontFamily: F,
          ...labelStyle,
        }}
      >
        {columns.preTournament ? (
          <>
            <div style={{ ...labelStyle, minWidth: 0 }}>{t('board.columns.player')}</div>
            <div style={{ ...labelStyle, textAlign: 'right' }}>
              {`R1 ${t('board.columns.thru') === 'THRU' ? 'TEE' : 'TEE'}`}
            </div>
          </>
        ) : (
          <>
            <div style={labelStyle}>{t('board.columns.pos')}</div>
            <div style={{ ...labelStyle, minWidth: 0 }}>{t('board.columns.player')}</div>
            {columns.rounds.map((r) => (
              <div
                key={r}
                style={{
                  ...labelStyle,
                  textAlign: 'center',
                  // AMBER on this page means THE LIVE ROUND, not the viewing
                  // member. Bounded, local, deliberate.
                  color: columns.liveRound === r ? AMBER : SECONDARY,
                }}
              >
                {`R${r}`}
              </div>
            ))}
            {columns.showThru && (
              <div style={{ ...labelStyle, textAlign: 'center' }}>{t('board.columns.thru')}</div>
            )}
            <div style={{ ...labelStyle, textAlign: 'right' }}>{t('board.columns.tot')}</div>
          </>
        )}
      </div>
    );
  };

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
    const pid = e.player?.id;
    const mov = !demotedRow && pid ? movementMap.get(pid) : undefined;
    const fullName = e.player?.full_name || t('board.unknownPlayer');
    const nameText = columns.preTournament ? fullName : nameAtTier(fullName, tier);

    const open = () => {
      if (onRowClick) return onRowClick(e);
      if (e.player?.id) navigate(`/tourhub/player/${e.player.id}`);
    };

    return (
      <div
        key={e.id}
        role="button"
        tabIndex={0}
        aria-label={fullName}
        onClick={open}
        onKeyDown={(k) => {
          if (k.key === 'Enter' || k.key === ' ') open();
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: template,
          gap: columns.gap,
          alignItems: 'center',
          padding: `10px ${ROW_PAD_X}px`,
          background: isLeader ? LEADER_WASH : surface,
          opacity: demotedRow ? 0.55 : 1,
          cursor: 'pointer',
          fontFamily: F,
        }}
      >
        {columns.preTournament ? (
          <>
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontSize: PRE_NAME_SIZE,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: A.INK,
                  overflowWrap: 'anywhere',
                }}
              >
                {nameText}
              </span>
            </div>
            <div
              style={{
                textAlign: 'right',
                fontSize: 12.5,
                fontWeight: 700,
                color: A.BODY,
                fontVariantNumeric: 'tabular-nums lining-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {(pid && teeTimes?.[pid]) || ''}
            </div>
          </>
        ) : (
          <>
            {/* POS — movement folds in here; there is no MOV column. */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {!demotedRow &&
                (mov == null || mov === 0 ? (
                  // Zero or unavailable movement IS a statement: they held.
                  <span style={{ fontSize: 10, fontWeight: 700, color: A.DIM }}>{MOV_DASH}</span>
                ) : (
                  <span
                    aria-label={
                      mov > 0
                        ? t('board.movement.up', { count: Math.abs(mov) })
                        : t('board.movement.down', { count: Math.abs(mov) })
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: mov > 0 ? TREND_UP : TREND_DOWN,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    <span aria-hidden>{mov > 0 ? '\u25B2' : '\u25BC'}</span>
                    {Math.abs(mov)}
                  </span>
                ))}
              <span
                style={{
                  // AXIS 10: the position column. Demoted (cut-line) rows read
                  // at the floor; live rows hold at 13.
                  fontSize: demotedRow ? 10 : 13,
                  fontWeight: 700,
                  color: demotedRow ? SECONDARY : isLeader ? A.INK : A.BODY,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  letterSpacing: demotedRow ? '0.06em' : undefined,
                }}
              >
                {posText}
              </span>
            </div>

            {/* PLAYER — never ellipsised, never a truncated surname. The tier
                was resolved at table level so every row matches. */}
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontSize: NAME_SIZE,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: A.INK,
                  whiteSpace: 'nowrap',
                }}
              >
                {nameText}
              </span>
            </div>

            {columns.rounds.map((r) => {
              const isLive = columns.liveRound === r;
              const val = r === currentRound ? todayVal : roundVals[r - 1] ?? null;
              const settled = !isLive;
              return (
                <div
                  key={r}
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: settled ? 600 : 700,
                    opacity: val == null ? 1 : settled ? 0.6 : 1,
                    color: val == null ? A.DIM : houseColor(val),
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {val == null || demotedRow ? '' : fmtScore(val)}
                </div>
              );
            })}

            {columns.showThru && (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  // Still out there = a number, stated. Settled = a quiet 'F'.
                  fontWeight: thruDisplay === 'F' ? 600 : 700,
                  color: thruDisplay === 'F' ? A.DIM : A.BODY,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {thruDisplay}
              </div>
            )}

            {/* TOT — the answer column, right edge, largest figure in the row. */}
            <div
              style={{
                textAlign: 'right',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: totColor,
                fontVariantNumeric: 'tabular-nums lining-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {totalDisplay}
            </div>
          </>
        )}
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

  return (
    <div ref={rootRef}>
      {renderHeader()}
      {parts}
    </div>
  );
}

export default BoardTable;
