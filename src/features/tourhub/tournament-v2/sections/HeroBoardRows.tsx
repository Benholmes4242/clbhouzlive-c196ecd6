/**
 * HeroBoardRows — the Tour hero board's rows, extracted from MiniBoard's
 * heroBoard branch and shared with Also this week (also-week-board signed-off
 * mock). ONE board, no copy-paste:
 *
 * Grammar, identical on both surfaces:
 *  - grid 24px | minmax(0,1fr) | 32px per round R1…Rn | 40px TOT, gap 4;
 *  - header 10px/700, letter-spacing .08em, mute, min-height 24, R columns
 *    dim, the current round's header TOUR_LIVE_GREEN while a round is in
 *    progress;
 *  - rows min-height 31, padding 4px 0;
 *  - POS 12.5/700; name 13/600, ellipsis;
 *  - round cells 12/600 (the live round 700), getScoreColor;
 *  - the current-round cell shows the tee time (11px, white 45%) before a
 *    player starts, then today's score, then the round score;
 *  - TOT 15/700, getScoreColor;
 *  - ties show the position once.
 *
 * extraRows (Also this week only; the hero never passes them) render after a
 * 1px rule with the amber wash (var(--tour-board-mine)) and an amber ★ after
 * the name. With `bleed` (Also this week, whose card owns 20px gutters) an
 * open row and its HeroRoundPanel bleed edge to edge, as on the hero.
 *
 * Reads stay lazy: tee times only for an entirely unscored scheduled column,
 * holes only while a row is open (HeroRoundPanel owns that read).
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { computeBoardColumns, todayFromEntry, type BoardEntry } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import { FONT, WHITE_ALPHA_65, WHITE_ALPHA_45, TOUR_LIVE_GREEN } from '../../_shared/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import { ClbhouzPickMark } from '../../_shared/ClbhouzPickMark';
import { resolveBoardEntity, teamNamesNeedInitials, type BoardNameTier } from '../../_shared/boardEntity';
import { OVERVIEW, countInWords } from '../../components/overview-v3/overviewTokens';
import { Button } from '@/components/ui/button';
import { useTeeTimesAll } from '../data/useTeeTimesAll';
import { formatTimeHm24 } from '@/i18n/format';

import { HeroRoundPanel } from './HeroRoundPanel';
import { heroDefaultRound, heroStartedRounds } from './heroRoundRules';
/* HoleMarks' shape styles live in leaderboard.css; the open panel needs them
   on every surface this shared board renders on. */
import '../../leaderboard/leaderboard.css';

type Row = BoardEntry;

/* Signed-off hero-only geometry. Full BoardTable owns its independent tracks;
   changing these constants must never resize the full leaderboard. */
export const HERO_PAD_X = 20;
export const HERO_POS_W = 24;
const HERO_ROUND_W = 32;
export const HERO_TOT_W = 40;
export const HERO_GAP = 4;
/** Board cell type, shared by the completed-state figures (POS and TOT styles). */
export const HERO_POS_TYPE = { fontSize: 12.5, fontWeight: 700 } as const;
export const HERO_TOT_TYPE = { fontSize: 15, fontWeight: 700 } as const;
/** Every numeric cell on the hero board: digits stack down a column. */
const HERO_NUM = { fontVariantNumeric: 'tabular-nums lining-nums' as const, textAlign: 'center' as const };

export function heroRoundScore(entry: BoardEntry, round: number, currentRound?: number | null): number | null {
  return round === currentRound ? todayFromEntry(entry, currentRound) : [entry.round_1, entry.round_2, entry.round_3, entry.round_4][round - 1] ?? null;
}

/** Only an entirely unscored scheduled column needs a draw. Never fetch a
 * played round for a straggler with missing data, or a completed event. */
export function heroTeeRound(entries: BoardEntry[], rows: BoardEntry[], rounds: number[], currentRound: number | null | undefined, completed: boolean): number | null {
  if (completed || !currentRound || rows.length === 0) return null;
  return rounds.find(round => round === currentRound && rows.some(row => !!row.player?.id) && entries.every(row => heroRoundScore(row, round, currentRound) == null)) ?? null;
}

