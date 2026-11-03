import { useTranslation } from 'react-i18next';
import type { PlayerHoles } from '../data/usePlayerData';
import type { MyScoring,TourAverages } from '../../players-v2/you/youAndTourRules';
import { HOLE_NUMBERS,holeValue,holeCallout,youAgainst,signed } from '../playerRules';
import { pronouns } from '../../components/overview-v3/HybridHeroBands/pickInsightRules';
import { PlayerSection,PlayerLine } from './PlayerSection';
function Axis({delta,scale}:{delta:number;scale:number}) {const width=Math.min(46,Math.abs(delta)/scale*46);return <div className="pv-gap"><span className="pv-axis"/><i data-worse={delta>0} style={{width:`${width}%`,...(delta<0?{right:'50%'}:{left:'50%'})}}/></div>;}
export function PlayerShots({him,tour,mine,code}:{him:PlayerHoles;tour:TourAverages;mine:MyScoring|null;code:string}) {
 const {t}=useTranslation('tourhub');const p=pronouns(code),copy=(k:string,o:Record<string,unknown>={})=>t(`player.v3.${k}`,o);const you=mine&&mine.rounds>=5?youAgainst(mine,him):null;
 return <PlayerSection id="shots" title={copy('shots',{possessive:p.possessive.toLowerCase()})} right={copy('roundsCount',{count:him.rounds})}><div className="pv-hole pv-hole-head"><span/><div>{copy('betterWorse')}</div><span>{p.object.toUpperCase()}</span><span>{copy('tour')}</span></div>
 {HOLE_NUMBERS.map(n=><div className="pv-hole num" key={n}><b>{copy('par',{n})}</b><Axis delta={holeValue(him,n)-holeValue(tour,n)} scale={.06}/><strong className={holeValue(him,n)<0?'pv-under':''}>{signed(holeValue(him,n))}</strong><span>{signed(holeValue(tour,n))}</span></div>)}
 <div className="pv-hole num"><b>{copy('bogeys')}</b><Axis delta={(him.bogey_rate-tour.bogey_rate)*100} scale={6}/><strong>{(him.bogey_rate*100).toFixed(1)}%</strong><span>{(tour.bogey_rate*100).toFixed(1)}%</span></div><div className="pv-cap">{copy('holeCaption')}</div><PlayerLine line={holeCallout(him,tour,code)} className="pv-callout"/>
 {you&&mine&&you.widest&&<div className="pv-you" data-you-against><small>{copy('youAgainst',{object:p.object})}</small><b>{copy(you.total>=0?'heBeatsYou':'youBeatHim',{subject:p.subject,object:p.object,n:Math.round(Math.abs(you.total))})}</b><div className="pv-you-tiles num">{you.rows.map(r=><div key={r.n}><small>{copy('par',{n:r.n})}</small><b>{r.gap.toFixed(1)}</b></div>)}</div><p>{copy('youFoot',{rounds:mine.rounds,possessive:p.possessive.toLowerCase(),mix:you.rows.map(r=>r.holes).join(', '),n:you.widest.n,subject:p.subject.toLowerCase(),his:signed(holeValue(him,you.widest.n)),yours:signed(holeValue(mine,you.widest.n))})}</p></div>}
 </PlayerSection>;
}
