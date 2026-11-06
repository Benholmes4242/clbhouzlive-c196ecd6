/** Verified tour-pro caller owns eligibility. Each collection fails closed on
 * its own read; business resolution only qualifies links, never invents names.
 * Career waits for both sources and derives read-only entries from OWGR. */
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {getGuestUser} from '@/features/guest/guestGateStore';
import {careerEntries,orderedBag,orderedPartners} from './proCollectionRules';
import type {ProEvent} from './proProfileRules';
import {useProBag,useProPartners,useProCareer,useProBusinesses} from './useProCollections';
import {ProCollectionSheet,ProBusinessLogo,type CollectionPanel} from './ProCollectionSheets';
export function ProCollectionSections({userId,owner,first,events,eventsReady}:{userId:string;owner:boolean;first:string;events:ProEvent[];eventsReady:boolean}){
 const bagQuery=useProBag(userId),partnerQuery=useProPartners(userId),careerQuery=useProCareer(userId);
 const canEdit=owner&&!getGuestUser();
 const bagReady=bagQuery.isSuccess&&!bagQuery.isError,partnersReady=partnerQuery.isSuccess&&!partnerQuery.isError,careerReady=careerQuery.isSuccess&&!careerQuery.isError&&eventsReady;
 const bag=bagReady?orderedBag(bagQuery.data??[]):[],partners=partnersReady?orderedPartners(partnerQuery.data??[]):[],moments=careerReady?careerQuery.data??[]:[],entries=careerReady?careerEntries(events,moments):[];
 const businesses=useProBusinesses([...bag,...partners].flatMap(i=>i.business_id?[i.business_id]:[]));
 const liveBusinesses=new Map((businesses.isSuccess&&!businesses.isError?businesses.data??[]:[]).map(b=>[b.id,b]));
 const [panel,setPanel]=useState<CollectionPanel|null>(null),navigate=useNavigate();
 const header=(title:string,kind:CollectionPanel['kind'],editable=true)=><div className="pro-profile-heading"><h2>{title}</h2>{canEdit&&editable?<Button variant="ghost" className="pro-collection-edit" onClick={()=>setPanel({kind,mode:'list'})}>Edit</Button>:kind==='bag'&&!canEdit?<span className="pro-profile-source">Added by {first}</span>:null}</div>;
 const add=(kind:CollectionPanel['kind'],title:string,sub:string)=><div className="pro-profile-add pro-profile-dashed"><div><b>{title}</b><small>{sub}</small></div><Button className="pro-profile-command" onClick={()=>setPanel({kind,mode:'edit'})}>Add</Button></div>;
 return <>
 {bagReady&&(bag.length>0||canEdit)&&<section data-pro-bag className="pro-profile-section">{header('IN THE BAG','bag')} {bag.length>0?<div className="pro-profile-card pro-bag">{bag.map(item=>{const business=item.business_id?liveBusinesses.get(item.business_id):null;const body=<><span className="pro-bag-slot">{item.slot.toUpperCase()}</span><span className="pro-bag-main"><b>{[item.brand,item.model].filter(Boolean).join(' ')}</b>{item.detail&&<small>{item.detail}</small>}</span>{business&&<span className="pro-bag-chevron">›</span>}</>;return business?<Button key={item.id} variant={null} size={null} className="pro-bag-row" onClick={()=>navigate(`/business/${business.id}`)}>{body}</Button>:<div key={item.id} className="pro-bag-row">{body}</div>;})}</div>:add('bag',"Add what's in your bag",'Driver to ball. Brands on clbhouz link to their page.')}</section>}
 {partnersReady&&(partners.length>0||canEdit)&&<section data-pro-partners className="pro-profile-section">{header('PARTNERS','partners')}{partners.length>0?<div className="pro-partner-grid">{partners.map(item=>{const business=item.business_id?liveBusinesses.get(item.business_id):null;return business?<Button key={item.id} variant={null} size={null} className="pro-partner-tile" onClick={()=>navigate(`/business/${business.id}`)}><ProBusinessLogo business={business}/><span>{business.name}</span></Button>:<div key={item.id} className="pro-partner-tile pro-partner-unlinked"><span>{item.name.toUpperCase()}</span></div>;})}</div>:add('partners','Add your partners','Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.')}</section>}
 {careerReady&&(entries.length>0||canEdit)&&<section data-pro-career className="pro-profile-section">{header('CAREER','career',moments.length>0)}{entries.length>0&&<div className="pro-career-timeline">{entries.map((entry,index)=><div key={entry.id} data-career-entry data-win={entry.is_win} data-derived={entry.derived}>{(index===0||entries[index-1].year!==entry.year)&&<b data-career-year>{entry.year}</b>}<span>{entry.text}{entry.derived&&<small>From the world ranking</small>}</span></div>)}</div>}{canEdit&&add('career','Add a career moment','Turning pro, amateur titles, tour cards. Wins show in gold.')}</section>}
 {canEdit&&panel&&<ProCollectionSheet panel={panel} setPanel={setPanel} userId={userId} bag={bag} partners={partners} moments={moments}/>}
 </>;
}