/** THE HERO BOARD HAS ONE LAYOUT IN EVERY PHASE — POS | PLAYER | R1…Rn | TOT,
 *  pre-round, live, suspended or completed, with n running to the current
 *  round and R1 shown even in round one. This supersedes
 *  BRIEF_TOUR_OVERVIEW_MOCK_EXACT §D.1 for the hero board: TODAY and SHAPE
 *  are gone (the current round's cell carries the tee time, the today score
 *  or the round score), and THRU lives in the open-row panel's "THRU h"
 *  header, never on the board. */
export function heroBoardColumns(_opts: { roundCount: number; roundInProgress: boolean; completed: boolean }): {
  today: boolean; rounds: boolean; shape: boolean;
} {
  return { today: false, rounds: true, shape: false };
}

/** The TOP group when it is a tie over the visible rows: its length, else 0. */
export function heroTopTieLength(rows: Array<{ position?: number | null; status?: string | null }>): number {
  let n = 0;
  for (const r of rows) {
    const s = r.status?.toUpperCase();
    if (s === 'MC' || s === 'CUT' || s === 'WD' || r.position !== 1) break;
    n += 1;
  }
  return n >= 2 ? n : 0;
}

export type TieRole = 'solo' | 'first' | 'middle' | 'last';


/** GROUP THE TIE over the VISIBLE rows. A group is two or more consecutive
 *  rows sharing a position. A group cut by the row limit ends on the last
 *  visible row, so its bracket never points at nothing; a single visible row
 *  of a tie that continues below is a solo row and keeps its marker. */
export function heroTieRoles(rows: Array<{ position?: number | null; status?: string | null }>): TieRole[] {
  const key = (r: { position?: number | null; status?: string | null }) => {
    const s = r.status?.toUpperCase();
    if (s === 'MC' || s === 'CUT' || s === 'WD') return null;
    return r.position ?? null;
  };
  return rows.map((r, i) => {
    const k = key(r);
    if (k == null) return 'solo';
    const prev = i > 0 && key(rows[i - 1]) === k;
    const next = i < rows.length - 1 && key(rows[i + 1]) === k;
    if (prev && next) return 'middle';
    if (prev) return 'last';
    if (next) return 'first';
    return 'solo';
  });
}

/** A missing figure renders as NOTHING. An em dash is a value in a tabular
 * column and reads as data the field does not have. */
const BLANK = '';

export interface HeroBoardRowsProps {
  tournamentId: string;
  /** THE WHOLE FIELD. Column presence and the tee-time draw are properties of
   * the tournament, never of the visible slice. */
  entries: Row[];
  /** The visible top rows (already sliced by the caller). */
  rows: Row[];
  /** Also this week only: followed players after the rule, amber wash + ★. */
  extraRows?: Row[];
  /** Active round from sr_tournaments.current_round - scopes the live column. */
  currentRound?: number | null;
  /**
   * Lifecycle. The hero uses it only to extinguish the final round's green
   * header; round-column presence remains data-led.
   */
  phase?: 'live' | 'completed';
  /** The event's tour, for the shared headshot resolver. */
  tourSlug?: string | null;
  /** Rounds in the schedule, so the panel always draws every chip slot. */
  totalRounds?: number | null;
  /** Hero-only opt-in: the movers band owns the preceding seam. */
  afterMovers?: boolean;
  /** Also this week: the card's own 10px board gap owns the seam, so the
   * board's 12px top padding is dropped. */
  flushTop?: boolean;
  /** Hero only: the Full leaderboard action. Also this week never passes it. */
  onFullBoard?: () => void;
  boardUpdatedAt?: number;
  /** Row tap hook (analytics). Fires before the panel opens. */
  onRowTap?: (playerId: string) => void;
  /**
   * Player ids that are Tournament Intelligence picks. AMBER MEANS THE LIVE
   * ROUND EVERYWHERE ELSE ON TOUR SURFACES; here it is deliberately a SECOND
   * meaning, bounded to this one mark: it reads as the clbhouz mark, not a
   * status colour, because it is the logo. Do not "correct" it.
   */
  pickPlayerIds?: Set<string>;
  /** Also this week: rows and the open panel bleed past the card's 20px
   * gutters to the card edges, as the hero board does on its full-width band. */
  bleed?: boolean;
}

