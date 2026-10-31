/**
 * MiniBoard - TD1 top-5 compressed board.
 * Grammar: POS | PLAYER + flag | THRU | TODAY | TOT
 * Row tap opens ScorecardSheet, on every theme; a row with no player id
 * (a team row) is not tappable.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CountryFlag from '@/components/ui/country-flag';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { computeBoardColumns, todayFromEntry, type BoardEntry } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import {
  FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE,
  WHITE_ALPHA_65, WHITE_ALPHA_12, WHITE_ALPHA_06, AMBER,
} from '../../_shared/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import { ClbhouzPickMark } from '../../_shared/ClbhouzPickMark';
import { formatEarnings } from '../../_shared/formatEarnings';
import { resolveBoardEntity, teamNamesNeedInitials, type BoardNameTier } from '../../_shared/boardEntity';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { OVERVIEW, countInWords } from '../../components/overview-v3/overviewTokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { useTeeTimesAll } from '../data/useTeeTimesAll';
import { formatTimeHm24 } from '@/i18n/format';

import { TrajectorySparkline } from '../../components/overview-v3/HybridHeroBands/TrajectorySparkline';

type Row = BoardEntry;

interface Props {
  tournamentId: string;
  entries: Row[];
  limit?: number;
  /** Active round from sr_tournaments.current_round - scopes TODAY and THRU. */
  currentRound?: number | null;
  /**
   * THE GROUND THE BOARD SITS ON. One component, two real grounds:
   *  - 'panel' (default): the tournament page live/final board. It is a
   *    full-width square-corner page block, so it resolves onto PAGE_CANVAS.
   *  - 'heroBoard': the Tour Overview hybrid hero (HeroBoardBand). Its board
   *    resolves onto A.CANVAS and is continuous with the page around it.
   *  - 'light': legacy light chrome islands. No live callsite; retained because
   *    the light ramp has not been deleted.
   */
  theme?: 'panel' | 'heroBoard' | 'light';

  /**
   * Player ids that are Tournament Intelligence picks. DEFAULTS TO UNDEFINED so
   * the tournament-page consumers are pixel-identical — no fork.
   *
   * AMBER MEANS THE LIVE ROUND EVERYWHERE ELSE ON TOUR SURFACES. Here it is
   * deliberately a SECOND meaning, bounded to this one mark: it reads as the
   * clbhouz mark, not a status colour, because it is the logo. Do not "correct"
   * it to a neutral tone.
   */
  pickPlayerIds?: Set<string>;
  /** Row tap hook (analytics). Fires before the scorecard sheet opens. */
  onRowTap?: (playerId: string) => void;
  /**
   * Lifecycle. The tournament page passes 'completed' on its final
   * board so the score column can be named for its round and the dead
   * THRU column dropped. The hero uses it only to extinguish the final
   * round's amber header; round-column presence remains data-led.
   */
  phase?: 'live' | 'completed';
  /** heroBoard only: the event's tour, for the shared headshot resolver. */
  tourSlug?: string | null;
  /** heroBoard only: rounds in the schedule, so SHAPE always draws every slot. */
  totalRounds?: number | null;
}

/**
 * Surface tokens per ground. INK has no named dark counterpart — plain white.
 *
 * 'panel' and 'heroBoard' share the page ground and ink ramp. They remain
 * separate themes because their hairline treatments differ by context.
 */
const THEME_TOKENS = {
  light: { surface: SURFACE, ink: INK, mute: INK_MUTE, faint: INK_FAINT, hairline: HAIRLINE_INK_8, press: 'active:bg-black/[0.03]' },
  panel: { surface: PAGE_CANVAS, ink: '#FFFFFF', mute: WHITE_ALPHA_65, faint: WHITE_ALPHA_65, hairline: WHITE_ALPHA_12, press: 'active:bg-white/[0.06]' },
  heroBoard: { surface: PAGE_CANVAS, ink: '#FFFFFF', mute: WHITE_ALPHA_65, faint: WHITE_ALPHA_65, hairline: WHITE_ALPHA_06, press: 'active:bg-white/[0.06]' },
} as const;

/* Signed-off hero-only geometry. Full BoardTable owns its independent tracks;
   changing these constants must never resize the full leaderboard. */
