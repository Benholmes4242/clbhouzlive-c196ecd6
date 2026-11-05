import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { eventYear, finishLabel, scoreLabel, seasonSummary, sortedEvents, type ProEvent } from './proProfileRules';
import { ProEventSheet, ResultDetail } from './ProEventSheets';
export function ProResultRow({ event, first, open }: { event: ProEvent; first: string; open: () => void }) {
  const date = event.start_date ? new Date(`${event.start_date.slice(0,10)}T12:00:00Z`) : null;
  const sub = [date?.toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'}),event.country].filter(Boolean).join(' · ');
  return <Button variant="ghost" className="pro-profile-row" onClick={open}><span className={`pro-profile-finish ${finishLabel(event.finish)==='1st'?'pro-profile-gold':['MC','WD','DQ'].includes(event.finish??'')?'pro-profile-eliminated':''}`}>{finishLabel(event.finish)}</span><span className="pro-profile-event"><b>{event.event_name}</b><small>{sub}{event.source==='pro'&&<span className="pro-profile-added">ADDED BY {first.toUpperCase()}</span>}</small></span><span className={`pro-profile-score ${event.source!=='owgr'&&(event.to_par??0)<0?'pro-profile-under':''}`}>{event.source==='owgr'?event.total_strokes??'':event.to_par==null?'':scoreLabel(event.to_par)}</span><ChevronRight /></Button>;
}
export function ProSeasonSection({ events, year, first, owner, userId, linked, scoring }: { events: ProEvent[]; year: number; first: string; owner: boolean; userId: string; linked: boolean; scoring?: number | null }) {
  const [detail,setDetail]=useState<ProEvent|null>(null),[all,setAll]=useState(false),[add,setAdd]=useState(false);
  const summary=seasonSummary(events,year),rows=sortedEvents(events.filter(e=>eventYear(e)===year&&e.finish!=null));
  const allRows=sortedEvents(events.filter(e=>e.finish!=null));
  const source=linked?'From the tour':rows.some(e=>e.source==='owgr')?'Official World Golf Ranking':`Added by ${first}`;
  const tiles=[[summary.events,'EVENTS'],[summary.cuts,'CUTS MADE'],[finishLabel(summary.best),'BEST'],[linked?scoring?.toFixed(1)??'—':summary.average??'—',linked?'SCORING':'STROKES/RD']];
  const groups=[...new Set(allRows.map(eventYear))].sort((a,b)=>Number(b)-Number(a));
  return <section className="pro-profile-section"><div className="pro-profile-heading"><h2>{year} SEASON</h2><span className="pro-profile-source">{source}</span></div><div className="pro-profile-tiles">{tiles.map(([value,label])=><div className="pro-profile-tile" key={label}><b className={label==='BEST'&&value==='1st'?'pro-profile-gold':''}>{value}</b><span>{label}</span></div>)}</div>
    {rows.length>0&&<div className="pro-profile-card pro-profile-results">{rows.slice(0,4).map(e=><ProResultRow key={e.id} event={e} first={first} open={()=>setDetail(e)}/>)}<Button variant="ghost" className="pro-profile-all" onClick={()=>setAll(true)}>See all {allRows.length} results ›</Button></div>}
    {owner&&<div className="pro-profile-add pro-profile-dashed"><div><b>Add a result</b><small>For an event the world ranking doesn't count. It shows as added by you.</small></div><Button className="pro-profile-command" onClick={()=>setAdd(true)}>Add</Button></div>}
    <BottomSheet open={all} onClose={()=>setAll(false)} scrollBody ariaLabelledBy="pro-all-title"><div className="pro-profile-sheet"><h2 id="pro-all-title">All results</h2>{groups.map(y=><section key={y??'unknown'}><h3>{y??'Undated'}</h3>{allRows.filter(e=>eventYear(e)===y).map(e=><ProResultRow key={e.id} event={e} first={first} open={()=>{setAll(false);setDetail(e);}}/>)}</section>)}</div></BottomSheet>
    {detail&&<ResultDetail event={detail} close={()=>setDetail(null)}/>} {add&&<ProEventSheet userId={userId} resultMode close={()=>setAdd(false)}/>}
  </section>;
}