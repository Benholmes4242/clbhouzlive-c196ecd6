/** Sheet-life cache: one member-round read and one course hydration; business
 * identity is resolved through business_accounts.club_id, never actor id as club. */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ActiveActor } from '@/types/actor';
import type { CourseTagRow } from '../lib/postFlowRules';
const columns = 'id, name, country, sub_country, thumbnail_image';
const toCourse = (c: { id:string; name:string; country:string|null; sub_country:string|null; thumbnail_image:string|null }): CourseTagRow => ({id:c.id,name:c.name,country:c.country,sub_country:c.sub_country,thumbnail:c.thumbnail_image});
export function usePostCourseGroups(open: boolean, userId: string | null | undefined, actor?: ActiveActor | null) {
  const memberCache = useRef(new Map<string,Promise<CourseTagRow[]>>());
  const clubCache = useRef(new Map<string,Promise<CourseTagRow[]>>());
  const [member,setMember] = useState<{key:string;rows:CourseTagRow[]} | null>(null);
  const [club,setClub] = useState<{key:string;rows:CourseTagRow[]} | null>(null);
  useEffect(() => {
    if (!open || !userId) return;
    let live = true;
    let read = memberCache.current.get(userId);
    if (!read) {
      read = (async () => {
        const {data,error} = await supabase.from('gam_round_stats').select('course_id, play_date').eq('user_id',userId).order('play_date',{ascending:false});
        if(error) return [];
        const dates = new Map<string,string>();
        for(const r of data ?? []) if(r.course_id && r.play_date && !dates.has(r.course_id)) dates.set(r.course_id,r.play_date);
        const ids = [...dates.keys()].slice(0,5); if(!ids.length) return [];
        const res = await supabase.from('golf_courses').select(columns).in('id',ids);
        if(res.error) return [];
        const byId = new Map((res.data ?? []).map(c => [c.id,{...toCourse(c),playedAt:dates.get(c.id)}]));
        return ids.flatMap(id => {const row=byId.get(id);return row?[row]:[];});
      })().catch(()=>[]);
      memberCache.current.set(userId,read);
    }
    void read.then(rows => {if(live) setMember({key:userId,rows});});
    return () => {live=false;};
  },[open,userId]);
  const isClub = actor?.type === 'business' && actor.meta?.category === 'Golf Club';
  const clubKey = isClub ? actor?.id : null;
  useEffect(() => {
    if(!open || !clubKey) return;
    let live=true; let read=clubCache.current.get(clubKey);
    if(!read) {
      read=(async()=>{
        const {data,error}=await supabase.from('business_accounts').select('club_id').eq('id',clubKey).maybeSingle();
        if(error || !data?.club_id) {console.warn('[post-flow] Golf Club business has no readable club_id link:',clubKey);return [];}
        const res=await supabase.from('golf_courses').select(columns).eq('club_id',data.club_id).order('name');
        if(res.error) return [];
        if(!res.data?.length) console.warn('[post-flow] Golf Club link has no readable courses:',clubKey);
        return (res.data ?? []).map(c=>({...toCourse(c),isHomeClub:true}));
      })().catch(()=>[]);clubCache.current.set(clubKey,read);
    }
    void read.then(rows=>{if(live)setClub({key:clubKey,rows});});return()=>{live=false;};
  },[open,clubKey]);
  return { member: member && userId && member.key === userId ? member.rows : [], club: clubKey && club && club.key === clubKey ? club.rows : [] };
}