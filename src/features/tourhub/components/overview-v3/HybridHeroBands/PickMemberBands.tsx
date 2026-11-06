/** Opt-in event-scoped additions keep the existing three card engine separate
 * from member/session reads; the real overview supplies the event season. */
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useTournamentCircleRank } from '../../../hooks/useTournamentCircleRank';
import { useGuestTournamentPickLock, useTournamentPickState, useTournamentPicksBoard } from '../../../hooks/useTournamentPick';
import { groupTournamentPicks } from './picksBoardRules';
import { surnameOf } from '../../../_shared/playerName';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePickTeeTimes } from '../../../tournament-v2/data/usePickTeeTimes';
import { YourPickCard } from './YourPickCard';
import { type PickResult } from './pickInsightRules';
import { getGuestUser } from '@/features/guest/guestGateStore';
import { useGuestActionGate } from '@/features/guest/useGuestActionGate';
export function PickMemberBands({ tournamentId, tourCode, seasonYear, phase, currentRound, pickResults, startedPlayers, onPick }: {
  tournamentId:string; tourCode:string; seasonYear:number; phase:'upcoming'|'live'|'completed'; currentRound:number|null;
  pickResults:PickResult[]; startedPlayers:Set<string>; onPick:(view?:'field'|'board')=>void;
}) {
  const {t}=useTranslation('tourhub');
  const {user}=useSupabaseSession();
  const guest=!user || user.is_anonymous || Boolean(getGuestUser());
  const guestLock=useGuestTournamentPickLock(tournamentId);
  const boardQuery=useTournamentPicksBoard(tournamentId);
  const boardRows=boardQuery.isError?[]:boardQuery.data??[];
  const mostPicked=groupTournamentPicks(boardRows)[0];
  const stateQuery=useTournamentPickState(tournamentId);
  const state=guest ? guestLock.data && !guestLock.isError ? {...guestLock.data,my_player_id:null,followed_pickers:0,followed_top:[]} : null : stateQuery.isError ? null : stateQuery.data ?? null;
  const circleQuery=useTournamentCircleRank(tournamentId,phase==='live');
  const circleRank=circleQuery.isError ? null : circleQuery.data ?? null;
  const gate=useGuestActionGate();
  const openMine=()=>{if(gate('pick')) return; onPick();};
  const mineTees=usePickTeeTimes(tournamentId,phase==='upcoming'?1:currentRound??1,state?.my_player_id?[state.my_player_id]:[],{enabled:Boolean(state?.my_player_id && phase!=='completed')});
  return <>
    {!guestLock.isError && <YourPickCard state={state} circleRank={circleRank} phase={phase} ourResults={pickResults} tourCode={tourCode} onPick={openMine} onSeePicks={view=>onPick(view)} boardRows={boardRows} guest={guest} teeTime={state?.my_player_id ? mineTees.data?.get(state.my_player_id) : null} started={state?.my_player_id ? startedPlayers.has(state.my_player_id):false}/>}
    {state?.locked && !state.my_player_id && mostPicked && <Button variant={null} size={null} className="pick-record-door" data-members-picks-door onClick={()=>onPick('board')}><span>{t('overview.yourPick.membersPicks')}</span><span>{t('overview.yourPick.membersSummary',{count:boardRows.length,name:surnameOf(mostPicked.playerName)})}<small> ›</small></span></Button>}
  </>;
}