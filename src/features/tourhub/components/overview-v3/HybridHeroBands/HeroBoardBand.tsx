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
 * HeroBoardSection — the always-on live leaderboard that EXTENDS DOWNWARD from
 * the hero.
 *
 * It is NOT inside the hero card and it never replaces the photo. The hero is a
 * horizontally swiping carousel whose cards share a definite height
 * (TOTAL_HERO_HEIGHT_TARGET); putting the board inside would have forced every
 * card taller, including upcoming tournaments that have no board and would then
 * carry ~270px of dead space. So the board renders as a section BENEATH the
 * carousel, tracking the active slide: the photo moves horizontally on swipe
 * while the board cross-fades in place.
 *
 * CB57 order, one continuous dark surface with NO seam:
 *   photo → board rows (live/completed) or upcoming facts line (upcoming) →
 *   OUR PICKS block → CB58 leaders' group (live individual events only).
 *   Merged Airy adds inset picks and leaders hairlines. No action or next-round
 *   row. Existing movement and pick-card internal rules are retained
 *   and reported under CB57, not silently removed.
 * There is no stat strip and no COURSE SHAPE panel in this file or in
 * OverviewHero.tsx any more — older briefs described both; neither renders.
 * STRAIGHT bottom edge — the page canvas breathes below it, it does not tuck
 * under a radius.
 *
 * PICKS DO NOT COLLAPSE (BRIEF — THE PICKS COME OUT FROM BEHIND THE CHEVRON,
 * superseding BRIEF_HERO_PICKS_ROW §0a): the picks are the band's content and
 * render whenever picks exist, on every phase. The rule that survives: a
 * vertical scroller under a horizontal pager is a gesture trap and is
 * forbidden. The picks block is a FIXED grid of at most three cards and never
 * scrolls internally — do not turn it into a carousel or a scroller.
 *
 * The band renders on UPCOMING slides too. With no board there are no rows —
 * and NO placeholder or reserved height for them (§1).
 *
 * CB57: board rows are fixed, never internally scrollable; the photo remains
 * the tournament door. CB58 adds only the signed-off leaders' group, without
 * placeholder or reserved height.
 */

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';

import { AMBER, FONT, GOLD, INK, WHITE_ALPHA_06, WHITE_ALPHA_65, WHITE_ALPHA_12, TOPAR_UNDER_DARK, LIVE_INK, STATUS_NEGATIVE } from '../../../_shared/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { MiniBoard } from '../../../tournament-v2/sections/MiniBoard';
import { useTourSelection } from '../../../context/TourSelectionContext';
import { PlayerAvatar } from '../../PlayerAvatar';
import { useAIPredictions, type AITopContender } from '../../../hooks/useAIPredictions';
import { useTournamentTeeTimes } from '../../../hooks/useTournamentTeeTimes';
import { useTournamentLastYearTop4 } from '../../../hooks/useTournamentLastYearTop4';
import { LastYearRow } from './LastYearRow';
import { inRequiredRoundWindow, leaderOf, neededGross } from './whatsNext';
import { surnameOf } from '../../../_shared/playerName';
import { PicksSheet } from './PicksSheet';
import type { HeroState } from '../HybridHero.utils';
import { fieldHasStarted, rowHasStarted } from '../../../overview/boardStarted';
import { usePickTeeTimes } from '../../../tournament-v2/data/usePickTeeTimes';
import { formatDayMonthShortGB, formatTimeHm24, formatWeekdayLong, formatWeekdayShortGB } from '@/i18n/format';
import { boardMovementMap, statusWord, todayFromEntry, type BoardEntry } from '../../../leaderboard/BoardTable';
import { normalizeStatus } from '../../../_shared/resultStatus';
import { resolvePlayerAvatarCandidates } from '../../../_shared/resolvePlayerAvatar';
import { OVERVIEW, pickMovementCards, type MovementCard } from '../overviewTokens';
import { fmtScore } from '../../../utils/fmtScore';
import { getScoreColor } from '../../../_shared/scoreColor';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { LeadersGroup } from './LeadersGroup';
import { PickMemberBands } from './PickMemberBands';
import { YourPickSheet } from './YourPickSheet';
import { OurRecordSheet } from './OurRecordSheet';
import { finishedVerdict, resultPosition, type PickResult } from './pickInsightRules';
import { Button } from '@/components/ui/button';
import './pickPanels.css';
import {PicksBlock} from './PicksBlock';


