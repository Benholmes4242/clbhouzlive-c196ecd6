/** Full boards share follow/pick display and parent-owned scorecard taps.
 * No board hole read: ScorecardSheet alone fetches the selected player.
 * `boardHead` (Leaderboards page only) replaces the default LEADERBOARD
 * kicker with the page's section head; FullBoardSheet keeps the default. */
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { BoardTable, type BoardEntry, type CutState } from './BoardTable';
import { useTourPlayerFollows } from './useTourPlayerFollows';
import { useAIPredictions } from '../hooks/useAIPredictions';

export function LiveBoard({entries, fullEntries = entries, tournamentId, currentRound, complete = false, cutState, onFull, headerTop = 0, teeTimes, tourSlug, enabled = true, boardHead, expandedId = null, renderExpanded, dockBlur = false, onDockChange}: {
  entries:BoardEntry[]; fullEntries?:BoardEntry[]; tournamentId:string; currentRound:number | null; complete?:boolean; cutState:CutState;
  onFull:(entry:BoardEntry)=>void; headerTop?:string | number; teeTimes?:Record<string,string>; tourSlug?:string | null; enabled?:boolean;
  boardHead?:ReactNode;
  dockBlur?:boolean; onDockChange?:(stuck:boolean, height:number)=>void;
  /** FullBoardSheet inline expand — forwarded to BoardTable untouched. */
  expandedId?:string | null; renderExpanded?:(entry:BoardEntry)=>ReactNode;
}) {
  const {t} = useTranslation('tourhub');
  const follows = useTourPlayerFollows(enabled);
  const {data:predictions} = useAIPredictions(enabled ? tournamentId : null);
  const pickIds = new Set((predictions?.topContenders ?? []).map(p => p.playerId));
  const mine = fullEntries.filter(e => e.player?.id && follows.ids.has(e.player.id)).sort((a,b)=>(a.position ?? Infinity)-(b.position ?? Infinity));
  const shared = { currentRound, complete, followedIds:follows.ids, pickPlayerIds:pickIds,
    tourSlug,
    onRowClick:onFull, movementEntries:fullEntries, teeTimes, surface:'var(--tour-board-canvas)', expandedId, renderExpanded };
  return <div className="tour-board-shell">
    {mine.length > 0 && <section aria-label={t('rebuilt.yourPlayers')}><div className="tour-board-kicker"><span>{t('rebuilt.yourPlayers')}</span><small>{t('rebuilt.followed',{count:mine.length})}</small></div><BoardTable {...shared} entries={mine} showHeader={false} yourPlayers cutState={{kind:'none',cutline:null,extraCount:0}} /></section>}
    {boardHead ?? <div className="tour-board-kicker"><span>{t('rebuilt.leaderboard')}</span></div>}
    <BoardTable {...shared} entries={entries} cutState={cutState} headerTop={headerTop} dockBlur={dockBlur} onDockChange={onDockChange} />
    {/* Full board sheet: the places-since legend leaves the heading line and
        reads as one caption line under the board. The Leaderboards page keeps
        its own legend in the section head (rule b). */}
    {!boardHead && (currentRound ?? 0) > 1 && <div className="tour-board-legend-caption">{t('rebuilt.placesSince', { round: (currentRound ?? 1) - 1 })}</div>}
  </div>;
}
