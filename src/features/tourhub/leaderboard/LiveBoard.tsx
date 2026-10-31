/** Both full-board doors share hole/follow/expand ownership here. No per-row
 * reads; query updates reuse the existing leaderboard lifecycle. Hero excluded. */
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { BoardTable, computeBoardColumns, type BoardEntry, type CutState } from './BoardTable';
import { useBoardHoles } from './useBoardHoles';
import { useTourPlayerFollows } from './useTourPlayerFollows';
import { useAIPredictions } from '../hooks/useAIPredictions';

export function LiveBoard({entries, fullEntries = entries, tournamentId, currentRound, complete = false, cutState, onFull, headerTop = 0, teeTimes, tourSlug, enabled = true}: {
  entries:BoardEntry[]; fullEntries?:BoardEntry[]; tournamentId:string; currentRound:number | null; complete?:boolean; cutState:CutState;
  onFull:(entry:BoardEntry)=>void; headerTop?:string | number; teeTimes?:Record<string,string>; tourSlug?:string | null; enabled?:boolean;
}) {
  const {t} = useTranslation('tourhub');
  const client = useQueryClient();
  const columns = computeBoardColumns(fullEntries,currentRound,complete);
  const round = columns.liveRound ?? Math.max(1,...fullEntries.map(e => [e.round_1,e.round_2,e.round_3,e.round_4].reduce<number>((latest,value,i) => value != null ? i+1 : latest,0)));
  const updatedAt = client.getQueryState(['tourhub','leaderboard',tournamentId])?.dataUpdatedAt ?? 0;
  const holes = useBoardHoles(tournamentId,round,updatedAt,enabled);
  const follows = useTourPlayerFollows(enabled);
  const {data:predictions} = useAIPredictions(enabled ? tournamentId : null);
  const pickIds = new Set((predictions?.topContenders ?? []).map(p => p.playerId));
  const mine = fullEntries.filter(e => e.player?.id && follows.ids.has(e.player.id)).sort((a,b)=>(a.position ?? Infinity)-(b.position ?? Infinity));
  const shared = { currentRound, complete, holesByPlayer:holes.byPlayer, followedIds:follows.ids, pickPlayerIds:pickIds,
    inlineRound:round, onFollow:follows.toggle, followBusy:follows.busy, followError:!!follows.error, tourSlug,
    onRowClick:onFull, movementEntries:fullEntries, teeTimes, surface:'var(--tour-board-canvas)' };
  return <div className="tour-board-shell">
    {mine.length > 0 && <section aria-label={t('rebuilt.yourPlayers')}><div className="tour-board-kicker"><span>{t('rebuilt.yourPlayers')}</span><small>{t('rebuilt.followed',{count:mine.length})}</small></div><BoardTable {...shared} entries={mine} showHeader={false} yourPlayers cutState={{kind:'none',cutline:null,extraCount:0}} /></section>}
    <div className="tour-board-kicker"><span>{t('rebuilt.leaderboard')}</span>{(currentRound ?? 0)>1 && <small>{t('rebuilt.placesSince',{round:(currentRound ?? 1)-1})}</small>}</div>
    <BoardTable {...shared} entries={entries} cutState={cutState} headerTop={headerTop} />
  </div>;
}