/**
 * FIVE rows: the leading positions shown on the hero board. The board sits
 * below the photo band, so no chrome clearance applies here.
 */
export const HERO_BOARD_ROWS = 5;

export function shouldShowOverviewBoard(entries: Array<{
  position?: number | null; score?: number | null;
  round_1?: number | null; round_2?: number | null; round_3?: number | null; round_4?: number | null; thru?: number | null;
}>): boolean {
  // Before the first tee every row is T1 at 0; nothing renders until someone starts.
  if (!fieldHasStarted(entries)) return false;
  const rows = entries.slice(0, HERO_BOARD_ROWS);
  if (rows.length === 0) return false;
  return rows.some((row) => row.position != null || (row.score != null && row.score !== 0));
}

const FIGS = { fontVariantNumeric: 'tabular-nums' as const, fontFeatureSettings: '"kern" 1, "liga" 1' };
const WON_LABEL = 'WON';

type SettledFigure = {
  right: string;
  rightColor: string;
  figure: string | null;
  figureColor: string;
};

/**
 * TOUR COLOUR RULE (unchanged from the removed panel): under par is RED,
 * level/over is INK — which on this dark surface is white.
 */
function tourFigColor(v: number | null | undefined): string {
  if (v == null || v === 0) return '#FFFFFF';
  return v < 0 ? TOPAR_UNDER_DARK : '#FFFFFF';
}

function settledFigureFor(
  line: { position: number | null; tied: boolean; score: number | null } | undefined,
): SettledFigure | null {
  if (!line || line.position == null) return null;

  // A TIED FIRST IS NOT A WIN - T1 stays a numeral. Unchanged rule from
  // MICRO_BRIEF_PICKS_ROW_WINNER section 2.
  const won = line.position === 1 && !line.tied;

  return {
    right: won ? WON_LABEL : `${line.tied ? 'T' : ''}${line.position}`,
    rightColor: won ? GOLD : WHITE_ALPHA_65,
    figure: line.score == null ? null : fmtScore(line.score),
    figureColor: tourFigColor(line.score),
  };
}

/**
 * Three equal thirds, not left/centre/right alignment. Figures are NOT heavy:
 * weight 600 with letter-spacing eased to -0.01em; still tabular.
 */
