/** Signed-off post tagger. Ordered selections are never pinned or re-ranked;
 * each row keeps its source metadata. Single-select still commits on tap. */
import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { ActiveActor } from '@/types/actor';
import BottomSheet from './BottomSheet';
import { PostCoursePhoto, PostFlowHeader } from './PostFlowChrome';
import type { StageCourse } from '../hooks/useStageComposer';
import { usePopularCourses } from '../hooks/usePopularCourses';
import { usePostCourseGroups } from '../hooks/usePostCourseGroups';
import { useCourseSearchPlaceholder } from '../hooks/useCourseCatalogueCount';
import { dedupeGroups, nameParts, rankCourseSearch, type CourseTagRow } from '../lib/postFlowRules';
import useKeyboardHeight from '@/hooks/messaging/useKeyboardHeight';
import '@/styles/post-flow.css';
interface Props { open:boolean; onClose:()=>void; onDone:(selected:StageCourse[])=>void; selected:StageCourse[]; userId?:string|null; actor?:ActiveActor|null; title?:string; selectionMode?:'single'|'multi' }
export default function CourseTagSheet({open,onClose,onDone,selected,userId,actor,title,selectionMode='multi'}:Props) {
  const {t}=useTranslation('composer');
  const [q,setQ]=useState(''); const [rows,setRows]=useState<CourseTagRow[]>([]); const [searching,setSearching]=useState(false);
  const [draft,setDraft]=useState<StageCourse[]>(selected);
  const {rows:popular,loaded}=usePopularCourses(open); const groups=usePostCourseGroups(open,userId,actor);
  const placeholder=useCourseSearchPlaceholder(open); const keyboardHeight=useKeyboardHeight();
  useEffect(()=>{if(open){setDraft(selected);setQ('');}},[open]);
  useEffect(()=>{
    if(!open)return;let live=true;
    const timer=setTimeout(async()=>{
      if(!q.trim()){setRows([]);setSearching(false);return;}
      setSearching(true);
      const escaped=q.trim().replace(/[\\%_,().]/g,' ');
      try {
        const {data,error}=await supabase.from('golf_courses').select('id, name, country, sub_country, thumbnail_image')
          .or(`name.ilike.%${escaped}%,sub_country.ilike.%${escaped}%`).limit(50);
        if(live)setRows(error?[]:(data??[]).map(c=>({id:c.id,name:c.name,country:c.country,sub_country:c.sub_country,thumbnail:c.thumbnail_image})));
      }catch{if(live)setRows([]);}finally{if(live)setSearching(false);}
    },180);return()=>{live=false;clearTimeout(timer);};
  },[q,open]);
  const played=useMemo(()=>new Map(groups.member.flatMap(c=>c.playedAt?[[c.id,c.playedAt] as const]:[])),[groups.member]);
  const idle=dedupeGroups([groups.club,groups.member,popular.map(c=>({...c,thumbnail:c.thumbnail_image}))]);
  const results=rankCourseSearch(rows,q,played); const selectedIds=new Set(draft.map(c=>c.id));
  const toggle=(c:StageCourse)=>{if(selectionMode==='single'){onDone([c]);onClose();return;}setDraft(cur=>cur.some(x=>x.id===c.id)?cur.filter(x=>x.id!==c.id):[...cur,c]);};
  const labels=['yourClub','yourCourses','popular'];
  return <BottomSheet open={open} onClose={onClose} bottomOffset={keyboardHeight} fixedHeight="85dvh" surfaceClassName="pf-sheet">
    <div className="pf" style={{display:'flex',flexDirection:'column',height:'100%',minHeight:0}}>
      <PostFlowHeader title={title??t('postFlow.tagCourse')} onClose={onClose}/>
      <div className="pf-search"><Search size={16}/><input autoFocus aria-label={t('postFlow.searchAny')} value={q} onChange={e=>setQ(e.target.value)} placeholder={placeholder}/></div>
      <div className="pf-scroll">
        {!q.trim()?idle.map((group,i)=>group.length>0?<section key={labels[i]} data-course-group={labels[i]}><div className="pf-group"><span>{t(`postFlow.${labels[i]}`)}</span><span>{i===1?t('postFlow.fromRounds'):''}</span></div>{group.map(c=><CourseRow key={c.id} row={c} selected={selectedIds.has(c.id)} query="" onToggle={toggle}/>)}</section>:null):<section data-course-group="results">
          <div className="pf-group"><span>{t('postFlow.results')}</span><span>{t('postFlow.resultCount',{count:results.length})}</span></div>
          {results.map(c=><CourseRow key={c.id} row={c} selected={selectedIds.has(c.id)} query={q} onToggle={toggle}/>)}
          {searching&&<div role="status" className="pf-empty">{t('postFlow.searching')}</div>}
          <div className="pf-empty">{t('postFlow.searchHint')}</div>
        </section>}
        {!q.trim()&&!loaded&&<div role="status" className="pf-empty">{t('postFlow.searching')}</div>}
      </div>
      {selectionMode!=='single'&&<div className="pf-footer"><span className="pf-selected"><b>{t('postFlow.selected',{count:draft.length})}</b>{draft[0]&&<> · {draft[0].name}</>}</span><Button variant="ghost" className="pf-pill" onClick={()=>{onDone(draft);onClose();}}>{t('postFlow.done')}</Button></div>}
    </div>
  </BottomSheet>;
}
function CourseRow({row,selected,query,onToggle}:{row:CourseTagRow;selected:boolean;query:string;onToggle:(c:StageCourse)=>void}) {
  const {t}=useTranslation('composer');const locality=row.isHomeClub?t('postFlow.homeClub'):[row.sub_country,row.country].filter(Boolean).join(' · ');
  return <Button variant="ghost" className="pf-course-row" data-course={row.id} aria-pressed={selected} onClick={()=>onToggle(row)}>
    <PostCoursePhoto course={row}/><span style={{minWidth:0}}><span className="pf-course-name">{nameParts(row.name,query).map((p,i)=>p.hit?<mark key={i}>{p.text}</mark>:<span key={i}>{p.text}</span>)}</span>
      <span className="pf-course-sub">{row.playedAt&&<><span className="pf-played">{t('postFlow.played',{date:format(new Date(`${row.playedAt.slice(0,10)}T12:00:00`),'d MMM')})}</span>{locality?' · ':''}</>}{locality}</span></span>
    <span className={`pf-check ${selected?'pf-check-on':''}`}>{selected&&<Check size={13} strokeWidth={3.4}/>}</span>
  </Button>;
}
