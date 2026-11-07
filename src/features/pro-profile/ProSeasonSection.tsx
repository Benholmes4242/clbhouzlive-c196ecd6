/** SEASON shows only what the tour or the world ranking recorded; there is
 * no manual add. "See all" hands off to the Tour tab via the caller, never a
 * sheet. ResultDetail owns count-based round columns. */
import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { ChevronRight, X } from 'lucide-react';
import { monthLabel, eventYear, finishLabel, scoreLabel, seasonSummary, sortedEvents, formatWorldRank, pointsCopy, type ProEvent } from './proProfileRules';
export function ProResultRow({ event, first, open }: { event: ProEvent; first: string; open: () => void }) {
  const sub = [monthLabel(event.start_date),event.country].filter(Boolean).join(' · '), gross=event.source==='owgr';
  return <div className="pro-result-line"><Button variant="ghost" className="pro-profile-row" onClick={open}><span className={`pro-profile-finish ${finishLabel(event.finish)==='1st'?'pro-profile-gold':['MC','WD','DQ'].includes(event.finish??'')?'pro-profile-eliminated':''}`}>{finishLabel(event.finish)}</span><span className="pro-profile-event"><b>{event.event_name}</b><small>{sub}{event.source==='pro'&&<span className="pro-profile-added">ADDED BY {first.toUpperCase()}</span>}</small></span><span className="pro-profile-score">{gross?<b className="pro-profile-gross">{event.total_strokes??''}</b>:event.to_par!=null?<b className={event.to_par<0?'pro-profile-under':''}>{scoreLabel(event.to_par)}</b>:null}</span><ChevronRight /></Button></div>;
}
export function ResultDetail({ event, close }: { event: ProEvent; close: () => void }) {
  const owgr = event.source === 'owgr', score=owgr?null:event.to_par;
  const date = event.start_date ? new Date(`${event.start_date.slice(0,10)}T12:00:00Z`) : null;
  const end = event.end_date ? new Date(`${event.end_date.slice(0,10)}T12:00:00Z`) : null;
  const dateLabel = date ? `${date.getUTCDate()}${end && end.getUTCDate() !== date.getUTCDate() ? `–${end.getUTCDate()}` : ''} ${monthLabel(event.start_date).toUpperCase()} ${date.getUTCFullYear()}` : event.owgr_year?.toString();
  const before=event.owgr_rank_before,after=event.owgr_rank_after;
  const movement=before!=null&&after!=null&&before!==after?{improved:after<before,difference:Math.abs(after-before)}:null;
  return <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-result-title"><div className="pro-profile pro-profile-sheet">
    <div className="pro-profile-heading"><span className="pro-profile-kicker">{[event.tour_name,dateLabel,event.country].filter(Boolean).join(' · ').toUpperCase()}</span><Button variant="ghost" size="icon" aria-label="Close result" onClick={close}><X /></Button></div>
    <h2 id="pro-result-title">{event.event_name}</h2><div className="pro-profile-tiles"><div className="pro-profile-tile"><b className={finishLabel(event.finish)==='1st'?'pro-profile-gold':''}>{finishLabel(event.finish)}</b><span>FINISH</span></div><div className="pro-profile-tile"><b className={score!=null&&score<0?'pro-profile-under':''}>{score!=null?scoreLabel(score):owgr?event.total_strokes??'—':'—'}</b><span>{owgr?'STROKES':'TO PAR'}</span></div>{owgr && <div className="pro-profile-tile"><b>{formatWorldRank(after)}</b><span>WORLD RANK</span>{movement&&<small className={`pro-result-rank-movement ${movement.improved?'pro-profile-up':'pro-profile-worse'}`}>{movement.improved?'▲':'▼'} {formatWorldRank(movement.difference)}</small>}</div>}</div>
    <div className="pro-profile-rounds" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(event.rounds.length, 4))}, 1fr)` }}>{[...event.rounds].sort((a,b)=>a.round_no-b.round_no).map(r=>{const toPar=owgr?null:r.to_par;return <div key={r.round_no} className="pro-profile-round"><span>R{r.round_no}</span><b className={toPar!=null&&toPar<0?'pro-profile-under':''}>{toPar!=null?scoreLabel(toPar):owgr?r.strokes??'—':'—'}</b></div>;})}</div>
    {owgr && <p className="pro-profile-footnote">Strokes as published by the Official World Golf Ranking.{pointsCopy(event.owgr_points)}</p>}
  </div></BottomSheet>;
}
export function ProSeasonSection({ events, year, first, linked, scoring, onSeeAll }: { events: ProEvent[]; year: number; first: string; linked: boolean; scoring?: number | null; onSeeAll?: () => void }) {
  const [detailId,setDetailId]=useState<string|null>(null);
  const summary=seasonSummary(events,year),rows=sortedEvents(events.filter(e=>eventYear(e)===year&&e.finish!=null));
  const allRows=sortedEvents(events.filter(e=>e.finish!=null));
  const source=linked?'From the tour':rows.some(e=>e.source==='owgr')?'Official World Golf Ranking':`Added by ${first}`;
  const tiles=[[summary.events,'EVENTS'],[summary.cuts,'CUTS MADE'],[finishLabel(summary.best),'BEST'],[linked?scoring?.toFixed(1)??'—':summary.average??'—','SCORING']];
  const detail=events.find(e=>e.id===detailId);
  return <section className="pro-profile-section"><div className="pro-profile-heading"><h2>{year} SEASON</h2><span className="pro-profile-source">{source}</span></div><div className="pro-profile-tiles">{tiles.map(([value,label])=><div className="pro-profile-tile" key={label}><b className={label==='BEST'&&value==='1st'?'pro-profile-gold':''}>{value}</b><span>{label}</span></div>)}</div>
    {rows.length>0&&<div className="pro-profile-card pro-profile-results">{rows.slice(0,4).map(e=><ProResultRow key={e.id} event={e} first={first} open={()=>setDetailId(e.id)}/>)}{onSeeAll&&<Button variant="ghost" className="pro-profile-all" onClick={onSeeAll}>See all {allRows.length} results ›</Button>}</div>}
    {detail&&<ResultDetail event={detail} close={()=>setDetailId(null)}/>}
  </section>;
}