function StatCell({
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
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 0, textAlign: align }}>
      <div
        style={{
          fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: WHITE_ALPHA_65,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 0,
          lineHeight: 1.05,
          marginTop: 2,
          color: color ?? '#FFFFFF',
          ...FIGS,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: WHITE_ALPHA_65,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

interface HeroBoardSectionProps {
  tournamentId: string;
  eventName?: string;
  eventTourCode?: string;
  eventSeasonYear?: number;
  /** Event page opts into the SAME picks/sheets, without overview-only bands. */
  picksOnly?: boolean;
  entries: BoardEntry[];
  leaderboardLoading?: boolean;
  eventType?: string | null;
  /**
   * Active round. NULL on an upcoming (or completed) slide, where the band
   * exists only to carry the picks row — TODAY is meaningless without it.
   */
  currentRound: number | null;
  /**
   * The lifecycle phase of the slide, derived by `boardPhaseFor` from the ONE
   * HeroState OverviewHero computes — never from the carousel's `slide.type`,
   * so the photo and the board cannot describe the same event differently.
   */
  phase: 'live' | 'upcoming' | 'completed';
  /**
   * The champion's Sportradar id (sr_tournaments.winner_id), i.e. the same
   * champion the hero's ChampionStrip crowns. NULL on live/upcoming slides and
   * whenever the winner could not be resolved authoritatively — in which case
   * no trophy renders. Never compared by name or by position (a T1 playoff
   * loser is not the champion).
   */
  championSrId?: string | null;
  /** Team-event champions have no tournament winner_id, so members are matched by player id. */
  championPlayerIds?: string[];
  /** Rounds in this event, from the one HeroState derivation. Null off live/suspended. */
  totalRounds?: number | null;
  /** Venue par (to-par → gross conversion for the picks sheet's required round). */
  venuePar?: number | null;
  onRowTap?: (playerId: string) => void;
}

/**
 * The band's phase, read off the single HeroState. Suspended play keeps the
 * live columns (its scores are live scores); every `results` variant is
 * completed; upcoming is upcoming.
 */
export function boardPhaseFor(state: HeroState): HeroBoardSectionProps['phase'] {
  if (state.kind === 'live' || state.kind === 'suspended') return 'live';
  if (state.kind === 'results') return 'completed';
  return 'upcoming';
}

/**
 * Champion gate — the SAME rule as HybridHero's ChampionStrip: OverviewHero
 * passes `championSrId` only when `isChampionResolvable(state)` holds, and the
 * trophy is matched here by id alone. Never compared by name or by position
 * (a T1 playoff loser is not the champion).
 *
 * The champion's BOARD player id, resolved by id alone: the leaderboard row
 * whose player carries the champion's sr_id. Position is never consulted.
 */
export function resolveChampionPlayerId(
  entries: Array<{ player?: { id?: string | null; sr_id?: string | null } | null }>,
  championSrId: string | null | undefined,
  phase: HeroBoardSectionProps['phase'],
): string | null {
  if (phase !== 'completed' || !championSrId) return null;
  for (const entry of entries) {
    const player = entry?.player;
    if (player?.sr_id && String(player.sr_id) === String(championSrId) && player.id) {
      return String(player.id);
    }
  }
  return null;
}

/** A pick earns the trophy only when the pick IS the champion, by player id. */
export function pickWonTournament(
  pickPlayerId: string | null | undefined,
  championPlayerId: string | null,
  championPlayerIds: string[] = [],
): boolean {
  if (!pickPlayerId) return false;
  if (championPlayerId && String(pickPlayerId) === championPlayerId) return true;
  return championPlayerIds.some((id) => String(pickPlayerId) === String(id));
}

export function overviewTournamentDoorKey(phase: HeroBoardSectionProps['phase']): string {
  if (phase === 'completed') return 'overview.ticker.fullResults';
  if (phase === 'upcoming') return 'overview.leaderboardBand.ctaUpcoming';
  return 'overview.ticker.fullLeaderboard';
}

export function shouldLoadUpcomingFacts(phase: HeroBoardSectionProps['phase']): boolean {
  return phase === 'upcoming';
}

export interface UpcomingHeroFact {
  label: string;
  value: string;
  trailing: string | null;
  trailingColor: string;
}

export function compactUpcomingFacts(facts: Array<UpcomingHeroFact | null>): UpcomingHeroFact[] {
  return facts.filter((fact): fact is UpcomingHeroFact => fact !== null);
}

export function HeroBoardSection({
  tournamentId,
  entries,
  currentRound,
  phase,
  championSrId,
  championPlayerIds = [],
  venuePar = null,
  totalRounds = null,
  onRowTap,
  leaderboardLoading = false,
  eventType = null,
  eventName,
  eventTourCode,
  eventSeasonYear,
  picksOnly = false,
}: HeroBoardSectionProps) {
  const { t } = useTranslation('tourhub');
  /* Before the first tee the feed gives every row position 1 and a 0 score;
     a board of T1 E is false, so the board waits for the first started row. */
  const hasBoard = phase !== 'upcoming' && shouldShowOverviewBoard(entries);

  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const pickTourCode = eventTourCode ?? viewingTourSlug ?? 'pga';
  const picksTid = picksOnly ? tournamentId : (viewingTournamentId ?? tournamentId);
  const { data: predictions } = useAIPredictions(picksTid);
  const picks = (predictions?.topContenders ?? []) as AITopContender[];
  const hasPicks = picks.length > 0;
  const [picksOpen, setPicksOpen] = useState(false);
  const [tappedPick, setTappedPick] = useState<string | null>(null);
  const [yourPickOpen, setYourPickOpen] = useState(false);
  const [yourPickView, setYourPickView] = useState<'field'|'board'>('field');
  const [recordOpen, setRecordOpen] = useState(false);
  const pickPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of picks) if (p?.playerId) ids.add(String(p.playerId));
    return ids.size > 0 ? ids : undefined;
  }, [picks]);

  /* Picks tee line: the stored tee sheet for the current round (round 1 when
     upcoming), and which picks have started under the one has-started rule. */
  const teeRound = phase === 'upcoming' ? 1 : (currentRound ?? 1);
  const { data: pickTees } = usePickTeeTimes(picksTid, teeRound, picks.map((p) => String(p?.playerId ?? '')), { enabled: phase !== 'completed' });
  const startedPlayers = useMemo(() => {
    const set = new Set<string>();
    for (const entry of entries) {
      if (!rowHasStarted(entry)) continue;
      if (entry?.player?.id) set.add(String(entry.player.id));
      for (const m of entry?.team?.members ?? []) if (m?.player?.id) set.add(String(m.player.id));
    }
    return set;
  }, [entries]);

  const boardByPlayer = useMemo(() => {
    const map = new Map<string, { position: number | null; tied: boolean; score: number | null; status?: string | null }>();
    for (const entry of entries) {
      const line = { position: entry.position ?? null, tied: Boolean(entry.position_tied), score: entry.score ?? null, status: entry.status ?? null };
      const id = entry?.player?.id;
      if (id) {
        map.set(String(id), line);
        continue;
      }
      for (const member of entry?.team?.members ?? []) {
        const memberId = member?.player?.id;
        if (memberId) map.set(String(memberId), line);
      }
    }
    return map;
  }, [entries]);

  const championPlayerId = useMemo(
    () => resolveChampionPlayerId(entries, championSrId, phase),
    [championSrId, entries, phase],
  );
  const allPredictionPlayers = [...picks, ...(predictions?.darkHorses ?? [])];
  const pickResults: PickResult[] = allPredictionPlayers.map(p => {
    const line = boardByPlayer.get(p.playerId);
    const entry = entries.find(e=>e.player?.id===p.playerId);
    return { playerId:p.playerId, playerName:p.playerName, position:line?.position ?? null, tied:line?.tied, score:line?.score, status:line?.status,
      percentile: phase==='completed' && line?.position!=null && entries.length>1 ? Math.round((entries.length-line.position)/(entries.length-1)*100) : null,
      thru:entry?.thru };
  });
  const championIds = [...championPlayerIds,...(championPlayerId ? [championPlayerId]:[])];
  const winnerEntry=entries.find(e=>e.player?.id && championIds.includes(e.player.id));
  const winner=winnerEntry?.player ? {playerId:winnerEntry.player.id,playerName:winnerEntry.player.full_name ?? '',position:winnerEntry.position ?? null,score:winnerEntry.score} : null;
  const runnerUp=entries.filter(e=>e.player?.id && !championIds.includes(e.player.id) && e.score!=null).sort((a,b)=>Number(a.score)-Number(b.score))[0];

  const showUpcomingFacts = shouldLoadUpcomingFacts(phase);
  const { data: teeTimes = [] } = useTournamentTeeTimes(tournamentId, showUpcomingFacts);
  const { data: lastYear } = useTournamentLastYearTop4(showUpcomingFacts ? tournamentId : null);
  const firstTeeCandidate = teeTimes[0] ?? null;
  const firstTee = firstTeeCandidate?.time && firstTeeCandidate.time !== '\u2014'
    ? firstTeeCandidate
    : null;
  const upcomingFacts = compactUpcomingFacts([
    // DEFENDING removed (BRIEF_TOUR_CHAMPION_TRUTH X.3): THE SITUATION names the
    // defender and the LAST YEAR board carries the score in context.
    firstTee ? { label: t('overview.hero.firstTee'), value: firstTee.time, trailing: null, trailingColor: INK } : null,
    // FIELD (world top-20 count) is omitted: no entries data exists to derive it (Phase 4 §4.3).
  ]);
  const hasUpcomingFacts = showUpcomingFacts && upcomingFacts.length > 0;
  const lastYearRows = showUpcomingFacts ? (lastYear ?? []).slice(0, 4) : [];

  // §4.1 / §4.2 — live and suspended only (both map to phase 'live').
  const inPlay = phase === 'live';
  const leader = useMemo(() => (inPlay ? leaderOf(entries) : null), [inPlay, entries]);
  const neededByPlayer = useMemo(() => {
    const map = new Map<string, number>();
    if (!inPlay || !leader || totalRounds == null || !inRequiredRoundWindow(currentRound, totalRounds)) return map;
    for (const p of picks) {
      if (!p?.playerId) continue;
      const g = neededGross(venuePar, leader.total, boardByPlayer.get(String(p.playerId))?.score ?? null);
      if (g != null) map.set(String(p.playerId), g);
    }
    return map;
  }, [inPlay, leader, picks, venuePar, boardByPlayer, currentRound, totalRounds]);

  /* §C — ROUND N MOVEMENT. The same full-field boardMovementMap the MOV column
     used, so the guard is identical to the old hasMovement: in play, a prior
     round to rank against, at least one non-zero delta. */
  const movementCards = useMemo<MovementCard[]>(() => {
    if (!inPlay || currentRound == null || currentRound < 2 || !fieldHasStarted(entries)) return [];
    const map = boardMovementMap(entries, currentRound);
    const cards: MovementCard[] = [];
    for (const e of entries) {
      const delta = map.get(e.player?.id ?? e.team?.id ?? e.id);
      if (delta == null || delta === 0) continue;
      const name = e.player?.full_name?.trim() || e.team?.display_name?.trim() || '';
      const toPar = todayFromEntry(e, currentRound);
      const complete = e.thru != null && e.thru >= 18;
      cards.push({
        key: e.id,
        name,
        candidates: e.player ? resolvePlayerAvatarCandidates({ name, photoUrl: e.player.photo_url ?? null, tourSlug: pickTourCode }) : [],
        delta,
        toPar,
        gross: complete && toPar != null && typeof venuePar === 'number' && venuePar > 0 ? venuePar + toPar : null,
      });
    }
    return pickMovementCards(cards);
  }, [inPlay, currentRound, entries, venuePar, pickTourCode]);

  /* §E.1 — where the picks stand. A fixed sentence from the board: the
     best-placed pick and its gap to the lead. Absent when no pick is on it. */
  const picksIntro = useMemo(() => {
    if (!inPlay || !leader || leader.total == null || !fieldHasStarted(entries)) return null;
    let best: { name: string; position: number; tied: boolean; score: number } | null = null;
    for (const p of picks) {
      const line = p?.playerId ? boardByPlayer.get(String(p.playerId)) : undefined;
      if (!line || line.position == null || line.score == null) continue;
      if (!best || line.position < best.position) best = { name: surnameOf(p.playerName), position: line.position, tied: line.tied, score: line.score };
    }
    if (!best) return null;
    const pos = `${best.tied ? 'T' : ''}${best.position}`;
    if (best.position === 1 && !best.tied) return t('overview.picksIntro.leads', { name: best.name });
    const gap = best.score - leader.total;
    if (gap <= 0) return t('overview.picksIntro.level', { name: best.name, pos });
    return t('overview.picksIntro.behind', { name: best.name, pos, count: gap });
  }, [inPlay, leader, picks, boardByPlayer, entries, t]);


  return (
    <div style={{ background: PAGE_CANVAS, fontFamily: FONT }}>
      {!picksOnly && movementCards.length > 0 && currentRound != null ? (
        <RoundMovementBand round={currentRound} cards={movementCards} />
      ) : null}

      {!picksOnly && hasBoard ? (
        <MiniBoard
          tourSlug={pickTourCode}
          totalRounds={totalRounds}
          tournamentId={tournamentId}
          entries={entries}
          limit={5}
          currentRound={currentRound}
          theme="heroBoard"
          phase={phase === 'completed' ? 'completed' : 'live'}
          pickPlayerIds={pickPlayerIds}
          onRowTap={onRowTap}
        />
      ) : null}

      {!picksOnly && hasUpcomingFacts ? (
        <div data-overview-facts style={{ display: 'flex', gap: 16, padding: '10px 20px' }}>
          {upcomingFacts.map((fact) => (
            <div key={fact.label} style={{ flex: '1 1 0', minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: WHITE_ALPHA_65 }}>{fact.label}</div>
              <div style={{ marginTop: 3, display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 17, fontWeight: 800, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...FIGS }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fact.value}</span>
                {fact.trailing ? <span style={{ color: fact.trailingColor }}>{fact.trailing}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!picksOnly && lastYearRows.length > 0 ? (
        <div data-overview-last-year style={{ paddingTop: 12 }}>
          <div data-overview-board-header style={{ display: 'flex', alignItems: 'center', minHeight: 24, padding: '2px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: OVERVIEW.mute }}>
            {t('overview.hero.lastYear')}
            {lastYearRows.every(row => row.year === lastYearRows[0].year) ? ` · ${lastYearRows[0].year}` : null}
          </div>
          {lastYearRows.map((row, i) => (
            <LastYearRow
              key={`${row.rank}-${row.name}`}
              rank={row.rank}
              name={row.name}
              score={row.score}
              isWinner={row.rank === '1'}
              avatarCandidates={resolvePlayerAvatarCandidates({ name: row.name, photoUrl: row.photoUrl ?? null, tourSlug: pickTourCode })}
              isLast={i === lastYearRows.length - 1}
            />
          ))}
        </div>
      ) : null}

      {hasPicks ? (
        <PicksBlock
          picks={picks}
          tourCode={pickTourCode}
          tournamentId={picksTid}
          seasonYear={eventSeasonYear ?? null}
          currentRound={currentRound}
          pickResults={pickResults.filter(r=>picks.some(p=>p.playerId===r.playerId))}
          onOpenYourPick={(view='field')=>{setYourPickView(view);setYourPickOpen(true);}}
          onOpenRecord={()=>setRecordOpen(true)}
          phase={phase}
          boardByPlayer={boardByPlayer}
          teeByPlayer={phase === 'completed' ? null : pickTees ?? null}
          startedPlayers={startedPlayers}
          championPlayerId={championPlayerId}
          championPlayerIds={championPlayerIds}
          intro={picksIntro}
          onOpenPick={(id) => { setTappedPick(id); setPicksOpen(true); }}
        />
      ) : null}
      {!picksOnly && <LeadersGroup tournamentId={tournamentId} entries={entries} currentRound={currentRound} totalRounds={totalRounds}
        phase={phase} leaderboardLoading={leaderboardLoading} eventType={eventType} tourSlug={pickTourCode} onRowTap={onRowTap} />}
      {hasPicks ? (
        <PicksSheet
          open={picksOpen}
          onClose={() => setPicksOpen(false)}
          picks={picks}
          predictions={predictions ?? null}
          eventName={eventName ?? predictions?.tournament?.name ?? ''}
          venueName={predictions?.tournament?.venueName || null}
          neededByPlayer={neededByPlayer}
          tournamentId={picksTid}
          tourCode={pickTourCode}
          phase={phase}
          currentRound={currentRound}
          initialPlayerId={tappedPick}
          results={pickResults}
          championIds={championIds}
          winner={winner}
          winningMargin={winner?.score!=null && runnerUp?.score!=null ? runnerUp.score-winner.score : null}
        />
      ) : null}
      <YourPickSheet open={yourPickOpen} onClose={()=>setYourPickOpen(false)} tournamentId={picksTid} eventName={eventName ?? predictions?.tournament?.name ?? ''} ourPicks={picks.map(p=>({playerId:p.playerId,playerName:p.playerName}))} tourCode={pickTourCode} initialView={yourPickView}/>
      {eventSeasonYear != null && <OurRecordSheet open={recordOpen} onClose={()=>setRecordOpen(false)} tour={pickTourCode} year={eventSeasonYear}/>}

    </div>
  );
}

export {pickTeeText,pickTeeDayLabel,teeHeadingFits,pickStatusToken} from './PicksBlock';
/**
 * §C — ROUND N MOVEMENT. Three cards at most, never padded. Ben's ruling
 * (7 Nov 2026): only the arrow carries direction colour — live green up,
 * darker warning red down, never the under-par red. Places remain white;
 * to-par retains its independent score colour law.
 */
export function RoundMovementBand({ round, cards }: { round: number; cards: MovementCard[] }) {
  const { t } = useTranslation('tourhub');
  return (
    <div data-overview-movement style={{ padding: '12px 20px', borderTop: `1px solid ${OVERVIEW.hairline}` }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: OVERVIEW.mute }}>
        {t('overview.biggestMovers', { round })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {cards.map((c) => (
          <div key={c.key} data-overview-movement-card style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, boxSizing: 'border-box', flex: 1, minWidth: 0, background: 'transparent', border: `1px solid ${WHITE_ALPHA_12}`, borderRadius: 12, padding: 7 }}>
            <SquircleAvatar size={28} srcCandidates={c.candidates} alt={c.name} userId={c.key} hideRing />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2, color: 'var(--tour-mover-name)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{surnameOf(c.name)}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 1, lineHeight: 1.2, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden', ...FIGS }}>
              <span data-movement-dir={c.delta > 0 ? 'up' : 'down'} style={{ flex: 'none', color: c.delta > 0 ? LIVE_INK : STATUS_NEGATIVE }}>
                {c.delta > 0 ? '\u25B2' : '\u25BC'}
              </span>
              <span data-movement-places style={{ flex: 'none', color: OVERVIEW.ink }}>{Math.abs(c.delta)}</span>
              {c.toPar != null ? (
                /* Gross was dropped so the figure fits on one line at chip width;
                   bare to-par keeps its independent score colour law. */
                <span data-movement-score style={{ fontSize: 10.5, fontWeight: 600, flex: '0 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...FIGS }}>
                  <span data-movement-topar style={{ color: getScoreColor(c.toPar, 'dark') }}>{fmtScore(c.toPar)}</span>
                </span>
              ) : null}
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeroBoardSection;
