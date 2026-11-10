/**
 * MiniBoard - TD1 top-5 compressed board.
 * Panel grammar: POS | PLAYER + flag | THRU | TODAY | TOT.
 * Hero grammar: POS | PLAYER | R1…Rn | TOT in every phase — EXTRACTED to
 * HeroBoardRows.tsx, which the Tour hero and Also this week both render.
 * Hero rows remain single-line; only an open hero panel reads its selected round.
 * Other themes retain direct ScorecardSheet taps. A row with no player id
 * (a team row) is not tappable.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CountryFlag from '@/components/ui/country-flag';
import { computeBoardColumns, todayFromEntry, type BoardEntry } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import {
  FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE,
  WHITE_ALPHA_65, WHITE_ALPHA_12, WHITE_ALPHA_06,
} from '../../_shared/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import { ClbhouzPickMark } from '../../_shared/ClbhouzPickMark';
import { formatEarnings } from '../../_shared/formatEarnings';
import { resolveBoardEntity, teamNamesNeedInitials, type BoardNameTier } from '../../_shared/boardEntity';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';

import { HeroBoardRows } from './HeroBoardRows';

/* The hero board's rendering and helpers live in HeroBoardRows.tsx (shared
   with Also this week); these re-exports keep existing imports stable. */
export {
  HeroBoardRows,
  heroBoardColumns, heroRoundScore, heroTeeRound, heroTopTieLength, heroTieRoles,
  HERO_PAD_X, HERO_POS_W, HERO_TOT_W, HERO_GAP,
} from './HeroBoardRows';
export type { TieRole } from './HeroBoardRows';

type Row = BoardEntry;

interface Props {
  tournamentId: string;
  entries: Row[];
  limit?: number;
  presentation?: 'tournament';
  winnerPlayerId?:string|null;
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
  /** Hero-only opt-in: the movers band owns the preceding seam. */
  afterMovers?: boolean;
  onFullBoard?: () => void;
  boardUpdatedAt?: number;
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

export function MiniBoard({ tournamentId, entries, limit = 5, currentRound, theme = 'panel', pickPlayerIds, onRowTap, phase = 'live', tourSlug = null, totalRounds = null, presentation, winnerPlayerId, afterMovers = false, onFullBoard, boardUpdatedAt = 0 }: Props) {
  const { t } = useTranslation('tourhub');
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  useEffect(() => { setTarget(null); }, [tournamentId]);
  const rows = entries.slice(0, limit);
  const needsInitials = useMemo(() => teamNamesNeedInitials(entries), [entries]);
  const nameTrackRef = useRef<HTMLDivElement>(null);
  const [nameTrackWidth, setNameTrackWidth] = useState(0);
  const T = THEME_TOKENS[theme];
  /** getScoreColor knows two ramps only; both dark grounds take the dark ramp. */
  const scoreTheme = theme === 'light' ? 'light' : 'dark';
  // Dark grounds: an absent TODAY reads as an em dash (never a zero, never
  // the previous round). The light board keeps its blank-cell doctrine.
  const todayBlank = theme === 'light' ? BLANK : '—';
  const showPrize = shouldShowPrize(entries);
  const heroCols = useMemo(
    () => computeBoardColumns(entries, currentRound ?? null, phase === 'completed'),
    [entries, currentRound, phase],
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
  }, [theme]);

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

  if(presentation==='tournament')return <><div className="tv-board"><div className="tv-board-head"><span style={{gridColumn:3}}>{phase==='completed'?`R${currentRound??heroCols.rounds.length}`:panelScoreLabel}</span><span style={{gridColumn:4}}>{t('board.columns.tot')}</span></div>{rows.map(r=>{const today=todayFromEntry(r,currentRound);return <Button variant="ghost" key={r.id} className="tv-board-row" data-winner={phase==='completed'&&r.player?.id===winnerPlayerId} disabled={!r.player?.id} onClick={()=>{if(!r.player)return;setTarget({playerId:r.player.id,playerName:r.player.full_name,countryCode:r.player.country_code??null,position:r.position,total:r.score,today,thru:r.thru??null,status:r.status??null});}}><span>{r.position!=null?`${r.position_tied?'T':''}${r.position}`:r.status??''}</span><span className="tv-board-who">{r.player&&<SquircleAvatar size={24} srcCandidates={resolvePlayerAvatarCandidates({name:r.player.full_name,photoUrl:r.player.photo_url,tourSlug})} alt={r.player.full_name} userId={r.player.id} hideRing/>}<span>{r.player?.full_name??resolveBoardEntity(r,needsInitials,nameTier).prose}</span></span><span className={today!=null&&today<0?'tv-under':''}>{today!=null?fmtScore(today):''}</span><span className={r.score!=null&&r.score<0?'tv-under':''}>{r.score!=null?fmtScore(r.score):''}</span></Button>;})}</div><ScorecardSheet open={!!target} onClose={()=>setTarget(null)} tournamentId={tournamentId} target={target}/></>;
  if (theme === 'heroBoard') {
    /* ONE BOARD, SHARED WITH ALSO THIS WEEK — see HeroBoardRows.tsx. */
    return <HeroBoardRows
      tournamentId={tournamentId}
      entries={entries}
      rows={rows}
      currentRound={currentRound}
      phase={phase}
      tourSlug={tourSlug}
      totalRounds={totalRounds}
      afterMovers={afterMovers}
      onFullBoard={onFullBoard}
      boardUpdatedAt={boardUpdatedAt}
      onRowTap={onRowTap}
      pickPlayerIds={pickPlayerIds}
    />;
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
          <div style={{ width: 34, flexShrink: 0 }} aria-hidden="true" />
          <div ref={nameTrackRef} style={{ flex: 1, minWidth: 0 }} aria-hidden="true" />
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
