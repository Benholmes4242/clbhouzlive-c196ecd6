/** Full boards share follow/pick display and parent-owned scorecard taps.
 * No board hole read: ScorecardSheet alone fetches the selected player.
 * `boardHead` (Leaderboards page only) replaces the default LEADERBOARD
 * kicker with the page's section head; FullBoardSheet keeps the default. */
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { BoardTable, type BoardEntry, type CutState } from './BoardTable';
import { useTourPlayerFollows } from './useTourPlayerFollows';
import { useAIPredictions } from '../hooks/useAIPredictions';

export function LiveBoard({entries, fullEntries = entries, tournamentId, currentRound, complete = false, cutState, onFull, headerTop = 0, teeTimes, tourSlug, enabled = true, boardHead}: {
  entries:BoardEntry[]; fullEntries?:BoardEntry[]; tournamentId:string; currentRound:number | null; complete?:boolean; cutState:CutState;
  onFull:(entry:BoardEntry)=>void; headerTop?:string | number; teeTimes?:Record<string,string>; tourSlug?:string | null; enabled?:boolean;
  boardHead?:ReactNode;
}) {
  const {t} = useTranslation('tourhub');
  const follows = useTourPlayerFollows(enabled);
  const {data:predictions} = useAIPredictions(enabled ? tournamentId : null);
  const pickIds = new Set((predictions?.topContenders ?? []).map(p => p.playerId));
  const mine = fullEntries.filter(e => e.player?.id && follows.ids.has(e.player.id)).sort((a,b)=>(a.position ?? Infinity)-(b.position ?? Infinity));
  const shared = { currentRound, complete, followedIds:follows.ids, pickPlayerIds:pickIds,
    tourSlug,
    onRowClick:onFull, movementEntries:fullEntries, teeTimes, surface:'var(--tour-board-canvas)' };
  return <div className="tour-board-shell">
    {mine.length > 0 && <section aria-label={t('rebuilt.yourPlayers')}><div className="tour-board-kicker"><span>{t('rebuilt.yourPlayers')}</span><small>{t('rebuilt.followed',{count:mine.length})}</small></div><BoardTable {...shared} entries={mine} showHeader={false} yourPlayers cutState={{kind:'none',cutline:null,extraCount:0}} /></section>}
    {boardHead ?? <div className="tour-board-kicker"><span>{t('rebuilt.leaderboard')}</span>{(currentRound ?? 0)>1 && <small>{t('rebuilt.placesSince',{round:(currentRound ?? 1)-1})}</small>}</div>}
    <BoardTable {...shared} entries={entries} cutState={cutState} headerTop={headerTop} />
  </div>;
}