/** Opt-in event-scoped additions keep the existing three card engine separate
 * from member/session reads; the real overview supplies the event season. */
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '../../PlayerAvatar';
import { useTournamentPickState } from '../../../hooks/useTournamentPick';
import { useOurPickRecord } from '../../../hooks/usePickInsights';
import { usePickTeeTimes } from '../../../tournament-v2/data/usePickTeeTimes';
import { YourPickCard } from './YourPickCard';
import { surnameOf } from '../../../_shared/playerName';
import { resultPosition, type PickResult } from './pickInsightRules';
import { getGuestUser } from '@/features/guest/guestGateStore';
import { useGuestActionGate } from '@/features/guest/useGuestActionGate';
export function PickMemberBands({ tournamentId, tourCode, seasonYear, phase, currentRound, pickResults, startedPlayers, onPick, onRecord }: {
  tournamentId:string; tourCode:string; seasonYear:number; phase:'upcoming'|'live'|'completed'; currentRound:number|null;
  pickResults:PickResult[]; startedPlayers:Set<string>; onPick:()=>void; onRecord:()=>void;
}) {
  const {t}=useTranslation('tourhub');
  const stateQuery=useTournamentPickState(tournamentId);
  const state=stateQuery.isError ? null : stateQuery.data ?? null;
  const recordQuery=useOurPickRecord(tourCode,seasonYear);
  const record=recordQuery.isError ? null : recordQuery.data;
  const gate=useGuestActionGate();
  const openMine=()=>{if(gate('pick')) return; onPick();};
  const mineTees=usePickTeeTimes(tournamentId,phase==='upcoming'?1:currentRound??1,state?.my_player_id?[state.my_player_id]:[],{enabled:Boolean(state?.my_player_id && phase!=='completed')});
  const copy=(key:string,options:Record<string,unknown>={})=>t(`overview.pickRecord.${key}`,options);
  return <>
    <YourPickCard state={state} phase={phase} ourResults={pickResults} tourCode={tourCode} onPick={openMine} guest={Boolean(getGuestUser())} teeTime={state?.my_player_id ? mineTees.data?.get(state.my_player_id) : null} started={state?.my_player_id ? startedPlayers.has(state.my_player_id):false}/>
    {phase!=='completed' && state && (phase==='upcoming' ? state.followed_pickers>=1 : Boolean(state.followed_best)) && <div className="pick-follow-line" data-followed-picks><span className="pick-follow-stack">{state.followed_top.slice(0,3).map(top=><span key={top.player_id}><PlayerAvatar playerId={top.player_id} playerName={top.player_name} tourCode={tourCode} size={18}/></span>)}</span><span>{phase==='upcoming'?copy('followed',{count:state.followed_pickers,name:surnameOf(state.followed_top[0]?.player_name ?? '')}):state.followed_best ? copy('bestFollowed',{name:surnameOf(state.followed_best.player_name),position:resultPosition({playerId:state.followed_best.player_id??'',playerName:state.followed_best.player_name,position:state.followed_best.position,tied:state.followed_best.tied})}):''}</span></div>}
    {record && record.picks>0 && <Button variant="ghost" className="pick-record-door" data-our-record-door onClick={onRecord}><span>{copy('kicker')}</span><span>{copy('wins',{count:record.won})} · {copy('topTens',{count:record.top10})} <small>{copy('from',{count:record.picks})}</small></span></Button>}
  </>;
}