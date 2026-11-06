/** Collection ordering and career derivation are shared by display/tests; OWGR
 * milestones use recorded event dates or year/week, never fabricated dates. */
import type {Database} from '@/integrations/supabase/types';
import {eventYear,finishLabel,finishPosition,formatWorldRank,type ProEvent} from './proProfileRules';
export type BagItem=Database['public']['Tables']['pro_bag_items']['Row'];
export type Partner=Database['public']['Tables']['pro_partners']['Row'];
export type CareerMoment=Database['public']['Tables']['pro_career_moments']['Row'];
export const BAG_SLOTS=['driver','fairway','hybrid','irons','wedges','putter','ball'] as const;
export const orderedBag=(rows:BagItem[])=>[...rows].sort((a,b)=>BAG_SLOTS.indexOf(a.slot as typeof BAG_SLOTS[number])-BAG_SLOTS.indexOf(b.slot as typeof BAG_SLOTS[number]) || a.sort-b.sort || a.created_at.localeCompare(b.created_at));
export const orderedPartners=(rows:Partner[])=>[...rows].sort((a,b)=>a.sort-b.sort || a.created_at.localeCompare(b.created_at));
export interface CareerEntry {id:string;year:number;text:string;is_win:boolean;derived:boolean;kind:number;order:string}
const eventKey=(e:ProEvent)=>e.start_date??`${e.owgr_year??0}-${String(e.owgr_week??0).padStart(2,'0')}`;
export function careerEntries(events:ProEvent[],moments:CareerMoment[]):CareerEntry[]{
 const eligible=events.filter(e=>e.source==='owgr'&&e.finish!=null&&eventYear(e)!=null).sort((a,b)=>eventKey(a).localeCompare(eventKey(b))||a.id.localeCompare(b.id));
 const entries:CareerEntry[]=moments.map(m=>({id:m.id,year:m.year,text:m.text,is_win:m.is_win,derived:false,kind:2,order:m.created_at}));
 const add=(e:ProEvent,kind:number,text:string,win=false)=>{const year=eventYear(e);if(year!=null)entries.push({id:`${kind}-${e.id}`,year,text,is_win:win,derived:true,kind,order:eventKey(e)});};
 const high=eligible.filter(e=>e.owgr_rank_after!=null).sort((a,b)=>Number(a.owgr_rank_after)-Number(b.owgr_rank_after)||eventKey(a).localeCompare(eventKey(b))||a.id.localeCompare(b.id))[0];
 if(high)add(high,0,`Career-high world ranking, #${formatWorldRank(high.owgr_rank_after)}, after ${high.event_name}`);
 eligible.filter(e=>finishPosition(e.finish)===1).forEach(e=>add(e,1,`Won ${e.event_name}`,true));
 eligible.filter(e=>[2,3].includes(finishPosition(e.finish)??0)).reverse().slice(0,5).forEach(e=>add(e,1,`${finishLabel(e.finish)}, ${e.event_name}`));
 const first=eligible[0];if(first)add(first,3,`First world ranking event, ${first.event_name}`);
 return entries.sort((a,b)=>b.year-a.year||a.kind-b.kind||b.order.localeCompare(a.order)||a.id.localeCompare(b.id));
}
export function bagPayload(userId:string,slot:string,brand:string,model:string,detail:string,businessId:string|null){
 if(!BAG_SLOTS.includes(slot as typeof BAG_SLOTS[number])||!brand.trim()||brand.trim().length>60||model.length>80||detail.length>80)throw Error('Check the club type and brand.');
 return{user_id:userId,slot,brand:brand.trim(),model:model.trim()||null,detail:detail.trim()||null,business_id:businessId};
}
export function partnerPayload(userId:string,name:string,businessId:string|null){if(!name.trim()||name.trim().length>60)throw Error('Enter a partner name.');return{user_id:userId,name:name.trim(),business_id:businessId};}
export function momentPayload(userId:string,year:number,text:string,isWin:boolean,currentYear=new Date().getFullYear()){if(!Number.isInteger(year)||year<1950||year>currentYear||!text.trim()||text.trim().length>120)throw Error('Check the year and career moment.');return{user_id:userId,year,text:text.trim(),is_win:isWin};}