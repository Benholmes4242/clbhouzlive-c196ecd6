import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlayerResult } from '../data/usePlayerData';
import { newest, displayRank } from '../playerRules';
import { isAnyMajor } from '../../utils/majorScope';
import { tournamentRoute } from '../../routes';
import { PlayerSection } from './PlayerSection';
export const resultTone=(r:PlayerResult)=>r.is_winner?'win':displayRank(r.display_position)==null?'out':Number(displayRank(r.display_position))<=10?'top10':'other';
export function PlayerForm({results,year,name}:{results:PlayerResult[];year:number;name:string}) {
 const {t}=useTranslation('tourhub');const copy=(k:string,o:Record<string,unknown>={})=>t(`player.v3.${k}`,o); const rows=newest(results),last=rows.slice(0,10);
 const W=350,H=150,L=26,T=6,B=22;const start=Date.UTC(year,0,1),end=Date.UTC(year,11,31);
 const x=(d:string)=>L+(new Date(d).getTime()-start)/(end-start)*(W-L-4);
 const y=(p:string)=>T+Math.log(Math.min(200,displayRank(p)??200))/Math.log(200)*(H-T-B);
 return <>{rows.length>=3&&<PlayerSection id="form" title={copy('form')} right={copy('lastStarts',{count:last.length})} divided={false}><div className="pv-form num" style={{gridTemplateColumns:`repeat(${Math.max(last.length,5)},1fr)`}}>{last.map(r=><div key={r.tournament_id} data-tone={resultTone(r)}>{r.display_position}</div>)}</div><div className="pv-form-label"><span>{copy('latest')}</span><span>{last.at(-1)&&new Intl.DateTimeFormat('en-GB',{month:'short'}).format(new Date(last.at(-1)?.end_date??'')).toUpperCase()}</span></div></PlayerSection>}
 {rows.length>=5&&<PlayerSection id="season" title={copy('season',{possessive:copy('possessive')})} right={copy('finishByStart')} divided={false}><svg className="pv-chart num" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label={copy('chartLabel')}>
 {[['1','1'],['10','10'],['50','50'],['MC','MC']].map(([pos,label])=><g key={pos}><line x1={L} x2={W} y1={y(pos)} y2={y(pos)} className={pos==='10'?'pv-ten':''}/><text x={0} y={y(pos)+3.5}>{label}</text></g>)}
 {[0,2,4,6,8,10].map(m=><text key={m} x={x(`${year}-${String(m+1).padStart(2,'0')}-01`)} y={H-4}>{new Intl.DateTimeFormat('en-GB',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(year,m,1))).toUpperCase()}</text>)}
 {rows.map(r=>{const target=tournamentRoute(r.tournament_id,{kind:'player',playerName:name});return <Link key={r.tournament_id} to={target.to} state={target.state} aria-label={`${r.name}, ${r.display_position}`}><title>{r.name}: {r.display_position}</title>{isAnyMajor(r.name)&&<circle className="pv-major-ring" cx={x(r.end_date)} cy={y(r.display_position)} r={8}/>}<circle data-tone={resultTone(r)} cx={x(r.end_date)} cy={y(r.display_position)} r={r.is_winner?5.5:4.5}/></Link>;})}
 </svg><div className="pv-legend">{['win','top10','other','major'].map(k=><span key={k}><i data-tone={k}/>{copy(`legend.${k}`)}</span>)}</div></PlayerSection>}</>;
}
