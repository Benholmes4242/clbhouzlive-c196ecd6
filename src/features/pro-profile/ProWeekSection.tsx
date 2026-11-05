import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useGuestActionGate } from '@/features/guest/useGuestActionGate';
import { useProWatch } from './useProProfile';
import { currentEvent, scoreLabel, watchCountCopy, type ProEvent, type ProRound } from './proProfileRules';
import { ProEventSheet, ProRoundSheet } from './ProEventSheets';
export function ProWeekSection({ events, userId, viewerId, owner, first }: { events: ProEvent[]; userId: string; viewerId?: string; owner: boolean; first: string }) {
  const event=currentEvent(events),watch=useProWatch(userId,viewerId),gate=useGuestActionGate(),cache=useQueryClient();
  const [add,setAdd]=useState(false),[editEvent,setEditEvent]=useState(false),[round,setRound]=useState<{number:number;existing?:ProRound}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const toggle=async()=>{if(gate('other',{firstName:first}))return;setBusy(true);setError('');try{const {error}=await supabase.rpc('toggle_pro_score_watch',{p_pro_id:userId});if(error)throw error;await cache.invalidateQueries({queryKey:['pro-profile','watch',userId]});}catch{setError('Could not update score notifications.');}finally{setBusy(false);}};
  if(!event&&!owner)return null;
  const rounds=event?.rounds.filter(r=>r.source==='pro').sort((a,b)=>a.round_no-b.round_no)??[];
  const next=Array.from({length:event?.scheduled_rounds??4},(_,i)=>i+1).find(n=>!event?.rounds.some(r=>r.round_no===n));
  const weekday=(s:string)=>new Date(`${s.slice(0,10)}T12:00:00Z`).toLocaleDateString('en-GB',{weekday:'short',timeZone:'UTC'});
  const days=event?.start_date?`${weekday(event.start_date)}${event.end_date?`–${weekday(event.end_date)}`:''}`:'';
  const tee=event?.tee_time?new Date(event.tee_time).toLocaleDateString('en-GB',{weekday:'short'})+' '+new Date(event.tee_time).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):null;
  return <section className="pro-profile-section"><div className="pro-profile-heading"><h2>THIS WEEK</h2><span className="pro-profile-source">{event?`Added by ${first}`:''}</span></div>
    {!event?<div className="pro-profile-add pro-profile-dashed"><b>Where are you playing next?</b><Button className="pro-profile-command" onClick={()=>setAdd(true)}>Add</Button></div>:<div className="pro-profile-card"><div className="pro-profile-heading"><span className="pro-profile-kicker">PLAYING {days.toUpperCase()} · {event.tour_name?.toUpperCase()}</span>{owner&&event.source==='pro'&&<Button variant="ghost" onClick={()=>setEditEvent(true)}>Edit</Button>}</div><h3>{event.event_name}</h3><div className="pro-profile-venue">{[event.venue,event.country].filter(Boolean).join(' · ')}</div>
      {(tee||event.tee_hole!=null)&&<div className="pro-profile-rounds">{tee&&<div className="pro-profile-round"><b>{tee}</b><span>R1 TEE TIME</span></div>}{event.tee_hole!=null&&<div className="pro-profile-round"><b>Hole {event.tee_hole}</b><span>STARTS</span></div>}</div>}
      <div className="pro-profile-rounds">{rounds.map(r=><Button variant="ghost" className="pro-profile-round" disabled={!owner} onClick={()=>setRound({number:r.round_no,existing:r})} key={r.round_no}><b className={(r.to_par??0)<0?'pro-profile-under':''}>{scoreLabel(r.to_par)}</b><span>R{r.round_no} · {owner?'POSTED':`POSTED BY ${first.toUpperCase()}`}</span></Button>)}{owner&&next&&<div className="pro-profile-round pro-profile-dashed"><b>R{next}</b><span>NOT YET</span></div>}</div>
      {owner?next&&<Button className="pro-profile-command" onClick={()=>setRound({number:next})}>Post your round {next} score</Button>:watch.isSuccess&&!watch.isError&&<><Button className="pro-profile-command" data-watching={watch.data.watching} disabled={busy} onClick={toggle}>{watch.data.watching?'Getting his scores':'Get his scores each day'}</Button><p className="pro-profile-caption">You'll get a notification when he posts a round. {watchCountCopy(watch.data.count)}</p></>}
      {error&&<p role="alert" className="pro-profile-error">{error}</p>}
    </div>}
    {(add||editEvent)&&<ProEventSheet userId={userId} event={editEvent?event??undefined:undefined} close={()=>{setAdd(false);setEditEvent(false);}}/>}{event&&round&&<ProRoundSheet event={event} roundNo={round.number} existing={round.existing} close={()=>setRound(null)}/>}
  </section>;
}