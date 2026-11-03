/** Build 2: name tabs open on the tapped pick; model ranks are visible, never
 * win probabilities or course-fit scores. Bars come only from our fit RPC;
 * numerical reasons are filtered by the shared pure verification rule. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '../../PlayerAvatar';
import type { AIPredictionData, AITopContender } from '../../../hooks/useAIPredictions';
import { usePickFit, useEventWinningScores } from '../../../hooks/usePickInsights';
import { usePickField } from '../../../hooks/useTournamentPick';
import { surnameOf } from '../../../_shared/playerName';
import { fmtScore } from '../../../utils/fmtScore';
import { finishedVerdict, chooseFitStats, formatFitValue, ordinal, statLabel, filterCheckedReasons, lowestFit, catchSentence, modelVoteNote, pronouns, winningScoreRange, resultPosition, outStatus, joinNames, wordNumber, type FitKey, type PickResult } from './pickInsightRules';
import './pickPanels.css';
export interface PicksSheetProps {
 open:boolean; onClose:()=>void; picks:AITopContender[]; predictions:AIPredictionData|null; eventName:string; venueName:string|null;
 neededByPlayer?:Map<string,number>; tournamentId?:string; tourCode?:string; phase?:'upcoming'|'live'|'completed'; currentRound?:number|null;
 initialPlayerId?:string|null; results?:PickResult[]; championIds?:string[]; winner?:PickResult|null; winningMargin?:number|null;
}
export function PicksSheet(props:PicksSheetProps) { return props.open ? <PickDocument key={props.initialPlayerId ?? 'first'} {...props}/> : null; }
function PickDocument({onClose,picks,predictions,eventName,venueName,tournamentId='',tourCode='pga',phase='upcoming',currentRound,initialPlayerId,results=[],championIds=[],winner,winningMargin}:PicksSheetProps) {
 const {t}=useTranslation('tourhub');
 const copy=(key:string,options:Record<string,unknown>={})=>t(`overview.picksSheet.${key}`,options);
 const [selected,setSelected]=useState(initialPlayerId ?? picks[0]?.playerId);
 const pick=picks.find(p=>p.playerId===selected) ?? picks[0];
 const dark=predictions?.darkHorses ?? [];
 const allIds=[...picks,...dark].map(p=>p.playerId);
 const fitQuery=usePickFit(tournamentId,allIds);
 const scoresQuery=useEventWinningScores(tournamentId);
 const fieldQuery=usePickField(tournamentId);
 const fit=fitQuery.isError ? [] : fitQuery.data ?? [];
 const stats=fit.filter(s=>s.player_id===pick?.playerId);
 const chosenStats=chooseFitStats(predictions?.courseAnalysis?.keyStats ?? []);
 const lowest=lowestFit(stats);
 const reasons=filterCheckedReasons(pick?.reasons ?? [],stats);
 const result=results.find(r=>r.playerId===pick?.playerId);
 const votes=pick?.modelVotes ?? [];
 const wins=stats[0]?.wins;
 const worldRank=fieldQuery.data?.find(p=>p.player_id===pick?.playerId)?.world_rank;
 const verdict=finishedVerdict(results.filter(r=>picks.some(p=>p.playerId===r.playerId)),championIds);
 const range=winningScoreRange(scoresQuery.isError ? [] : (scoresQuery.data ?? []).map(s=>s.winning_score));
 const p=pronouns(tourCode);
 const date=predictions?.generatedAt ? new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short'}).format(new Date(predictions.generatedAt)) : null;
 const headerSub=[venueName,date ? copy('pickedDate',{date}):'',copy(phase==='upcoming'?'locks':'locked')].filter(Boolean).join(' · ');
 const meta=[worldRank ? copy('worldRank',{rank:worldRank}):'',pick ? copy('pickNumber',{n:picks.findIndex(x=>x.playerId===pick.playerId)+1,total:picks.length}):'',wins ? copy('seasonWins',{count:wins}):''].filter(Boolean).join(' · ');
 function section(label:string,children:React.ReactNode) { return <section className="pick-panel-sec"><div className="pick-panel-label">{copy(label)}</div>{children}</section>; }
 function score(r:PickResult) { return r.score==null || outStatus(r.status) ? null : <span className={r.score<0?'pick-panel-under':''}>{fmtScore(r.score)}</span>; }
 const resultGroups:PickResult[][]=[];
 for (const r of results.filter(r=>picks.some(pick=>pick.playerId===r.playerId))) {
   const group=resultGroups.find(g=>!outStatus(r.status)&&!outStatus(g[0].status)&&g[0].position===r.position&&g[0].score===r.score);
   if(group) group.push(r); else resultGroups.push([r]);
 }
 const verdictDetails=resultGroups.map(group=>{
   const r=group[0],names=joinNames(group.map(x=>surnameOf(x.playerName)));
   if(outStatus(r.status)) return copy(['CUT','MC'].includes(r.status?.toUpperCase()??'')?'missedCutSentence':'withdrewSentence',{names});
   return copy(group.length>1?'bothFinished':'finished',{names,position:resultPosition(r),score:r.score==null?'':fmtScore(r.score)});
 }).join(' ');
 const further=dark.flatMap(d=>{const r=results.find(x=>x.playerId===d.playerId);return r&&!outStatus(r.status)&&r.position!=null&&r.position<=10?[`${surnameOf(d.playerName)} ${copy('was')} ${resultPosition(r)}`]:[];});
 return <BottomSheet open onClose={onClose} scrollBody topRadius={22} grabberPadding="8px 0 12px" ariaLabelledBy="overview-picks-sheet-title">
  <div data-overview-picks-sheet className="text-[color:var(--pick-ink)] pb-6">
   <header className="pick-panel-header"><div className="pick-panel-kicker">{copy('whyLabel')}</div><h2 id="overview-picks-sheet-title">{eventName}</h2><div className="pick-panel-sub">{headerSub}</div></header>
   {phase==='completed'&&<div className="pick-panel-verdict"><b>{verdict.bold}</b><p>{verdictDetails} {winner&&!championIds.some(id=>picks.some(pick=>pick.playerId===id))&&winner.score!=null&&<>{copy(winningMargin===0?'winnerPlayoff':'winnerMargin',{name:winner.playerName,margin:wordNumber(winningMargin??0),score:fmtScore(winner.score),pronoun:p.subject.toLowerCase()})} </>}{further.length>0&&copy('furtherResults',{names:joinNames(further)})}</p></div>}
   <div className="pick-panel-tabs" role="tablist" aria-label={copy('pickTabs')}>{picks.map(item=><Button key={item.playerId} variant="ghost" role="tab" aria-label={item.playerName} aria-selected={item.playerId===pick?.playerId} onClick={()=>setSelected(item.playerId)}><PlayerAvatar playerId={item.playerId} playerName={item.playerName} photoUrl={item.photoUrl} headshotOverride={item.headshotOverride} tourCode={tourCode} size={18}/><span>{surnameOf(item.playerName)}</span></Button>)}</div>
   {pick&&<><div className="pick-panel-head"><PlayerAvatar playerId={pick.playerId} playerName={pick.playerName} photoUrl={pick.photoUrl} headshotOverride={pick.headshotOverride} tourCode={tourCode} size={52}/><div><div className="pick-panel-name">{pick.playerName}</div><div className="pick-panel-sub tabular-nums">{meta}</div></div></div>
   {phase!=='upcoming'&&result&&<div className="pick-panel-result tabular-nums"><b>{outStatus(result.status)?copy(['CUT','MC'].includes(result.status?.toUpperCase()??'')?'missedCut':'withdrew'):resultPosition(result)}</b>{score(result)}<span>{phase==='completed' ? result.percentile!=null?copy('beatField',{value:result.percentile}):'' : outStatus(result.status)?copy('outRoundTwo'):copy('liveResult',{thru:(result as PickResult & {thru?:number}).thru ?? '',round:currentRound??''})}</span></div>}
   {section('models',<><div className="pick-panel-votes">{[['claude','Claude'],['gpt4','GPT'],['gemini','Gemini']].map(([model,name])=><div key={model} className="pick-panel-vote"><small>{name}</small><b>{votes.find(v=>v.model===model)?.rank ? ordinal(votes.find(v=>v.model===model)?.rank ?? 0):copy('notTopTen')}</b></div>)}</div><div className="pick-panel-vote-note">{modelVoteNote(votes,tourCode)}</div></>)}
   {stats.length>0&&section('fitLabel',<><div className="pick-panel-label">{copy('fitPronoun',{pronoun:p.subject.toUpperCase()})}</div>{chosenStats.map(key=>{const stat=stats.find(s=>s.stat===key);return stat?<div className="pick-panel-stat tabular-nums" key={key} data-fit-stat={key}><span>{copy(`stat.${key}`)}<small>{formatFitValue(key,stat.value)}</small></span><b>{ordinal(stat.percentile)}</b><div className="pick-panel-track"><div className="pick-panel-fill" data-low={stat.percentile<50} style={{width:`${stat.percentile}%`}}/></div></div>:null;})}<div className="pick-panel-caption">{copy('fitCaption',{players:stats[0].players,tour:tourCode.toUpperCase()==='PGA'?'PGA TOUR':tourCode.toUpperCase()})}</div></>)}
   {reasons.length>0&&section('caseLabel',<ul className="pick-panel-case">{reasons.map((reason,index)=><li key={index}>{reason}</li>)}</ul>)}
   {lowest&&section('catchLabel',<div className="pick-panel-catch"><b>{copy(`stat.${lowest.stat}`)}: {formatFitValue(lowest.stat,lowest.value)}, {ordinal(lowest.percentile)} {copy('percentile')}.</b> {catchSentence(lowest,tourCode)}</div>)}
   {section('whatWinsLabel',<><div className="pick-panel-figures">{predictions?.courseAnalysis?.difficulty&&<div><small>{copy('figDifficulty')}</small><b>{predictions.courseAnalysis.difficulty}</b></div>}{range&&<div><small>{copy(range.single?'lastWinningScore':'winningScores')}</small><b className="tabular-nums"><span className={range.best<0?'pick-panel-under':''}>{fmtScore(range.best)}</span>{!range.single&&<> {copy('to')} <span className={range.worst<0?'pick-panel-under':''}>{fmtScore(range.worst)}</span></>}</b></div>}</div>{predictions?.courseAnalysis?.winnerProfile&&<div className="pick-panel-read">{copy('modelRead')} {predictions.courseAnalysis.winnerProfile[0].toLowerCase()+predictions.courseAnalysis.winnerProfile.slice(1)}</div>}<div className="pick-panel-chips">{chosenStats.map(key=><span key={key} className="pick-panel-chip">{copy(`stat.${key}`)}</span>)}</div></>)}
   {dark.length>0&&section('furtherLabel',<>{dark.map(d=>{const best=fit.filter(s=>s.player_id===d.playerId).sort((a,b)=>b.percentile-a.percentile)[0];const r=results.find(r=>r.playerId===d.playerId);return <div className="pick-panel-darkhorse" key={d.playerId}><PlayerAvatar playerId={d.playerId} playerName={d.playerName} photoUrl={d.photoUrl} headshotOverride={d.headshotOverride} tourCode={tourCode} size={26}/><div><strong>{d.playerName}</strong>{best&&<small>{copy(`stat.${best.stat}`)} {formatFitValue(best.stat,best.value)}, {ordinal(best.percentile)} {copy('percentile')}</small>}</div>{phase!=='upcoming'&&r&&<b className={outStatus(r.status)?'pick-panel-dim':championIds.includes(r.playerId)?'pick-panel-win':r.position!=null&&r.position<=10?'':'pick-panel-muted'}>{resultPosition(r)}</b>}</div>;})}</>)}
   </>}
   <section className="pick-panel-sec pick-panel-method" data-overview-picks-sheet-method><div className="pick-panel-label">{copy('howLabel')}</div>{['independent','combine','check','lock'].map(key=><p key={key}><b>{copy(`method.${key}Lead`)}</b> {copy(`method.${key}Body`)}</p>)}</section>
   <div className="pick-panel-footer">{copy('footer')}</div>
  </div>
 </BottomSheet>;
}
export default PicksSheet;
