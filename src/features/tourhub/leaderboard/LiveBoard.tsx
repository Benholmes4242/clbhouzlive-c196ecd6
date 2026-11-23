import { picksEnabledForTour } from '../_shared/picksEnabledForTour';
/** Full boards share follow/pick display and parent-owned scorecard taps.
 * No board hole read: ScorecardSheet alone fetches the selected player.
 * `boardHead` (Leaderboards page only) replaces the default LEADERBOARD
 * kicker with the page's section head; FullBoardSheet keeps the default.
 * `headerLead` (Leaderboards page, Option B) puts the LEADERBOARD title and
 * search button in the sticky column-header row; `aboveHeader` (the page's
 * search field) takes the kicker's slot and the legend becomes a page caption. */
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { BoardTable, boardHasMovementMark, type BoardEntry, type CutState } from './BoardTable';
import { useTourPlayerFollows } from './useTourPlayerFollows';
import { useAIPredictions } from '../hooks/useAIPredictions';

export function LiveBoard({entries, fullEntries = entries, tournamentId, currentRound, complete = false, cutState, onFull, headerTop = 0, teeTimes, tourSlug, enabled = true, boardHead, headerLead, aboveHeader, expandedId = null, renderExpanded, dockBlur = false, onDockChange}: {
  entries:BoardEntry[]; fullEntries?:BoardEntry[]; tournamentId:string; currentRound:number | null; complete?:boolean; cutState:CutState;
  onFull:(entry:BoardEntry)=>void; headerTop?:string | number; teeTimes?:Record<string,string>; tourSlug?:string | null; enabled?:boolean;
  boardHead?:ReactNode;
  headerLead?:ReactNode; aboveHeader?:ReactNode;
  dockBlur?:boolean; onDockChange?:(stuck:boolean, height:number)=>void;
  /** FullBoardSheet inline expand — forwarded to BoardTable untouched. */
  expandedId?:string | null; renderExpanded?:(entry:BoardEntry)=>ReactNode;
}) {
  const {t} = useTranslation('tourhub');
  const follows = useTourPlayerFollows(enabled);
  const {data:predictions} = useAIPredictions(enabled && picksEnabledForTour(tourSlug) ? tournamentId : null);
  const pickIds = new Set((picksEnabledForTour(tourSlug) ? predictions?.topContenders ?? [] : []).map(p => p.playerId));
  const mine = fullEntries.filter(e => e.player?.id && follows.ids.has(e.player.id)).sort((a,b)=>(a.position ?? Infinity)-(b.position ?? Infinity));
  const shared = { currentRound, complete, followedIds:follows.ids, pickPlayerIds:pickIds,
    tourSlug,
    onRowClick:onFull, movementEntries:fullEntries, teeTimes, surface:'var(--tour-board-canvas)', expandedId, renderExpanded };
  return <div className="tour-board-shell">
    {mine.length > 0 && <section aria-label={t('rebuilt.yourPlayers')}><div className="tour-board-kicker"><span>{t('rebuilt.yourPlayers')}</span><small>{t('rebuilt.followed',{count:mine.length})}</small></div><BoardTable {...shared} entries={mine} showHeader={false} yourPlayers cutState={{kind:'none',cutline:null,extraCount:0}} /></section>}
    {headerLead ? aboveHeader ?? null : boardHead ?? <div className="tour-board-kicker tour-board-kicker--field"><span>{t('rebuilt.leaderboard')}</span></div>}
    <BoardTable {...shared} entries={entries} cutState={cutState} headerTop={headerTop} dockBlur={dockBlur} onDockChange={onDockChange} headerLead={headerLead} headerMarginTop={headerLead ? (aboveHeader ? 10 : 16) : undefined} />
    {/* Full board sheet: the places-since legend leaves the heading line and
        reads as one caption line under the board. The Leaderboards page keeps
        its own legend in the section head (rule b). */}
    {headerLead && (currentRound ?? 0) > 1 && boardHasMovementMark(fullEntries, currentRound) && <div className="tour-board-legend-caption tour-board-legend-caption--page">{t('rebuilt.placesSince', { round: (currentRound ?? 1) - 1 })}</div>}
    {!boardHead && !headerLead && (currentRound ?? 0) > 1 && <div className="tour-board-legend-caption">{t('rebuilt.placesSince', { round: (currentRound ?? 1) - 1 })}</div>}
  </div>;
}