const HERO_PAD_X = 20;
const HERO_POS_W = 24;
const HERO_ROUND_W = 32;
const HERO_TODAY_W = 40;
const HERO_TOT_W = 40;
const HERO_SHAPE_W = 44;
const HERO_GAP = 4;
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

/** THE HERO BOARD'S COLUMNS, as a broadcast board sets them.
 *
 *  THRU is live state and the hero board has never carried it (the old
 *  `showPanelThru` excluded this theme by name). It is the single most
 *  useful column on a board during play and it is added here.
 *
 *  TODAY ONLY APPEARS WHEN IT CAN DIFFER FROM TOTAL. In round one a
 *  player's total IS today's score, so printing both is the same number
 *  twice on every row. From round two they diverge and TODAY earns its
 *  place.
 *
 *  PER-ROUND COLUMNS NEED AT LEAST TWO ROUNDS for the same reason: a lone
 *  R1 column is the total under another name.
 *
 *  MOV (places gained since the round began) IS A LIVE IDEA. It appears
 *  only while play is in progress (live or suspended mid-round); on a
 *  finished board the round columns already tell how the week went. It
 *  NEEDS A PRIOR ROUND: round one has nothing to rank against, so no
 *  header, no track, no dashes — the width returns to the name. And
 *  FOUR ROUND COLUMNS WIN: beside four round tracks MOV takes the player
 *  track below what a full name needs (~124px at 382px), so MOV is the
 *  column that goes, never the name. `hasMovement` is the data guard:
 *  movementFromRounds over the FULL field returned at least one delta.
 */
export function heroBoardColumns(opts: { roundCount: number; roundInProgress: boolean; completed: boolean }): {
  today: boolean; rounds: boolean; shape: boolean;
} {
  /* BRIEF_TOUR_OVERVIEW_MOCK_EXACT §D.1 supersedes the THRU and MOV notes
     above: the live grammar is POS | PLAYER | TODAY | SHAPE | TOT. MOV left
     because movement has its own band (RoundMovementBand) and must not be said
     twice; THRU left because the mock does not carry it. TODAY keeps its
     round-one rule (it would equal TOT). */
  const live = !opts.completed && opts.roundInProgress;
  const multi = opts.roundCount >= 2;
  if (live) return { today: multi, rounds: false, shape: true };
  return { today: false, rounds: multi, shape: false };
}

