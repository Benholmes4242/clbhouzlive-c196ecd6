/** Board-only broadcast layout. Canonical columns/today/cut/team/prize helpers
 * remain authoritative. MiniBoard geometry and hero taps are frozen.
 * BoardRound owns compact inline marks; whole-field reads and member follows
 * are injected by the page/sheet wrapper, never queried by an individual row. */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { fmtScore } from '../utils/fmtScore';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { movementFromRounds } from './movementFromRounds';
import { getScoreColor } from '../_shared/scoreColor';
import { formatEarnings } from '../_shared/formatEarnings';
import { shortenName } from '../components/overview-v3/HybridHero.utils';
import { surnameOf } from '../_shared/playerName';
import { TREND_UP, TREND_DOWN, AMBER, INK_TINT_04 as LEADER_WASH, INK as TOUR_INK, INK_SOFT as TOUR_INK_SOFT, INK_FAINT as TOUR_INK_FAINT, TOUR_CANVAS } from '../_shared/tokens';
import { A, LABEL } from '@/features/courses/components/holes/analytical/tokens';
import { isDemotedStatus } from '../_shared/resultStatus';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import { ClbhouzPickMark } from '../_shared/ClbhouzPickMark';
import { BoardRound, HoleStrip } from './BoardRound';
import type { BoardHole } from './useBoardHoles';
import { boardTieRole } from './leaderboardRules';
import './leaderboard.css';
import { resolveBoardEntity, teamNamesNeedInitials, type BoardNameTier } from '../_shared/boardEntity';

// Dark ramp, imported so the board follows the tour token file (was four pinned light literals).
const INK = TOUR_INK;
const SECONDARY = TOUR_INK_SOFT;
const MUTED = TOUR_INK_FAINT;
const HAIRLINE = 'rgba(255,255,255,0.12)';

const CANVAS = TOUR_CANVAS;
/** THE BOARD'S GEOMETRY, ONE DEFINITION. Both boards draw the same columns:
 *  the full leaderboard page and the five-row hero reduction on the Tour
 *  overview. They were written with two sets of widths and drifted - the
 *  hero's round cell was 28 against this table's 26 for the same digits.
 *  A width changed in one place must change in both, so there is one place.
 *  The hero differs ONLY in which columns it draws and in its row padding;
 *  it never redefines a width. */
/* A COLUMN IS AS WIDE AS THE WIDEST THING IN IT, AND THAT INCLUDES ITS OWN
   HEADER. At 10px/700/0.12em uppercase, "TODAY" measures 39.9px and "THRU"
   32.6px; both are right-aligned, so a track narrower than its label spills
   leftwards into the column beside it. `cell` (26) is a ROUND's figure —
   "R1", "-3" — and TODAY is not a round, so it has its own width here. */
export const BOARD_GEOMETRY = Object.freeze({ mov: 24, pos: 24, tot: 40, today: 40, thru: 34, prize: 52, cell: 26, cellFloor: 22, gap: 4 } as const);

/** TIGHTENED GEOMETRY (2.4) — local aliases of BOARD_GEOMETRY, never numbers of their own. */
const MOV_W = BOARD_GEOMETRY.mov;
const POS_W = BOARD_GEOMETRY.pos;
const TOT_W = BOARD_GEOMETRY.tot;
const THRU_W = BOARD_GEOMETRY.thru;
const PRIZE_W = BOARD_GEOMETRY.prize;
const CELL_W = BOARD_GEOMETRY.cell;
const CELL_W_FLOOR = BOARD_GEOMETRY.cellFloor;
const GRID_GAP = BOARD_GEOMETRY.gap;
/* ROW PADDING IS THE ONE DELIBERATE DIFFERENCE FROM THE HERO BOARD (20 there).
   This is a full-width scrolling table that needs the content width across
   seven columns; do not unify it with the hero's 20. */
