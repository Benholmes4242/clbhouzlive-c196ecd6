import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { PlayerResult,PlayerPickHistory } from '../data/usePlayerData';
import { roundAnalysis,roundLead,scoreText,majorsLine,majorShortName,pickHistoryLine,newest } from '../playerRules';
import { pronouns } from '../../components/overview-v3/HybridHeroBands/pickInsightRules';
import { isAnyMajor } from '../../utils/majorScope';
import { PlayerSection,PlayerLine } from './PlayerSection';
export function PlayerRoundByRound({results,tour}:{results:PlayerResult[];tour:string}) {
 const {t}=useTranslation('tourhub'),copy=(k:string,o:Record<string,unknown>={})=>t(`player.v3.${k}`,o);const r=roundAnalysis(results);if(results.length<3||!r.best.length)return null;
 const max=Math.max(...r.averages.map(v=>Math.abs(v??0)),.1);
 return <PlayerSection id="rounds" title={copy('roundByRound')} right={copy('averageToPar')}><PlayerLine line={roundLead(r.averages,tour)}/><div className="pv-rounds num">{r.averages.map((v,i)=><div key={i} data-best={i===r.lowest}>{v!=null&&<><b className={v<0?'pv-under':''}>{`${v<0?'−':v>0?'+':''}${Math.abs(v).toFixed(1)}`}</b><i style={{height:`${Math.abs(v)/max*84}px`}}/></>}<span>R{i+1}</span></div>)}</div><div className="pv-best"><small>{copy('bestRounds')}</small>{r.best.map(b=><div className="pv-best-row num" key={`${b.result.tournament_id}-${b.n}`}><b className={b.score<0?'pv-under':''}>{scoreText(b.score)}</b><span>{b.result.name}</span><small>{copy('roundMonth',{n:b.n,month:new Intl.DateTimeFormat('en-GB',{month:'short'}).format(new Date(b.result.end_date))})}</small></div>)}</div></PlayerSection>;
}
export function PlayerMajors({results,year}:{results:PlayerResult[];year:number}) {
 const {t}=useTranslation('tourhub');const copy=(k:string)=>t(`player.v3.${k}`),rows=results.filter(r=>isAnyMajor(r.name));if(!rows.length)return null;
 return <PlayerSection id="majors" title={copy('majors')} right={year}><p className="pv-lead">{majorsLine(results)}</p><div className="pv-major-tiles num">{['Masters','PGA','U.S. Open','The Open'].map(label=>{const r=rows.find(r=>majorShortName(r.name)===label);return <div key={label}><small>{label}</small>{r?<><b className={r.is_winner?'pv-win':['MC','WD'].includes(r.display_position)?'pv-out':''}>{r.display_position}</b>{typeof r.score==='number'&&r.display_position!=='MC'&&<span className={r.score<0?'pv-under':''}>{scoreText(r.score)}</span>}</>:<b data-empty>{copy('didntPlay')}</b>}</div>;})}</div></PlayerSection>;
}
export function PlayerPicks({history,tour,onRecord}:{history:PlayerPickHistory|null;tour:string;onRecord:()=>void}) {
 const {t}=useTranslation('tourhub');const copy=(k:string,o:Record<string,unknown>={})=>t(`player.v3.${k}`,o);if(!history?.picks.length)return null;
 const p=pronouns(tour),line=pickHistoryLine(history,tour);
 return <PlayerSection id="picks" title={copy('inOurPicks')} right={copy('thisSeason')}><div className="pv-ours"><p>{copy('pickedBefore',{object:p.object})}<b>{line.bold}</b>{copy('pickedAfter')} {line.rest}</p><div className="pv-ours-row num">{newest(history.picks).slice(0,3).map(r=><div key={r.tournament_id}><small>{r.name}</small><b className={r.won?'pv-win':''}>{r.position}</b></div>)}</div>{history.member_picks>0&&<div className="pv-cap">{copy('memberPicks',{count:history.member_picks,object:p.object})}</div>}<Button variant="ghost" className="pv-link" onClick={onRecord}>{copy('ourRecord')}</Button></div></PlayerSection>;
}