export function HeroBoardRows({ tournamentId, entries, rows, extraRows, currentRound, phase = 'live', tourSlug = null, totalRounds = null, afterMovers = false, flushTop = false, onFullBoard, boardUpdatedAt = 0, onRowTap, pickPlayerIds, bleed = false }: HeroBoardRowsProps) {
  const { t } = useTranslation('tourhub');
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const [expanded, setExpanded] = useState<{ playerId: string; round: number } | null>(null);
  useEffect(() => { setExpanded(null); setTarget(null); }, [tournamentId]);
  const needsInitials = useMemo(() => teamNamesNeedInitials(entries), [entries]);
  const nameTrackRef = useRef<HTMLDivElement>(null);
  const [nameTrackWidth, setNameTrackWidth] = useState(0);
  const ink = '#FFFFFF';
  const faint = WHITE_ALPHA_65;
  const press = 'active:bg-white/[0.06]';
  /** getScoreColor knows two ramps only; the dark ground takes the dark ramp. */
  const scoreTheme = 'dark' as const;
  const showOverviewPosition = rows.some((row) => row.position != null || ['MC', 'CUT', 'WD'].includes(row.status?.toUpperCase() ?? ''));
  /* OVER THE WHOLE FIELD, never `rows`. Column presence is a property
     of the TOURNAMENT, so expanding or re-sorting the board can never
     add or drop a column. */
  const heroCols = useMemo(
    () => computeBoardColumns(entries, currentRound ?? null, phase === 'completed'),
    [entries, currentRound, phase],
  );
  /* THE GUARD IS ROUND DATA, NOT LIFECYCLE. computeBoardColumns floors
     `rounds` at [1] so it always has a track to draw, and preTournament
     is too narrow to lean on: it also requires every score and position
     to be null, so a board carrying TOTALS BUT NO ROUND BREAKDOWN would
     otherwise render one empty R1 column. */
  const heroHasRoundData = useMemo(
    () => entries.some((e) => e.round_1 != null || e.round_2 != null || e.round_3 != null || e.round_4 != null),
    [entries],
  );
  const heroColumnRule = heroBoardColumns({
    roundCount: heroCols.rounds.length,
    roundInProgress: heroCols.liveRound != null,
    completed: phase === 'completed',
  });
  const tieRoles = heroTieRoles(rows);
  const showHeroRounds = heroHasRoundData && heroColumnRule.rounds;
  const heroRounds = showHeroRounds ? heroCols.rounds : [];
  const heroRoundTracks = heroRounds.map(() => `${HERO_ROUND_W}px`).join(' ');
  const topTieLength = heroTopTieLength(rows);
  const topTieCount = topTieLength > 0 ? entries.filter((e) => e.position === 1).length : 0;
  const overviewGrid = [
    showOverviewPosition ? `${HERO_POS_W}px` : null,
    'minmax(0, 1fr)',
    heroRoundTracks || null,
    `${HERO_TOT_W}px`,
  ].filter(Boolean).join(' ');
  const heroGap = HERO_GAP;
  const teeRound = heroTeeRound(entries, rows, heroRounds, currentRound, phase === 'completed');
  const { data: teeGroups } = useTeeTimesAll(tournamentId, teeRound ?? 1, { enabled: teeRound != null });
  const teesByPlayer = useMemo(() => {
    const map = new Map<string, string>();
    if (teeRound == null) return map;
    for (const group of teeGroups ?? []) {
      if (!Number.isFinite(Date.parse(group.teeTime))) continue;
      for (const player of group.players) if (player.id) map.set(player.id, formatTimeHm24(group.teeTime));
    }
    return map;
  }, [teeRound, teeGroups]);

  useEffect(() => {
    const element = nameTrackRef.current;
    if (!element) return;
    const measure = () => setNameTrackWidth(element.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [heroRounds.length, overviewGrid]);

  const nameTier = useMemo<BoardNameTier>(() => {
    const teamRows = entries.filter((entry) => entry.team);
    if (teamRows.length === 0 || nameTrackWidth <= 0 || typeof document === 'undefined') return needsInitials ? 'short' : 'surname';
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return needsInitials ? 'short' : 'surname';
    context.font = `600 12.5px ${FONT}`;
    const tiers: BoardNameTier[] = needsInitials ? ['full', 'short'] : ['full', 'short', 'surname'];
    return tiers.find((candidate) => teamRows.every((entry) => resolveBoardEntity(entry, needsInitials, candidate).lines.every((line) => context.measureText(line).width <= nameTrackWidth))) ?? tiers[tiers.length - 1];
  }, [entries, nameTrackWidth, needsInitials]);

  const overviewName = (fullName: string | undefined): string => fullName?.trim() || BLANK;

  const renderEntityName = (entity: ReturnType<typeof resolveBoardEntity>) => entity.kind === 'team' ? (
    // A team row names two people, not one. Both lines take full ink because
    // neither player is a supporting credit.
    <div style={{ minWidth: 0 }}>
      {entity.lines.map((line, index) => (
        <span key={`${line}-${index}`} style={{ display: 'block', fontSize: 12.5, fontWeight: 600, lineHeight: 1.28, color: ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {line}
        </span>
      ))}
    </div>
  ) : (
    <span style={{ minWidth: 0, whiteSpace: 'normal', lineHeight: 1.15, fontSize: 13, fontWeight: 600, color: ink }}>{overviewName(entity.lines[0])}</span>
  );

  const renderRow = (r: Row, rowIndex: number, inTopTie: boolean, mine = false) => {
    const entity = resolveBoardEntity(r, needsInitials, nameTier);
    const tieRole = mine ? 'solo' : tieRoles[rowIndex];
    const posText = r.status === 'MC' || r.status === 'CUT' ? 'MC'
      : r.status === 'WD' ? 'WD'
      : r.position == null ? BLANK
      : `${r.position_tied ? 'T' : ''}${r.position}`;
    const today = todayFromEntry(r as unknown as Parameters<typeof todayFromEntry>[0], currentRound);
    /* A ROW OPENS ONLY WHAT IS BEHIND IT. The scorecard sheet is keyed by
       one player's id; a team row has none, and a member's individual card
       is not the team's round. So a team row is not a control at all. */
    const tappable = !!r.player?.id;
    const pid = r.player?.id;
    const isOpen = !!pid && expanded?.playerId === pid;
    const started = heroStartedRounds(r, currentRound);
    const defaultRound = heroDefaultRound(started, currentRound);
    const openScorecard = () => {
      if (!pid) return;
      setTarget({ playerId: pid, playerName: entity.lines[0] ?? '', countryCode: r.player?.country_code ?? r.player?.country ?? null, position: r.position ?? null, positionTied: r.position_tied ?? null, total: r.score ?? null, today, thru: r.thru ?? null, status: r.status ?? null });
    };
    const toggle = () => {
      if (!pid) return;
      onRowTap?.(pid);
      if (isOpen) { setExpanded(null); return; }
      if (defaultRound == null) { openScorecard(); return; }
      setExpanded({ playerId: pid, round: defaultRound });
    };
    const memberNames = (r.team?.members ?? []).map((m) => m.player?.full_name?.trim()).filter(Boolean).join(', ');
    const teamTitle = r.team?.display_name?.trim() || r.team?.abbr_name?.trim() || '';
    const labelName = entity.kind === 'team'
      ? (teamTitle && memberNames ? t('overview.board.teamName', { team: teamTitle, members: memberNames }) : teamTitle || memberNames || entity.prose)
      : entity.lines[0] ?? '';
    const rowLabel = t('overview.board.rowLabel', { name: labelName, position: posText, score: r.score == null ? '' : fmtScore(r.score) });
    const RowTag = tappable ? Button : 'div';
    return (
      <Fragment key={r.id}><RowTag
        data-hero-board-row={r.id}
        {...(tappable ? { type: 'button' as const, variant: 'ghost' as const, role: 'button', tabIndex: 0, 'aria-expanded': isOpen, 'aria-controls': isOpen ? `hero-round-${pid}` : undefined, 'aria-haspopup': defaultRound == null ? 'dialog' as const : undefined } : { role: 'group' })}
        {...(mine ? { 'data-mine': true } : {})}
        aria-label={rowLabel}
        onClick={tappable ? toggle : undefined}
        onKeyDown={tappable ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } } : undefined}
        style={{ position: 'relative', display: 'grid', gridTemplateColumns: overviewGrid, gap: heroGap, alignItems: 'center', width: bleed ? `calc(100% + ${2 * HERO_PAD_X}px)` : '100%', margin: bleed ? `0 -${HERO_PAD_X}px` : undefined, height: 'auto', borderRadius: 0, minHeight: 31, padding: `${entity.kind === 'team' ? 5 : 4}px ${HERO_PAD_X}px`, border: 'none', background: mine ? 'var(--tour-board-mine)' : 'transparent', color: ink, textAlign: 'left', fontFamily: FONT, cursor: tappable ? 'pointer' : 'default' }}
        className={tappable ? `${press} transition-colors` : undefined}
      >
        {showOverviewPosition ? (
          /* CB57: capped and lower ties use the SAME stretched grid
             cell and bracket; the cap still owns the visible T1 label. */
          <div data-hero-tie={inTopTie ? 'capped' : tieRole} style={{ position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center', ...HERO_POS_TYPE, letterSpacing: 0, color: ink, fontVariantNumeric: 'tabular-nums lining-nums' }}>
            {/* ONE MARKER PER TIE: capped/later rows are screen-reader only.
                 No tie bracket — tied rows show the position once. */}
            {inTopTie || tieRole === 'middle' || tieRole === 'last' ? <span className="sr-only">{posText}</span> : posText}
          </div>
        ) : null}
        <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          {entity.kind === 'team' ? renderEntityName(entity) : (
            <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15, fontSize: 13, fontWeight: 600, letterSpacing: 0, color: ink }}>{overviewName(entity.lines[0])}</span>
          )}
          {mine ? <span data-hero-extra-star style={{ color: 'var(--tour-board-amber)', fontSize: 11, marginLeft: 4 }}>★</span> : null}
          {pickPlayerIds && r.player?.id && pickPlayerIds.has(r.player.id) ? <ClbhouzPickMark size={10} label={t('overview.board.clbhouzPick')} /> : null}
        </div>
        {heroRounds.map((rd) => {
          const val = heroRoundScore(r, rd, currentRound);
          const tee = val == null && rd === teeRound && r.player?.id ? teesByPlayer.get(r.player.id) : null;
          return (
            <div key={rd} data-hero-round={rd} data-hero-selected-score={isOpen && expanded?.round === rd} data-hero-tee={tee ? true : undefined} style={{ ...HERO_NUM, fontSize: tee ? 11 : 12, fontWeight: heroCols.liveRound === rd ? 700 : 600, color: tee ? WHITE_ALPHA_45 : getScoreColor(val, scoreTheme) }}>
              {val == null ? tee ?? BLANK : fmtScore(val)}
            </div>
          );
        })}
        <div data-hero-tot style={{ ...HERO_NUM, ...HERO_TOT_TYPE, color: getScoreColor(r.score, scoreTheme) }}>{r.score == null ? BLANK : fmtScore(r.score)}</div>
      </RowTag>
      {isOpen && expanded && pid ? (() => { const panel = <HeroRoundPanel key={pid} tournamentId={tournamentId} playerId={pid} round={expanded.round} rounds={totalRounds ?? Math.max(...heroCols.rounds, currentRound ?? 1)} startedRounds={started} boardUpdatedAt={boardUpdatedAt} onRound={round => setExpanded({ playerId: pid, round })} onFull={openScorecard} />; return bleed ? <div style={{ margin: `0 -${HERO_PAD_X}px` }}>{panel}</div> : panel; })() : null}</Fragment>
    );
  };

  /* LEADERBOARD kicker shares the heading line with the score labels when
     it fits the POS+PLAYER track; otherwise the labels drop to their own
     line directly under it (fit rule a). No POS/PLAYER titles anywhere. */
  const headerRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLSpanElement>(null);
  const [labelsOwnLine, setLabelsOwnLine] = useState(false);
  useEffect(() => {
    const header = headerRef.current;
    const kicker = kickerRef.current;
    if (!header || !kicker) return;
    const measure = () => {
      // The heading spans POS + PLAYER. Measure its text, not the stretched
      // grid item (which becomes full-width when labels use their own line).
      const fixed = heroRounds.length * HERO_ROUND_W + HERO_TOT_W + heroGap * (heroRounds.length + 1);
      const available = header.clientWidth - fixed - (bleed ? 0 : 2 * HERO_PAD_X);
      const range = document.createRange();
      range.selectNodeContents(kicker);
      setLabelsOwnLine(range.getBoundingClientRect().width > available);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, [showOverviewPosition, heroRounds.length, heroGap, bleed]);

  const boardKicker = (
    <span ref={kickerRef} data-hero-board-kicker style={{ gridColumn: labelsOwnLine ? '1 / -1' : showOverviewPosition ? '1 / 3' : '1 / 2', gridRow: 1, fontWeight: 800, letterSpacing: '0.16em', textAlign: 'left', minWidth: 0 }}>{t('rebuilt.leaderboard', { defaultValue: 'Leaderboard' })}</span>
  );

  return (
    <>
      <div className="hero-expand-board" style={{ background: PAGE_CANVAS, fontFamily: FONT, paddingTop: afterMovers || flushTop ? 0 : 12 }}>
        <div ref={headerRef} data-overview-board-header style={{ display: 'grid', gridTemplateColumns: overviewGrid, alignItems: 'end', gap: heroGap, padding: `2px ${bleed ? 0 : HERO_PAD_X}px 6px`, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: OVERVIEW.mute, textTransform: 'uppercase' }}>
          {boardKicker}
          {labelsOwnLine && showOverviewPosition ? <div aria-hidden="true" /> : null}
          <div ref={nameTrackRef} aria-hidden="true" style={labelsOwnLine ? undefined : { gridColumn: showOverviewPosition ? '2 / 3' : '1 / 2', gridRow: 1, minWidth: 0, height: 0, visibility: 'hidden' }} />
          {heroRounds.map((rd) => (
            <div key={rd} data-hero-round-header={rd} style={{ textAlign: 'center', color: heroCols.liveRound === rd ? TOUR_LIVE_GREEN : faint }}>
              {`R${rd}`}
            </div>
          ))}
          <div style={{ textAlign: 'center' }}>{t('board.columns.tot')}</div>
        </div>
        {topTieLength === 0 ? rows.map((r, i) => renderRow(r, i, false)) : (
          <>
            <div data-hero-tie-cap style={{ padding: `9px ${bleed ? 0 : HERO_PAD_X}px 3px`, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: OVERVIEW.ink, fontVariantNumeric: 'tabular-nums lining-nums' }}>T1</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: OVERVIEW.mute }}>
                {t('overview.hero.tiedCaps', { words: countInWords(topTieCount, t) })}
              </span>
            </div>
            <div data-hero-tie-group style={{ position: 'relative' }}>
              {rows.slice(0, topTieLength).map((r, i) => renderRow(r, i, true))}
            </div>
            {rows.slice(topTieLength).map((r, i) => renderRow(r, i + topTieLength, false))}
          </>
        )}
        {extraRows && extraRows.length > 0 ? (
          <>
            <div data-hero-extra-rule style={{ height: 1, margin: '4px 0', background: 'var(--tour-board-empty)' }} />
            {extraRows.map((r, i) => renderRow(r, rows.length + i, false, true))}
          </>
        ) : null}
        {onFullBoard ? <Button variant="ghost" className="hero-full-leaderboard" data-hero-full-leaderboard data-field-size={entries.length} onClick={onFullBoard}>
          {t('overview.board.fullLeaderboard', { defaultValue: 'Full leaderboard' })}
          <span className="hero-full-leaderboard-count">{t('overview.board.fieldSize', { count: entries.length, defaultValue_one: '{{count}} player', defaultValue_other: '{{count}} players', defaultValue: `${entries.length} ${entries.length === 1 ? 'player' : 'players'}` })}<b aria-hidden="true">›</b></span>
        </Button> : null}
      </div>

      <ScorecardSheet open={!!target} onClose={() => setTarget(null)} tournamentId={tournamentId} target={target} />
    </>
  );
}