const ROW_PAD_X = 16;
const NAME_SIZE = 14;
const PRE_NAME_SIZE = 15;
const PRE_TEE_W = 76;
/** MOVEMENT only: zero or unavailable movement is a STATEMENT, so it gets a mark. */
const MOV_DASH = '\u2013';
/** PRIZE: a row that earned nothing states it with an em dash, never a blank. */
const PRIZE_DASH = '\u2014';

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export interface BoardEntry {
  id: string;
  position: number | null;
  position_tied?: boolean | null;
  score: number | null;
  thru?: number | null;
  today?: number | null;
  today_round?: number | null;
  status?: string | null;
  // round_1..round_4 are TO-PAR figures for each round (e.g. -8, 2, 0), NOT
  // stroke counts: they sum to `score`. Add the venue par to get strokes.
  round_1?: number | null;
  round_2?: number | null;
  round_3?: number | null;
  round_4?: number | null;
  money?: number | null;
  raw_data?: unknown;
  player?: {
    id: string;
    sr_id?: string | null; // Sportradar id — matches sr_tournaments.winner_id
    full_name: string;
    first_name?: string | null;
    last_name?: string | null;
    country_code?: string | null;
    country?: string | null;
    photo_url?: string | null;
    /** Filename key, never a URL. Present at runtime: useTourLeaderboard selects sr_players(*). */
    headshot_override?: string | null;
  } | null;
  team?: {
    id?: string | null;
    sr_id?: string | null;
    display_name?: string | null;
    abbr_name?: string | null;
    country?: string | null;
    members?: Array<{
      position_in_team?: number | null;
      player?: {
        id?: string | null;
        sr_id?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        full_name?: string | null;
        photo_url?: string | null;
        country?: string | null;
      } | null;
    }> | null;
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
  /** The event is over. Turns the live-round amber off; nothing else
   * about the board changes. Defaults false so any caller that does
   * not know keeps today's behaviour. */
  complete?: boolean;
  onRowClick?: (entry: BoardEntry) => void;
  /** Header strip is owned by this component. Off only for embedded previews. */
  showHeader?: boolean;
  /** CSS `top` for the sticky header strip (parent supplies its chrome offset). */
  headerTop?: number | string;
  /** Header/row surface. Defaults to the board canvas. */
  surface?: string;
  /** playerId -> R1 tee time label, used by the pre-tournament board only. */
  teeTimes?: Record<string, string>;
  /** Optional complete field used only to calculate movement when `entries`
   * is a truncated inline board. No additional query is required. */
  movementEntries?: BoardEntry[];
  /** Event-level team-name convention, computed by the parent when shared. */
  teamInitials?: boolean;
  holesByPlayer?: Map<string, BoardHole[]>;
  followedIds?: Set<string>;
  pickPlayerIds?: Set<string>;
  inlineRound?: number | null;
  onFollow?: (playerId: string) => void;
  followBusy?: boolean;
  followError?: boolean;
  yourPlayers?: boolean;
  tourSlug?: string | null;

}

function houseColor(score: number | null | undefined, emphasis: 'standard' | 'leader' = 'standard'): string {
  if (score == null) return INK;
  return getScoreColor(score, 'dark', emphasis);
}

/** Absent figures render NOTHING — the grid holds the column. */
/** Board cells: an absent figure is an empty cell, never "E". */
const fmtBoardScore = (score: number | null | undefined): string => fmtScore(score, { absent: '' });

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
  /**
   * PRIZE is a property of the TOURNAMENT, not of any row slice: shown when
   * ANY row has a money value, hidden — header included — when none do, so
   * the column is stable across expand, sort and scroll. Two completed events
   * on the same tour in the same season can legitimately differ; that is the
   * data (~40% of events carry no prize data), not a UI inconsistency.
   */
  showPrize: boolean;
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
  complete?: boolean,
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
  // ANY row with a money value turns the column on for the whole tournament.
  const showPrize = entries.some((e) => e.money != null);
  return {
    rounds,
    cellW: CELL_W,
    gap: GRID_GAP,
    /* AMBER IS A ROUND IN PROGRESS. `started` only knows that scores
       exist for the current round, which stays true forever once the
       event ends — so the final round wore amber permanently. The
       event's own status is what settles it. */
    liveRound: started && !complete ? currentRound as number : null,
    showThru,
    showPrize,
    preTournament,
  };
}

