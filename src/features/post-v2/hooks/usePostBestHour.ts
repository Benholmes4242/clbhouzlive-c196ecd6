/** One read per actor per Schedule opening. Error/no rows remove the card,
 * including stale successful data; identity changes never share hour rows. */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ActiveActor } from '@/types/actor';
import type { BestHourRow } from '../lib/postFlowRules';
export function usePostBestHour(open:boolean,actor?:ActiveActor|null) {
  const cache=useRef(new Map<string,Promise<BestHourRow[]>>());
  const [state,setState]=useState<{key:string;rows:BestHourRow[]} | null>(null);
  const key=actor?`${actor.type}:${actor.id}`:null;
  useEffect(()=>{
    if(!open) {cache.current.clear();return;}
    if(!actor || !key)return;
    let live=true;let read=cache.current.get(key);
    if(!read){
      read=(async()=>{try{const {data,error}=await supabase.rpc('get_post_best_hour',{p_actor_type:actor.type,p_actor_id:actor.id,p_tz:Intl.DateTimeFormat().resolvedOptions().timeZone});return error?[]:data??[];}catch{return [];}})();
      cache.current.set(key,read);
    }
    setState(null);void read.then(rows=>{if(live)setState({key,rows});});return()=>{live=false;};
  },[open,key,actor?.type,actor?.id]);
  return state?.key===key?state.rows:[];
}