/** The live hero grid, exactly as the mock sets it. */
export function heroLiveGrid(showToday: boolean): string {
  return [`${HERO_POS_W}px`, 'minmax(0,1fr)', showToday ? `${HERO_TODAY_W}px` : null, `${HERO_SHAPE_W}px`, `${HERO_TOT_W}px`].filter(Boolean).join(' ');
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


/**
 * Canonical scoring: fmtScore + getScoreColor(..., theme) - the same helpers
 * the schedule, board and college surfaces use. No local forks. The canonical
 * theme is 'dark' (the app's only surface); 'light' survives for the few light
 * chrome islands that have not been flipped, and is NOT the default.
 *
 * Placeholders: a missing figure renders as NOTHING. An em dash is a value in
 * a tabular column and reads as data the field does not have.
 */
const BLANK = '';
/**
 * THE PRIZE RULE — a property of the TOURNAMENT, never of the visible slice.
 * Render the PRIZE column when ANY row has a money value; hide it, header
 * included, when none do. Because the condition reads the whole field, the
 * column is STABLE: expanding, sorting or scrolling the board never flips it.
 *
 * Within a rendered column a row with no money shows an em dash — never a
 * blank, never a zero. A missed cut, a withdrawal, a DQ and a non-starter
 * earn nothing, and a dash is how every leaderboard in the sport states that.
 *
 * Two completed events on the same tour in the same season can legitimately
 * differ here (measured: ~40% of events have no prize data at all). That is
 * the data, not a UI inconsistency — do not "fix" it per event.
 */
export function shouldShowPrize(entries: Array<{ money?: number | null }>): boolean {
  return entries.some((row) => row.money != null);
}

export function thruLabel(row: Row, today: number | null): string {
  const s = row.status?.toUpperCase();
  if (s === 'MC' || s === 'CUT') return 'MC';
  if (s === 'WD') return 'WD';
  // THRU must agree with TODAY: no round score for the active round means the
  // player has not started, so the stale top-level thru must not render.
  if (today == null) return BLANK;
  if (row.thru == null) return BLANK;
  return row.thru >= 18 ? 'F' : String(row.thru);
}

export function MiniBoard({ tournamentId, entries, limit = 5, currentRound, theme = 'panel', pickPlayerIds, onRowTap, phase = 'live', tourSlug = null, totalRounds = null }: Props) {
  const { t } = useTranslation('tourhub');
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const rows = entries.slice(0, limit);
  const needsInitials = useMemo(() => teamNamesNeedInitials(entries), [entries]);
  const nameTrackRef = useRef<HTMLDivElement>(null);
  const [nameTrackWidth, setNameTrackWidth] = useState(0);
  const T = THEME_TOKENS[theme];
  /** getScoreColor knows two ramps only; both dark grounds take the dark ramp. */
  const scoreTheme = theme === 'light' ? 'light' : 'dark';
  // Dark grounds: an absent TODAY reads as an em dash (never a zero, never
  // the previous round). The light board keeps its blank-cell doctrine.
  const todayBlank = theme === 'light' ? BLANK : '\u2014';
  const showOverviewPosition = rows.some((row) => row.position != null || ['MC', 'CUT', 'WD'].includes(row.status?.toUpperCase() ?? ''));
  // PRIZE is decided over the WHOLE FIELD (entries), not the rendered slice,
  // so the column cannot appear or vanish as the board is expanded or scrolled.
  const showPrize = shouldShowPrize(entries);
  /* OVER THE WHOLE FIELD, never `rows`. Column presence is a property
     of the TOURNAMENT — the same doctrine that governs showPrize — so
     expanding or re-sorting the board can never add or drop a column. */
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
  /* A ROUND IN PROGRESS IS WHAT THRU IS FOR. Decided over `entries`,
     not the five visible rows, so the column cannot appear when the
     board is expanded. Mirrors computeBoardColumns' own showThru rule. */
  const roundInProgress = entries.some((row) => {
    const s = row.status?.toUpperCase();
    if (s === 'MC' || s === 'CUT' || s === 'WD') return false;
    if (todayFromEntry(row as unknown as Parameters<typeof todayFromEntry>[0], currentRound) == null) return false;
    return row.thru != null && row.thru < 18;
  });
  const heroColumnRule = heroBoardColumns({
    roundCount: heroCols.rounds.length,
    roundInProgress,
    completed: phase === 'completed',
  });
  const tieRoles = heroTieRoles(rows);
  const showHeroToday = theme === 'heroBoard' && heroColumnRule.today;
  const showHeroRounds = theme === 'heroBoard' && heroHasRoundData && heroColumnRule.rounds;
  const heroRounds = showHeroRounds ? heroCols.rounds : [];
  const heroRoundTracks = heroRounds.map(() => `${HERO_ROUND_W}px`).join(' ');
  const showHeroShape = theme === 'heroBoard' && heroColumnRule.shape;
  const topTieLength = theme === 'heroBoard' && showHeroShape ? heroTopTieLength(rows) : 0;
  const topTieCount = topTieLength > 0 ? entries.filter((e) => e.position === 1).length : 0;
  const legacyGrid = [
    showOverviewPosition ? `${HERO_POS_W}px` : null,
    'minmax(0, 1fr)',
    showHeroToday ? `${HERO_TODAY_W}px` : null,
    heroRoundTracks || null,
    `${HERO_TOT_W}px`,
  ].filter(Boolean).join(' ');
  const overviewGrid = showHeroShape ? heroLiveGrid(showHeroToday) : legacyGrid;
  const heroGap = HERO_GAP;
  const teeRound = theme === 'heroBoard' ? heroTeeRound(entries, rows, heroRounds, currentRound, phase === 'completed') : null;
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
  const shapeSlots = Math.max(totalRounds ?? 0, heroCols.rounds.length, currentRound ?? 0);

  const showPanelThru = theme !== 'heroBoard' && phase !== 'completed' && roundInProgress;
  /* WHEN NOTHING IS IN PROGRESS, "TODAY" IS A LIE — the column is
     already showing round N's score, so it takes round N's name. */
  const panelRoundNamed = phase === 'completed' && currentRound != null;
  const panelScoreLabel = panelRoundNamed ? `R${currentRound}` : t('board.columns.today');

  useEffect(() => {
    const element = nameTrackRef.current;
    if (!element) return;
    const measure = () => setNameTrackWidth(element.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [theme, heroRounds.length, overviewGrid]);

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

  const renderEntityName = (entity: ReturnType<typeof resolveBoardEntity>, ink: string) => entity.kind === 'team' ? (
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

  if (theme === 'heroBoard') {
    return (
      <>
        <div style={{ background: T.surface, fontFamily: FONT }}>
          <div data-overview-board-header style={{ display: 'grid', gridTemplateColumns: overviewGrid, alignItems: 'center', gap: heroGap, minHeight: 26, padding: `4px ${HERO_PAD_X}px`, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: OVERVIEW.mute, textTransform: 'uppercase' }}>
            {showHeroShape || showOverviewPosition ? <div>{t('board.columns.pos')}</div> : null}
            <div ref={nameTrackRef}>{t('board.columns.player')}</div>
            {showHeroToday ? <div style={{ textAlign: 'center' }}>{t('board.columns.today')}</div> : null}
            {showHeroShape ? <div style={{ textAlign: 'center' }}>{t('board.columns.rounds')}</div> : null}
            {heroRounds.map((rd) => (
              <div key={rd} style={{ textAlign: 'center', color: heroCols.liveRound === rd ? AMBER : T.faint }}>
                {`R${rd}`}
              </div>
            ))}
            <div style={{ textAlign: 'center' }}>{t('board.columns.tot')}</div>
          </div>
          {(() => {
          const renderRow = (r: Row, rowIndex: number, inTopTie: boolean) => {
            const entity = resolveBoardEntity(r, needsInitials, nameTier);
            const tieRole = tieRoles[rowIndex];
            const demotedRow = ['MC', 'CUT', 'WD'].includes(r.status?.toUpperCase() ?? '');
            const posText = r.status === 'MC' || r.status === 'CUT' ? 'MC'
              : r.status === 'WD' ? 'WD'
              : r.position == null ? BLANK
              : `${r.position_tied ? 'T' : ''}${r.position}`;
            const today = todayFromEntry(r as unknown as Parameters<typeof todayFromEntry>[0], currentRound);
            /* A ROW OPENS ONLY WHAT IS BEHIND IT. The scorecard sheet is keyed by
               one player's id; a team row has none, and a member's individual card
               is not the team's round. So a team row is not a control at all. */
            const tappable = !!r.player?.id;
            const memberNames = (r.team?.members ?? []).map((m) => m.player?.full_name?.trim()).filter(Boolean).join(', ');
            const teamTitle = r.team?.display_name?.trim() || r.team?.abbr_name?.trim() || '';
            const labelName = entity.kind === 'team'
              ? (teamTitle && memberNames ? t('overview.board.teamName', { team: teamTitle, members: memberNames }) : teamTitle || memberNames || entity.prose)
              : entity.lines[0] ?? '';
            const rowLabel = t('overview.board.rowLabel', { name: labelName, position: posText, score: r.score == null ? '' : fmtScore(r.score) });
            const RowTag = tappable ? Button : 'div';
            return (
              <RowTag
                key={r.id}
                {...(tappable ? { type: 'button' as const, variant: 'ghost' as const, 'aria-haspopup': 'dialog' as const } : { role: 'group' })}
                aria-label={rowLabel}
                onClick={tappable ? () => {
                  const pid = r.player?.id;
                  if (!pid) return;
                  onRowTap?.(pid);
                  setTarget({
                    playerId: pid,
                    playerName: entity.lines[0] ?? '',
                    countryCode: r.player?.country_code ?? r.player?.country ?? null,
                    position: r.position ?? null,
                    positionTied: r.position_tied ?? null,
                    total: r.score ?? null,
                    today,
                    thru: r.thru ?? null,
                    status: r.status ?? null,
                  });
                } : undefined}
                style={{ position: 'relative', display: 'grid', gridTemplateColumns: overviewGrid, alignItems: 'center', gap: heroGap, width: '100%', height: 'auto', borderRadius: 0, minHeight: showHeroShape ? 36 : 34, padding: showHeroShape ? `6px ${HERO_PAD_X}px` : `${entity.kind === 'team' ? 6 : 5}px ${HERO_PAD_X}px`, border: 'none', background: 'transparent', color: T.ink, textAlign: 'left', fontFamily: FONT, cursor: tappable ? 'pointer' : 'default' }}
                className={tappable ? `${T.press} transition-colors` : undefined}
              >
                {showHeroShape || showOverviewPosition ? (
                  /* CB57: capped and lower ties use the SAME stretched grid
                     cell and bracket; the cap still owns the visible T1 label. */
                  <div data-hero-tie={inTopTie ? 'capped' : tieRole} style={{ position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center', fontSize: 12.5, fontWeight: 700, letterSpacing: 0, color: T.ink, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                    {/* ONE MARKER PER TIE: capped/later rows are screen-reader only. */}
                    {inTopTie || tieRole === 'middle' || tieRole === 'last' ? <span className="sr-only">{posText}</span> : posText}
                    {tieRole !== 'solo' ? (
                      <span
                        aria-hidden
                        data-hero-tie-bracket
                        style={{
                          position: 'absolute', right: 2, width: 1.5, borderRadius: 1, background: OVERVIEW.bracket,
                          /* Rows are padded, so the rule reaches through the padding
                             to meet its neighbour: start under the marker, end at the
                             last row's centre. */
                          top: tieRole === 'first' ? '50%' : -6,
                          bottom: tieRole === 'last' ? '50%' : -6,
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: showHeroShape ? 6 : 5 }}>
                  {/* §D.4 a face leads the name. The heroBoard theme never drew a flag. */}
                  {showHeroShape ? (
                    <SquircleAvatar size={22} srcCandidates={r.player ? resolvePlayerAvatarCandidates({ name: r.player.full_name, photoUrl: r.player.photo_url ?? null, tourSlug }) : []} alt={entity.prose || entity.lines[0] || ''} userId={r.player?.id ?? r.id} hideRing />
                  ) : null}
                  {entity.kind === 'team' ? renderEntityName(entity, T.ink) : (
                    <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15, fontSize: 13, fontWeight: 600, letterSpacing: 0, color: T.ink }}>{overviewName(entity.lines[0])}</span>
                  )}
                  {pickPlayerIds && r.player?.id && pickPlayerIds.has(r.player.id) ? <ClbhouzPickMark size={10} label={t('overview.board.clbhouzPick')} /> : null}
                </div>
                {showHeroToday ? (
                  <div style={{ ...HERO_NUM, fontSize: 12, fontWeight: 700, color: getScoreColor(today, scoreTheme) }}>{today == null ? BLANK : fmtScore(today)}</div>
                ) : null}
                {showHeroShape ? (
                  <div data-hero-shape style={{ ...HERO_NUM, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minWidth: 0 }}>
                    <TrajectorySparkline
                      variant="bars"
                      rounds={[]}
                      ariaHidden
                      slots={Array.from({ length: shapeSlots }, (_, i) => {
                        const rd = i + 1;
                        if (rd === currentRound) return today;
                        return ([r.round_1, r.round_2, r.round_3, r.round_4][i] ?? null);
                      })}
                      liveIndex={currentRound != null && roundInProgress ? currentRound - 1 : null}
                    />
                  </div>
                ) : null}
                {heroRounds.map((rd) => {
                  const val = heroRoundScore(r, rd, currentRound);
                  const tee = val == null && rd === teeRound && r.player?.id ? teesByPlayer.get(r.player.id) : null;
                  return (
                    <div key={rd} data-hero-round={rd} data-hero-tee={tee ? true : undefined} style={{ ...HERO_NUM, fontSize: tee ? 11 : 12, fontWeight: heroCols.liveRound === rd ? 700 : 600, color: tee ? OVERVIEW.soft : getScoreColor(val, scoreTheme) }}>
                      {val == null ? tee ?? BLANK : fmtScore(val)}
                    </div>
                  );
                })}
                <div style={{ ...HERO_NUM, fontSize: 15, fontWeight: 700, color: getScoreColor(r.score, scoreTheme) }}>{r.score == null ? BLANK : fmtScore(r.score)}</div>
              </RowTag>
            );
          };
          if (topTieLength === 0) return rows.map((r, i) => renderRow(r, i, false));
          return (
            <>
              <div data-hero-tie-cap style={{ padding: `9px ${HERO_PAD_X}px 3px`, display: 'flex', alignItems: 'baseline', gap: 8 }}>
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
          );
          })()}
        </div>

        <ScorecardSheet open={!!target} onClose={() => setTarget(null)} tournamentId={tournamentId} target={target} />
      </>
    );
  }



  return (
    <>
        <div style={{ background: T.surface, fontFamily: FONT }} data-board-name-tier={nameTier}>
        <div
          style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 16px',
            borderBottom: `0.5px solid ${T.hairline}`,
            // AXIS 10: column headers (POS / PLAYER / THRU / TODAY / TOT).
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            color: T.faint, textTransform: 'uppercase',
          }}
        >
          <div style={{ width: 34, flexShrink: 0 }}>{t('board.columns.pos')}</div>
          <div ref={nameTrackRef} style={{ flex: 1, minWidth: 0 }}>{t('board.columns.player')}</div>
          {showPanelThru ? <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>{t('board.columns.thru')}</div> : null}
          <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>{panelScoreLabel}</div>
          <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>{t('board.columns.tot')}</div>
          {showPrize ? <div style={{ width: 52, textAlign: 'center', flexShrink: 0 }}>{t('board.columns.prize', 'Prize')}</div> : null}


        </div>
        {rows.map((r) => {
          const entity = resolveBoardEntity(r, needsInitials, nameTier);
          const posText = r.status === 'MC' || r.status === 'CUT' ? 'MC'
            : r.status === 'WD' ? 'WD'
            : r.position == null ? BLANK
            : `${r.position_tied ? 'T' : ''}${r.position}`;
          const cc = r.player?.country_code ?? r.player?.country ?? null;
          
          const today = todayFromEntry(r as unknown as Parameters<typeof todayFromEntry>[0], currentRound);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => { if (!r.player?.id) return; onRowTap?.(r.player.id); setTarget({
                playerId: r.player.id,
                playerName: entity.lines[0] ?? '',
                countryCode: cc,
                position: r.position ?? null,
                positionTied: r.position_tied ?? null,
                total: r.score ?? null,
                today,
                thru: r.thru ?? null,
                status: r.status ?? null,
              }); }}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: `${entity.kind === 'team' ? 9 : 10}px 16px`,
                borderBottom: `0.5px solid ${T.hairline}`,
                background: r.position === 1 ? 'rgba(251,188,46,0.05)' : 'transparent', border: 'none',
                borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                textAlign: 'left', cursor: 'pointer', fontFamily: FONT,
              }}
              className={`${T.press} transition-colors`}
            >
              <div style={{ width: 34, flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {posText}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
                {cc ? <CountryFlag country={cc} size="sm" /> : null}
                {entity.kind === 'team' ? renderEntityName(entity, T.ink) : (
                  <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.15, color: T.ink, whiteSpace: 'normal' }}>
                    {entity.lines[0] ?? ''}
                  </span>
                )}
                {pickPlayerIds && r.player?.id && pickPlayerIds.has(r.player.id) && (
                  <ClbhouzPickMark size={11} label={t('overview.board.clbhouzPick')} />
                )}
              </div>
              {showPanelThru ? (
                <div style={{ width: 40, textAlign: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600, color: T.mute, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  {thruLabel(r, today)}
                </div>
              ) : null}
              <div style={{ width: 46, textAlign: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: getScoreColor(today, scoreTheme), fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {today == null ? todayBlank : fmtScore(today)}
              </div>
              <div style={{ width: 46, textAlign: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: getScoreColor(r.score, scoreTheme), fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {r.score == null ? BLANK : fmtScore(r.score)}
              </div>
              {/* No money earned is a VALUE: an em dash in the faint slot, never
                  a blank, never a zero. Column presence is a tournament-level
                  decision (showPrize) so it cannot flicker per row. */}
              {showPrize ? (
                <div style={{ width: 52, textAlign: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600, color: r.money != null ? T.mute : T.faint, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  {r.money != null ? formatEarnings(r.money) : '—'}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      <ScorecardSheet
        open={!!target}
        onClose={() => setTarget(null)}
        tournamentId={tournamentId}
        target={target}
      />
    </>
  );
}