/** Shared movement source for both the column spec and the row renderer. */
export function boardMovementMap(entries: BoardEntry[], currentRound: number | null) {
  return movementFromRounds(
    entries.map((e) => ({
      id: e.id,
      playerId: e.player?.id ?? e.team?.id ?? e.id,
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
  return [
    '30px', 'minmax(0,1fr)',
    ...c.rounds.map(r => `${c.liveRound === r ? 28 : 26}px`),
    '32px', '40px', c.showPrize ? `${PRIZE_W}px` : '',
  ].filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// NAME LADDER (2.5)
// ---------------------------------------------------------------------------

type NameTier = BoardNameTier;

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
 * if no tier fits take width from the round cells (26 -> 22 floor). If the
 * floor still cannot carry the name, PRIZE yields before any name is clipped.
 */
function resolveLayout(
  entries: BoardEntry[],
  teamInitials: boolean,
  base: BoardColumns,
  containerW: number,
): { columns: BoardColumns; tier: NameTier } {
  if (base.preTournament || !containerW) return { columns: base, tier: 'full' };
  const playerFont = `700 ${NAME_SIZE}px ${F}`;
  const teamFont = `600 12.5px ${F}`;
  const trackCount = 3 + base.rounds.length + (base.showThru ? 1 : 0) + 1 + (base.showPrize ? 1 : 0);
  const fixed =
    ROW_PAD_X * 2 +
    MOV_W +
    POS_W +
    TOT_W +
    (base.showThru ? THRU_W : 0) +
    (base.showPrize ? PRIZE_W : 0) +
    (trackCount - 1) * base.gap;

  const widest = (tier: NameTier) => entries.reduce((maximum, entry) => {
    const entity = resolveBoardEntity(entry, teamInitials, tier);
    const lines = entity.kind === 'team'
      ? entity.lines
      : [nameAtTier(entity.lines[0] ?? '', tier)];
    const font = entity.kind === 'team' ? teamFont : playerFont;
    return Math.max(maximum, ...lines.map((line) => measureText(line, font)));
  }, 0);

  // A collision board may never descend to bare surnames: Kim / Kim and
  // Iwai / Iwai are not compact labels, they are the wrong names.
  const tiers: NameTier[] = teamInitials ? ['full', 'short'] : ['full', 'short', 'surname'];
  for (const tier of tiers) {
    const need = Math.ceil(widest(tier)) + 2; // 2px optical breathing room
    const avail = containerW - fixed - boardRoundsWidth(base);
    if (need <= avail) return { columns: base, tier };
  }

  // The safe floor still overflows: take the shortfall from the ROUND CELLS.
  const floorTier: NameTier = teamInitials ? 'short' : 'surname';
  const need = Math.ceil(widest(floorTier)) + 2;
  const n = base.rounds.length;
  let cellW = base.cellW;
  while (cellW > CELL_W_FLOOR) {
    cellW -= 1;
    const avail = containerW - fixed - (n * cellW + Math.max(0, n - 1) * base.gap);
    if (need <= avail) return { columns: { ...base, cellW }, tier: floorTier };
  }

  if (base.showPrize) {
    const prizeFree = { ...base, cellW: CELL_W_FLOOR, showPrize: false };
    const prizeFreeTrackCount = 3 + prizeFree.rounds.length + (prizeFree.showThru ? 1 : 0) + 1;
    const prizeFreeFixed =
      ROW_PAD_X * 2 +
      MOV_W +
      POS_W +
      TOT_W +
      (prizeFree.showThru ? THRU_W : 0) +
      (prizeFreeTrackCount - 1) * prizeFree.gap;
    const prizeFreeAvail = containerW - prizeFreeFixed - boardRoundsWidth(prizeFree);
    if (need <= prizeFreeAvail) return { columns: prizeFree, tier: floorTier };

    return { columns: prizeFree, tier: floorTier };
  }

  if (!warnedOverflow) {
    warnedOverflow = true;
    // STOP CONDITION (2.5): the layout has run out. No clip, no ellipsis, no
    // type shrink. PRIZE has already yielded if it could.
    console.warn(
      `[BoardTable] name column exhausted: ${floorTier} needs ${need}px, round cells at the ${CELL_W_FLOOR}px floor at container ${containerW}px.`,
    );
  }
  return { columns: { ...base, cellW: CELL_W_FLOOR }, tier: floorTier };
}

/* Status vocabulary lives in _shared/resultStatus.ts — see MDF note there. */
const isDemoted = isDemotedStatus;

/** Board label for a status; shared with the overview pick cards so both agree. */
export function statusWord(s?: string | null): string {
  const u = (s || '').toUpperCase();
  if (u === 'CUT' || u === 'MC') return 'CUT';
  if (u === 'MDF') return 'MDF';
  return u || '-';
}

export function BoardTable({
  entries,
  cutState,
  currentRound,
  complete = false,
  onRowClick,
  showHeader = true,
  headerTop,
  surface = CANVAS,
  teeTimes,
  movementEntries,
  teamInitials,
  holesByPlayer = new Map(), followedIds = new Set(), pickPlayerIds,
  inlineRound, onFollow, followBusy = false, followError = false,
  yourPlayers = false, tourSlug,
}: Props) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    () => computeBoardColumns(entries, currentRound, complete),
    [entries, currentRound, complete],
  );

  const resolvedTeamInitials = useMemo(
    () => teamInitials ?? teamNamesNeedInitials(entries),
    [teamInitials, entries],
  );
  const layoutEntries = useMemo(() => entries.filter((e) => !isDemoted(e.status)), [entries]);

  const { columns, tier } = useMemo(
    () => ({ columns: base, tier: 'short' as NameTier }),
    [layoutEntries, resolvedTeamInitials, base, containerW],
  );

  const template = boardGridTemplate(columns);

  // Computed round-start deltas (empty in R1 / when unavailable).
  const movementMap = useMemo(
    () => boardMovementMap(movementEntries ?? entries, currentRound ?? null),
    [entries, movementEntries, currentRound],
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
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: SECONDARY,
      whiteSpace: 'nowrap',
    };
    return (
      <div
        style={{
          position: 'sticky',
          top: headerTop ?? 0,
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: template,
          gap: columns.gap,
          alignItems: 'center',
          height: 34,
          padding: `0 ${ROW_PAD_X}px`,
          background: 'var(--tour-board-head)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${HAIRLINE}`,
          fontFamily: F,
          ...labelStyle,
        }}
      >
        {columns.preTournament ? (
          <>
            <div style={{ ...labelStyle, minWidth: 0 }}>{t('board.columns.player')}</div>
            <div style={{ ...labelStyle, textAlign: 'center' }}>
              {`R1 ${t('board.columns.thru') === 'THRU' ? 'TEE' : 'TEE'}`}
            </div>
          </>
        ) : (
          <>
            <div data-board-pos-header style={{ ...labelStyle, textAlign: 'center' }}>{t('board.columns.pos')}</div>
            <div style={{ ...labelStyle, minWidth: 0 }}>{t('board.columns.player')}</div>
            {columns.rounds.map((r) => (
              <div
                key={r}
                data-board-round-header
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
            {true && (
              <div data-board-thru-header style={{ ...labelStyle, textAlign: 'center' }}>{t('board.columns.thru')}</div>
            )}
            <div style={{ ...labelStyle, textAlign: 'center' }}>{t('board.columns.tot')}</div>
            {columns.showPrize && (
              <div style={{ ...labelStyle, textAlign: 'center' }}>{t('board.columns.prize', 'Prize')}</div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderRow = (e: BoardEntry, opts?: { demoted?: boolean; tie?: string }) => {
    const demotedRow = !!opts?.demoted;
    const posText = demotedRow
      ? statusWord(e.status)
      : e.position == null
      ? ''
      : `${e.position_tied ? 'T' : ''}${e.position}`;
    const tie = opts?.tie ?? '';
    const showPosition = yourPlayers || !['middle','last'].includes(tie);
    const holes = e.player?.id ? holesByPlayer.get(e.player.id) ?? [] : [];
    const round = inlineRound ?? currentRound ?? columns.rounds.at(-1) ?? 1;
    const isLeader = !demotedRow && e.position === 1;
    const totColor = demotedRow ? SECONDARY : houseColor(e.score);
    const totalDisplay = fmtBoardScore(e.score);
    const todayVal = todayFromEntry(e, currentRound);
    // THRU must agree with the live round: if the active round has not started
    // for this player, the stale top-level thru (yesterday's "F") is hidden.
    const thruEmpty = demotedRow || todayVal == null;
    const thruDisplay = thruEmpty ? '' : fmtThru(e.thru);
    const roundVals = [e.round_1, e.round_2, e.round_3, e.round_4];
    const pid = e.player?.id;
    const mov = !demotedRow ? movementMap.get(pid ?? e.team?.id ?? e.id) : undefined;
    const entity = resolveBoardEntity(e, resolvedTeamInitials, tier);
    const fullName = entity.lines[0] ?? '';
    const nameText = columns.preTournament ? fullName : nameAtTier(fullName, tier);
    const accessibleName = entity.lines.filter(Boolean).join(' / ');

    const open = () => {
      setExpandedId(previous => previous === e.id ? null : e.id);
    };

    return (
      <Fragment key={e.id}><div
        role="button"
        tabIndex={0}
        aria-label={accessibleName || undefined}
        aria-expanded={expandedId === e.id}
        data-board-row={e.id}
        data-tie-role={tie || undefined}
        data-your-player={yourPlayers || undefined}
        onClick={open}
        onKeyDown={(k) => {
          if (k.key === 'Enter' || k.key === ' ') open();
        }}
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: template,
          gap: columns.gap,
          alignItems: 'center',
          padding: `${entity.kind === 'team' ? 9 : 10}px ${ROW_PAD_X}px`,
          background: yourPlayers ? 'var(--tour-board-mine)' : isLeader ? 'var(--tour-board-leader)' : surface,
          opacity: demotedRow ? 0.55 : 1,
          cursor: 'pointer',
          fontFamily: F,
        }}
      >
        {columns.preTournament ? (
          <>
            {entity.kind === 'team' ? (
              <div style={{ minWidth: 0 }}>
                {entity.lines.map((line, index) => (
                  <span key={`${e.id}-pre-team-name-${index}`} style={{ display: 'block', fontSize: 12.5, fontWeight: 600, lineHeight: 1.28, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {line}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: PRE_NAME_SIZE, fontWeight: 700, letterSpacing: 0, color: A.INK, overflowWrap: 'anywhere' }}>
                  {nameText}
                </span>
              </div>
            )}
            <div
              style={{
                textAlign: 'center',
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
            <div className="tour-board-position">
              <span style={{fontSize:demotedRow ? 10 : 12.5,fontWeight:700,color:isLeader ? 'var(--tour-board-ink)' : 'var(--tour-board-mute)',fontVariantNumeric:'tabular-nums'}}>{showPosition ? posText : '\u00a0'}</span>
              {!demotedRow && mov != null && mov !== 0 && <span className="tour-board-movement" style={{color:mov > 0 ? TREND_UP : 'var(--tour-board-dim)'}}>{mov > 0 ? '▲' : '▼'}{Math.abs(mov)}</span>}
            </div>
            {!yourPlayers && tie && <span aria-hidden="true" data-tie-bracket={tie} className={`tour-tie tour-tie-${tie}`} />}

            {entity.kind === 'team' ? (
              // A team row names two people, not one. The field's longest pair
              // needs 254px on one line against a 194px name track at 320, so
              // the pair stacks. Both lines take full INK: neither player is a
              // supporting credit.
              <div style={{ minWidth: 0 }}>
                {entity.lines.map((line, index) => (
                  <span key={`${e.id}-team-name-${index}`} style={{ display: 'block', fontSize: 12.5, fontWeight: 600, lineHeight: 1.28, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {line}
                  </span>
                ))}
              </div>
            ) : (
              <div className="tour-board-player">
                <SquircleAvatar size={30} hairlineRing className="tour-board-avatar" userId={pid} alt={fullName} srcCandidates={resolvePlayerAvatarCandidates({name:fullName,photoUrl:e.player?.photo_url,tourSlug,headshotOverride:e.player?.headshot_override})} />
                <div className="tour-board-who"><span className="tour-board-name"><span className="tour-board-name-text">{nameText}</span>
                  {pid && pickPlayerIds?.has(pid) && <ClbhouzPickMark size={11} label={t('overview.board.clbhouzPick')} />}
                  {pid && followedIds.has(pid) && <span className="tour-board-star" aria-label={t('rebuilt.following')}>★</span>}
                </span><HoleStrip holes={holes} /></div>
              </div>
            )}

            {columns.rounds.map((r) => {
              const isLive = columns.liveRound === r;
              const val = r === currentRound ? todayVal : roundVals[r - 1] ?? null;
              const settled = !isLive;
              return (
                <div
                  key={r}
                  data-board-round-cell
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: settled ? 600 : 800,
                    // A played round is a played round: no opacity drop. The
                    // current round is marked by its amber header, which is a
                    // stronger signal than 40% fade. An empty cell is a
                    // different thing and keeps A.DIM at full strength.
                    opacity: settled ? 0.55 : 1,
                    color: val == null ? A.DIM : houseColor(val),
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {val == null || demotedRow ? '' : fmtBoardScore(val)}
                </div>
              );
            })}

            {true && (
              <div
                data-board-thru-cell
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  // Still out there = a number, stated. Settled = a quiet 'F'.
                  fontWeight: 600,
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
                textAlign: 'center',
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 0,
                color: totColor,
                fontVariantNumeric: 'tabular-nums lining-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {totalDisplay}
            </div>

            {/* PRIZE — earned nothing is stated with an em dash in the faint
                slot, never a blank and never a zero. MC/WD/DQ/DNS rows earn
                nothing, so they dash too. */}
            {columns.showPrize && (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: e.money != null ? SECONDARY : MUTED,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {e.money != null ? formatEarnings(e.money) : PRIZE_DASH}
              </div>
            )}
          </>
        )}
      </div>
      <div className="tour-round-expand" data-open={expandedId === e.id}>
        {expandedId === e.id && <BoardRound holes={holes} round={round} thru={e.thru} following={!!pid && followedIds.has(pid)} busy={followBusy} error={followError}
          onFull={() => onRowClick?.(e)} onFollow={() => { if (pid) onFollow?.(pid); }} onPlayer={() => { if (pid) navigate(`/tourhub/player/${pid}`); }} />}
      </div></Fragment>
    );
  };

  const parts: React.ReactNode[] = [];
  active.forEach((e, i) => {
    if (i === insertionIndex) parts.push(renderCutSentence());
    parts.push(renderRow(e, {tie:boardTieRole(active,i)}));
  });
  if (insertionIndex >= active.length && cutState.kind !== 'none') {
    parts.push(renderCutSentence());
  }
  demoted.forEach((e) => parts.push(renderRow(e, { demoted: true })));

  return (
    <div className="tour-board-shell" ref={rootRef} data-board-name-tier={tier} data-board-show-prize={columns.showPrize ? 'true' : 'false'}>
      {renderHeader()}
      {parts}
    </div>
  );
}

export default BoardTable;
