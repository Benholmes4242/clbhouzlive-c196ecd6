import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { eventToPar, needsPar, monthLabel, eventYear, finishLabel, scoreLabel, seasonSummary, sortedEvents, type ProEvent } from './proProfileRules';
import { ProParSheet } from './ProParSheet';
import { ProEventSheet, ResultDetail } from './ProEventSheets';
export function ProResultRow({ event, first, open, canEditPar = false, addPar }: { event: ProEvent; first: string; open: () => void; canEditPar?: boolean; addPar?: () => void }) {
  const sub = [monthLabel(event.start_date),event.country].filter(Boolean).join(' · '), score=eventToPar(event), gross=event.source==='owgr';
  return <div className="pro-result-line"><Button variant="ghost" className="pro-profile-row" onClick={open}><span className={`pro-profile-finish ${finishLabel(event.finish)==='1st'?'pro-profile-gold':['MC','WD','DQ'].includes(event.finish??'')?'pro-profile-eliminated':''}`}>{finishLabel(event.finish)}</span><span className="pro-profile-event"><b>{event.event_name}</b><small>{sub}{event.source==='pro'&&<span className="pro-profile-added">ADDED BY {first.toUpperCase()}</span>}</small></span><span className="pro-profile-score">{score!=null?<><b className={score<0?'pro-profile-under':''}>{scoreLabel(score)}</b>{gross&&<small>{event.total_strokes}</small>}</>:gross?<b className="pro-profile-gross">{event.total_strokes??''}</b>:null}{canEditPar&&needsPar(event)&&<span className="pro-par-reservation" aria-hidden />}</span><ChevronRight /></Button>{canEditPar&&needsPar(event)&&<Button variant="ghost" className="pro-row-add-par" onClick={addPar}>Add par</Button>}</div>;
}
export function ProSeasonSection({ events, year, first, owner, userId, linked, scoring, canEditPar = owner }: { events: ProEvent[]; year: number; first: string; owner: boolean; userId: string; linked: boolean; scoring?: number | null; canEditPar?: boolean }) {
  const [detailId,setDetailId]=useState<string|null>(null),[parEvents,setParEvents]=useState<ProEvent[]|null>(null),[all,setAll]=useState(false),[add,setAdd]=useState(false);
  const summary=seasonSummary(events,year),rows=sortedEvents(events.filter(e=>eventYear(e)===year&&e.finish!=null));
  const allRows=sortedEvents(events.filter(e=>e.finish!=null));
  const source=linked?'From the tour':rows.some(e=>e.source==='owgr')?'Official World Golf Ranking':`Added by ${first}`;
  const tiles=[[summary.events,'EVENTS'],[summary.cuts,'CUTS MADE'],[finishLabel(summary.best),'BEST'],[linked?scoring?.toFixed(1)??'—':summary.average??'—','SCORING']];
  const detail=events.find(e=>e.id===detailId),missing=sortedEvents(events.filter(needsPar));
  const groups=[...new Set(allRows.map(eventYear))].sort((a,b)=>Number(b)-Number(a));
  return <section className="pro-profile-section"><div className="pro-profile-heading"><h2>{year} SEASON</h2><span className="pro-profile-source">{source}</span></div><div className="pro-profile-tiles">{tiles.map(([value,label])=><div className="pro-profile-tile" key={label}><b className={label==='BEST'&&value==='1st'?'pro-profile-gold':''}>{value}</b><span>{label}</span></div>)}</div>
    {rows.length>0&&<div className="pro-profile-card pro-profile-results">{rows.slice(0,4).map(e=><ProResultRow key={e.id} event={e} first={first} canEditPar={canEditPar} addPar={()=>setParEvents([e])} open={()=>setDetailId(e.id)}/>)}<Button variant="ghost" className="pro-profile-all" onClick={()=>setAll(true)}>See all {allRows.length} results ›</Button></div>}
    {canEditPar&&missing.length>0&&<div className="pro-profile-add pro-profile-dashed"><div><b>Add the course par</b><small>{owner?`${missing.length} of your results show strokes only. Add each course's par and members see your score to par.`:`${missing.length} results show strokes only.`}</small></div><Button className="pro-profile-command" onClick={()=>setParEvents(missing)}>Add par</Button></div>}
    {owner&&<div className="pro-profile-add pro-profile-dashed"><div><b>Add a result</b><small>For an event the world ranking doesn't count. It shows as added by you.</small></div><Button className="pro-profile-command" onClick={()=>setAdd(true)}>Add</Button></div>}
    <BottomSheet open={all} onClose={()=>setAll(false)} scrollBody ariaLabelledBy="pro-all-title"><div className="pro-profile-sheet"><h2 id="pro-all-title">All results</h2>{groups.map(y=><section key={y??'unknown'}><h3>{y??'Undated'}</h3>{allRows.filter(e=>eventYear(e)===y).map(e=><ProResultRow key={e.id} event={e} first={first} canEditPar={canEditPar} addPar={()=>{setAll(false);setParEvents([e]);}} open={()=>{setAll(false);setDetailId(e.id);}}/>)}</section>)}</div></BottomSheet>
    {detail&&!parEvents&&<ResultDetail event={detail} first={first} canEditPar={canEditPar} addPar={()=>setParEvents([detail])} close={()=>setDetailId(null)}/>} {parEvents&&<ProParSheet events={parEvents} close={()=>setParEvents(null)}/>} {add&&<ProEventSheet userId={userId} resultMode close={()=>setAdd(false)}/>}
  </section>;
}