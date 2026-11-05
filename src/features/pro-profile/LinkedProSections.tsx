/** Linked-only live/stat collectors. No sample averages: tour comparison is
 * the complete year/tour statistics population, paged beyond the API row cap.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScorecardSheet } from '@/features/tourhub/leaderboard/ScorecardSheet';
import type { Database } from '@/integrations/supabase/types';
import { scoreLabel } from './proProfileRules';
type Stats = Database['public']['Tables']['sr_player_statistics']['Row'];
export function useLinkedProStats(playerId: string, year: number, tour: string) {
  return useQuery({ queryKey:['pro-profile','stats',playerId,year,tour], enabled:!!playerId, staleTime:300_000, queryFn:async()=>{
    const rows: Stats[]=[];
    for(let offset=0;;offset+=1000){const {data,error}=await supabase.from('sr_player_statistics').select('*,sr_seasons!inner(year,tour_name)').eq('sr_seasons.year',year).eq('sr_seasons.tour_name',tour).order('id').range(offset,offset+999);if(error)throw error;rows.push(...data??[]);if(!data||data.length<1000)break;}
    return {player:rows.find(r=>r.player_id===playerId)??null,rows};
  }});
}
const rawNumber=(v:unknown,key:string):number|null=>{if(!v||typeof v!=='object'||Array.isArray(v))return null;const r=v as Record<string,unknown>;return typeof r[key]==='number'?r[key] as number:null;};
const scrambling=(r:Stats)=>rawNumber(r.raw_data,'scrambling')??rawNumber(r.raw_data,'scrambling_pct');
export function HowProPlays({ data }: {data:{player:Stats|null;rows:Stats[]}}) {
  if(!data.player)return null;
  const specs:[string,(r:Stats)=>number|null,string][]=[['Driving distance',r=>r.driving_distance,'yds'],['Fairways hit',r=>r.driving_accuracy,'%'],['Greens in reg.',r=>r.greens_in_reg,'%'],['Putts per round',r=>r.putting_average,''],['Scrambling',scrambling,'%']];
  const bars=specs.flatMap(([label,get,unit])=>{const value=data.player?get(data.player):null,values=data.rows.map(get).filter((v):v is number=>v!=null);if(value==null||!values.length)return [];return [{label,value,average:values.reduce((a,b)=>a+b,0)/values.length,max:Math.max(...values,value)*1.1,unit,rank:1+values.filter(v=>label==='Putts per round'?v<value:v>value).length}];});
  if(!bars.length)return null;
  return <section className="pro-profile-section"><div className="pro-profile-heading"><h2>HOW HE PLAYS</h2><span className="pro-profile-source">From the tour</span></div><div className="pro-profile-card"><div className="pro-profile-bars">{bars.map(b=><div key={b.label}><div className="pro-profile-bar-label"><span>{b.label}</span><span><b>{b.value.toFixed(b.unit?'0':1)}{b.unit==='%'?'%':` ${b.unit}`}</b> · tour {b.average.toFixed(b.unit?'0':1)}</span></div><div className="pro-profile-track"><i style={{width:`${b.value/b.max*100}%`}}/><u style={{left:`${b.average/b.max*100}%`}}/></div></div>)}</div><div className="pro-profile-ranks">{bars.map(b=><span key={b.label}>#{b.rank} · {b.label}</span>)}</div></div></section>;
}
export function useLinkedProLive(playerId:string){return useQuery({queryKey:['pro-profile','live',playerId],enabled:!!playerId,staleTime:30_000,refetchInterval:60_000,queryFn:async()=>{
  const {data,error}=await supabase.from('sr_leaderboards').select('tournament_id,position,position_tied,score,thru,today,tournament:sr_tournaments!inner(name,status,current_round,venue_course_name,venue_name)').eq('player_id',playerId).eq('tournament.status','inprogress').limit(1).maybeSingle();if(error)throw error;
  if(!data)return null;
  const {data:holes,error:holeError}=await supabase.from('sr_scorecards').select('hole_number,round_number,score_to_par').eq('tournament_id',data.tournament_id).eq('player_id',playerId).order('hole_number');if(holeError)throw holeError;
  return {...data,holes:holes??[]};
}});}
export function LinkedLiveCard({data,playerId,name,tour}:{data:NonNullable<ReturnType<typeof useLinkedProLive>['data']>;playerId:string;name:string;tour:string}){
  const [open,setOpen]=useState(false);
  return <section className="pro-profile-section"><div className="pro-profile-heading"><h2>THIS WEEK</h2><span className="pro-profile-source">From the tour</span></div><div className="pro-profile-card"><span className="pro-profile-kicker pro-profile-up">LIVE · {tour.toUpperCase()}</span><h3>{data.tournament.name}</h3><div className="pro-profile-venue">{data.tournament.venue_course_name??data.tournament.venue_name} · Round {data.tournament.current_round}</div><div className="pro-profile-live-position"><div><strong>{data.position_tied?'T':''}{data.position??'—'}</strong><small>Thru {data.thru??'—'}</small></div><div className="pro-profile-live-score"><b className={(data.score??0)<0?'pro-profile-under':''}>{scoreLabel(data.score)}</b><span>Today <em className={(data.today??0)<0?'pro-profile-under':''}>{scoreLabel(data.today)}</em></span></div></div><div className="pro-profile-holes">{Array.from({length:18},(_,i)=>{const hole=data.holes.find(h=>h.hole_number===i+1&&h.round_number===data.tournament.current_round);return <i key={i} data-tone={hole?.score_to_par==null?'empty':hole.score_to_par<0?'under':hole.score_to_par>0?'over':'par'}/>;})}</div><Button className="pro-profile-command" onClick={()=>setOpen(true)}>Follow his round, shot by shot</Button></div><ScorecardSheet open={open} onClose={()=>setOpen(false)} tournamentId={data.tournament_id} target={{playerId,playerName:name,position:data.position,positionTied:data.position_tied,total:data.score,today:data.today,thru:data.thru}}/></section>;
}