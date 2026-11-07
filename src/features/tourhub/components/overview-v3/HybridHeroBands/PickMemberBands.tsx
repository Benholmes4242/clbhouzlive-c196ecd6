/** Opt-in event-scoped additions keep the existing three card engine separate
 * from member/session reads; the real overview supplies the event season.
 * The members strip reads only public picks plus the caller's board snapshot;
 * it never fetches player scores or substitutes prediction results. */
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useTournamentCircleRank } from '../../../hooks/useTournamentCircleRank';
import { useGuestTournamentPickLock, useTournamentPickState, useTournamentPicksBoard } from '../../../hooks/useTournamentPick';
import { groupTournamentPicks, pickMemberName } from './picksBoardRules';
import { surnameOf } from '../../../_shared/playerName';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePickTeeTimes } from '../../../tournament-v2/data/usePickTeeTimes';
import { YourPickCard } from './YourPickCard';
import { type PickResult } from './pickInsightRules';
import { getGuestUser } from '@/features/guest/guestGateStore';
import { useGuestActionGate } from '@/features/guest/useGuestActionGate';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../../../_shared/resolvePlayerAvatar';
import { getScoreColor } from '../../../_shared/scoreColor';
import { fmtScore } from '../../../utils/fmtScore';
import { ChevronRight } from 'lucide-react';
export function PickMemberBands({ tournamentId, tourCode, seasonYear, phase, currentRound, pickResults, startedPlayers, onPick, boardByPlayer }: {
  tournamentId:string; tourCode:string; seasonYear:number; phase:'upcoming'|'live'|'completed'; currentRound:number|null;
  pickResults:PickResult[]; startedPlayers:Set<string>; onPick:(view?:'field'|'board')=>void;
  boardByPlayer?: Map<string, { position: number | null; tied: boolean; score: number | null }>;
}) {
  const {t}=useTranslation('tourhub');
  const {user}=useSupabaseSession();
  const guest=!user || user.is_anonymous || Boolean(getGuestUser());
  const guestLock=useGuestTournamentPickLock(tournamentId);
  const boardQuery=useTournamentPicksBoard(tournamentId);
  const boardRows=boardQuery.isError?[]:boardQuery.data??[];
  const groups=groupTournamentPicks(boardRows);
  const mostPicked=groups[0];
  const jointMostPicked=Boolean(mostPicked && groups[1]?.members.length===mostPicked.members.length);
  const boardLine=mostPicked ? boardByPlayer?.get(mostPicked.playerId) : undefined;
  const stateQuery=useTournamentPickState(tournamentId);
  const state=guest ? guestLock.data && !guestLock.isError ? {...guestLock.data,my_player_id:null,followed_pickers:0,followed_top:[]} : null : stateQuery.isError ? null : stateQuery.data ?? null;
  const circleQuery=useTournamentCircleRank(tournamentId,phase==='live');
  const circleRank=circleQuery.isError ? null : circleQuery.data ?? null;
  const gate=useGuestActionGate();
  const openMine=()=>{if(gate('pick')) return; onPick();};
  const mineTees=usePickTeeTimes(tournamentId,phase==='upcoming'?1:currentRound??1,state?.my_player_id?[state.my_player_id]:[],{enabled:Boolean(state?.my_player_id && phase!=='completed')});
  return <>
    {!guestLock.isError && <YourPickCard state={state} circleRank={circleRank} phase={phase} ourResults={pickResults} tourCode={tourCode} onPick={openMine} onSeePicks={view=>onPick(view)} boardRows={boardRows} guest={guest} teeTime={state?.my_player_id ? mineTees.data?.get(state.my_player_id) : null} started={state?.my_player_id ? startedPlayers.has(state.my_player_id):false}/>}
    {state?.locked && !state.my_player_id && mostPicked && <div data-members-picks-strip style={{margin:'14px 20px 0',paddingTop:14,borderTop:'1px solid var(--pick-hair)',minWidth:0}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
        <span style={{fontSize:11,fontWeight:800,letterSpacing:'0.16em',color:'var(--pick-ink)'}}>{t('overview.yourPick.membersPicks')}</span>
        <div style={{display:'flex',flex:'none'}}>{boardRows.slice(0,3).map((member,index)=><span key={member.user_id} data-members-picks-face style={{display:'inline-flex',borderRadius:'34%',boxShadow:'var(--pick-strip-face-ring)',marginLeft:index>0?-7:0}}><SquircleAvatar size={22} src={member.profile_photo_url} alt={pickMemberName(member)} userId={member.user_id} hideRing/></span>)}</div>
      </div>
      <Button variant={null} size={null} data-members-picks-tile onClick={()=>onPick('board')} style={{marginTop:10,display:'flex',width:'100%',height:'auto',alignItems:'center',gap:10,outline:'1px solid var(--pick-rule)',border:0,borderRadius:12,padding:'10px 12px',background:'transparent',color:'var(--pick-ink)',textAlign:'left',whiteSpace:'normal'}}>
        <SquircleAvatar size={32} srcCandidates={resolvePlayerAvatarCandidates({name:mostPicked.playerName,photoUrl:null,tourSlug:tourCode})} alt="" hideRing/>
        <span style={{flex:1,minWidth:0}}>
          <span data-members-picks-name style={{display:'block',fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{surnameOf(mostPicked.playerName)}{boardLine ? <> {boardLine.position!=null && <span>{boardLine.tied?'T':''}{boardLine.position}</span>}{boardLine.score!=null && <> <span style={{color:getScoreColor(boardLine.score,'dark')}}>{fmtScore(boardLine.score)}</span></>}</> : null}</span>
          <span style={{display:'block',marginTop:2,fontSize:11.5,fontWeight:400,color:'var(--pick-dim)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t(`overview.yourPick.${jointMostPicked?'jointMostPicked':'mostPicked'}`)} · {t('overview.yourPick.memberCount',{picked:mostPicked.members.length,count:boardRows.length})}</span>
        </span>
        <ChevronRight size={16} color="var(--pick-dim)" style={{flex:'none'}} aria-hidden/>
      </Button>
      <div style={{marginTop:10,display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10,fontSize:12}}>
        <span style={{color:'var(--pick-strip-locked)',minWidth:0}}>{t('overview.yourPick.weekLocked')}</span>
        <Button variant={null} size={null} onClick={()=>onPick('board')} style={{flex:'none',height:'auto',padding:0,border:0,background:'transparent',fontSize:12,fontWeight:700,color:'var(--pick-ink)'}}>{t('overview.yourPick.seeEveryPick')}</Button>
      </div>
    </div>}
  </>;
}