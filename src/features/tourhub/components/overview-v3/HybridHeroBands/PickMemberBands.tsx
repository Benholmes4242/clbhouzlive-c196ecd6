/** Opt-in event-scoped additions keep the existing three card engine separate
 * from member/session reads; the real overview supplies the event season. */
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useTournamentCircleRank } from '../../../hooks/useTournamentCircleRank';
import { useGuestTournamentPickLock, useTournamentPickState } from '../../../hooks/useTournamentPick';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOurPickRecord } from '../../../hooks/usePickInsights';
import { usePickTeeTimes } from '../../../tournament-v2/data/usePickTeeTimes';
import { YourPickCard } from './YourPickCard';
import { type PickResult } from './pickInsightRules';
import { getGuestUser } from '@/features/guest/guestGateStore';
import { useGuestActionGate } from '@/features/guest/useGuestActionGate';
export function PickMemberBands({ tournamentId, tourCode, seasonYear, phase, currentRound, pickResults, startedPlayers, onPick, onRecord }: {
  tournamentId:string; tourCode:string; seasonYear:number; phase:'upcoming'|'live'|'completed'; currentRound:number|null;
  pickResults:PickResult[]; startedPlayers:Set<string>; onPick:()=>void; onRecord:()=>void;
}) {
  const {t}=useTranslation('tourhub');
  const {user}=useSupabaseSession();
  const guest=!user || user.is_anonymous || Boolean(getGuestUser());
  const guestLock=useGuestTournamentPickLock(tournamentId,phase==='upcoming');
  const stateQuery=useTournamentPickState(tournamentId);
  const state=guest ? guestLock.data && !guestLock.isError ? {...guestLock.data,my_player_id:null,followed_pickers:0,followed_top:[]} : null : stateQuery.isError ? null : stateQuery.data ?? null;
  const circleQuery=useTournamentCircleRank(tournamentId,phase==='live');
  const circleRank=circleQuery.isError ? null : circleQuery.data ?? null;
  const recordQuery=useOurPickRecord(tourCode,seasonYear);
  const record=recordQuery.isError ? null : recordQuery.data;
  const gate=useGuestActionGate();
  const openMine=()=>{if(gate('pick')) return; onPick();};
  const mineTees=usePickTeeTimes(tournamentId,phase==='upcoming'?1:currentRound??1,state?.my_player_id?[state.my_player_id]:[],{enabled:Boolean(state?.my_player_id && phase!=='completed')});
  const copy=(key:string,options:Record<string,unknown>={})=>t(`overview.pickRecord.${key}`,options);
  return <>
    {!guestLock.isError && <YourPickCard state={state} circleRank={circleRank} phase={phase} ourResults={pickResults} tourCode={tourCode} onPick={openMine} guest={guest} teeTime={state?.my_player_id ? mineTees.data?.get(state.my_player_id) : null} started={state?.my_player_id ? startedPlayers.has(state.my_player_id):false}/>}
    {record && record.picks>0 && <Button variant={null} size={null} className="pick-record-door" data-our-record-door onClick={onRecord}><span>{copy('kicker')}</span><span>{copy('wins',{count:record.won})} · {copy('topTens',{count:record.top10})} <small>{copy('from',{count:record.picks})}</small></span></Button>}
  </>;
}