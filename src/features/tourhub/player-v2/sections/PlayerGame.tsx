import { useTranslation } from 'react-i18next';
import type { PlayerStat } from '../data/usePlayerData';
import { orderedStats, statKey } from '../playerRules';
import { formatFitValue, statLabel, ordinal, catchSentence } from '../../components/overview-v3/HybridHeroBands/pickInsightRules';
import { PlayerSection } from './PlayerSection';
export function PlayerGame({stats,tour,label}:{stats:PlayerStat[];tour:string;label:string}) {
 const {t}=useTranslation('tourhub');const copy=(k:string,o:Record<string,unknown>={})=>t(`player.v3.${k}`,o);const rows=orderedStats(stats);if(!rows.length)return null;
 const best=[...rows].sort((a,b)=>b.percentile-a.percentile)[0],low=[...rows].sort((a,b)=>a.percentile-b.percentile)[0];
 return <PlayerSection id="game" title={copy('game',{possessive:tour==='lpga'?'Her':'His'})} right={copy('againstTour')}>
 {rows.map(r=><div className="pv-bar" key={r.stat} data-player-stat={r.stat}><div className="pv-stat-label">{statLabel[statKey(r)]}<span className="num">{formatFitValue(r.stat,r.value)}</span></div><div className="pv-percentile num">{ordinal(r.percentile)}</div><div className="pv-track"><i data-low={r.percentile<50} style={{width:`${r.percentile}%`}}/><span className="pv-mid"/></div></div>)}
 <div className="pv-cap">{copy('statCaption',{players:rows[0].players,tour:label})}</div><div className="pv-duo"><div><small>{copy('bestAt')}</small><b>{statLabel[statKey(best)]}</b><span>{copy(best.percentile===100?'bestOnTour':'rankOnTour',{value:formatFitValue(best.stat,best.value),rank:ordinal(best.percentile)})}</span></div><div><small>{copy('catch')}</small><b>{statLabel[statKey(low)]}</b><span>{low.percentile>=60?copy('noWeakness',{value:formatFitValue(low.stat,low.value),rank:ordinal(low.percentile)}):`${copy('lowPercentile',{value:formatFitValue(low.stat,low.value),rank:ordinal(low.percentile)})} ${catchSentence({...low,player_id:'',wins:0},tour)}`}</span></div></div></PlayerSection>;
}
