/** Verified tour-pro caller owns eligibility. Each collection fails closed on
 * its own read; business resolution only qualifies links, never invents names.
 * Career waits for both sources and derives read-only entries from OWGR.
 * Empty collections are absent for every viewer; ProOwnerSections owns their
 * completion doors via an optional controlled panel, preserving standalone
 * sheet state. Career's header alone owns Add/Edit; its timeline stays intact. */
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {getGuestUser} from '@/features/guest/guestGateStore';
import {careerEntries,orderedBag,orderedPartners} from './proCollectionRules';
import type {ProEvent} from './proProfileRules';
import {useProBag,useProPartners,useProCareer,useProBusinesses} from './useProCollections';
import {ProCollectionSheet,ProBusinessLogo,type CollectionPanel} from './ProCollectionSheets';
import {openExternalUrl} from '@/utils/median/openExternalUrl';
export function ProCollectionSections({userId,owner,first,events,eventsReady,showCareer=true,panel:controlledPanel,onPanelChange}:{userId:string;owner:boolean;first:string;events:ProEvent[];eventsReady:boolean;showCareer?:boolean;panel?:CollectionPanel|null;onPanelChange?:(panel:CollectionPanel|null)=>void}){
 const bagQuery=useProBag(userId),partnerQuery=useProPartners(userId),careerQuery=useProCareer(userId);
 const canEdit=owner&&!getGuestUser();
 const bagReady=bagQuery.isSuccess&&!bagQuery.isError,partnersReady=partnerQuery.isSuccess&&!partnerQuery.isError,careerReady=careerQuery.isSuccess&&!careerQuery.isError&&eventsReady;
 const bag=bagReady?orderedBag(bagQuery.data??[]):[],partners=partnersReady?orderedPartners(partnerQuery.data??[]):[],moments=careerReady?careerQuery.data??[]:[],entries=careerReady?careerEntries(events,moments):[];
 const businesses=useProBusinesses([...bag,...partners].flatMap(i=>i.business_id?[i.business_id]:[]));
 const liveBusinesses=new Map((businesses.isSuccess&&!businesses.isError?businesses.data??[]:[]).map(b=>[b.id,b]));
 const [localPanel,setLocalPanel]=useState<CollectionPanel|null>(null),navigate=useNavigate();
 const panel=onPanelChange?controlledPanel??null:localPanel,setPanel=onPanelChange??setLocalPanel;
 const header=(title:string,kind:CollectionPanel['kind'],editable=true)=><div className="pro-profile-heading"><h2>{title}</h2>{canEdit&&editable?<Button variant="ghost" className="pro-collection-edit" onClick={()=>setPanel({kind,mode:'list'})}>Edit</Button>:kind==='bag'&&!canEdit?<span className="pro-profile-source">Added by {first}</span>:null}</div>;
 return <>
 {bagReady&&bag.length>0&&<section data-pro-bag className="pro-profile-section">{header('IN THE BAG','bag',bag.length>0)} {<div className="pro-profile-card pro-bag">{bag.map(item=>{const business=item.business_id?liveBusinesses.get(item.business_id):null;const body=<><span className="pro-bag-slot">{item.slot.toUpperCase()}</span><span className="pro-bag-main"><b>{[item.brand,item.model].filter(Boolean).join(' ')}</b>{item.detail&&<small>{item.detail}</small>}</span>{business&&<span className="pro-bag-chevron">›</span>}</>;return business?<Button key={item.id} variant={null} size={null} className="pro-bag-row" onClick={()=>navigate(`/business/${business.id}`)}>{body}</Button>:<div key={item.id} className="pro-bag-row">{body}</div>;})}</div>}</section>}
 {partnersReady&&partners.length>0&&<section data-pro-partners className="pro-profile-section">{header('PARTNERS','partners',partners.length>0)}{<div className="pro-partner-grid">{partners.map(item=>{const business=item.business_id?liveBusinesses.get(item.business_id):null;return business?<Button key={item.id} variant={null} size={null} className="pro-partner-tile" onClick={()=>navigate(`/business/${business.id}`)}><ProBusinessLogo business={business}/><span>{business.name}</span></Button>:item.website?<Button key={item.id} variant={null} size={null} className="pro-partner-tile pro-partner-unlinked" onClick={()=>openExternalUrl(item.website!,'external')}><span>{item.name.toUpperCase()}</span></Button>:<div key={item.id} className="pro-partner-tile pro-partner-unlinked"><span>{item.name.toUpperCase()}</span></div>;})}</div>}</section>}
 {showCareer&&careerReady&&(entries.length>0||canEdit)&&<section data-pro-career className="pro-profile-section">{<div className="pro-profile-heading"><h2>CAREER</h2>{canEdit&&<Button variant="ghost" className="pro-collection-edit" onClick={()=>setPanel({kind:'career',mode:moments.length>0?'list':'edit'})}>{moments.length>0?'Edit':'Add'}</Button>}</div>}{entries.length>0&&<div className="pro-career-timeline">{entries.map((entry,index)=><div key={entry.id} data-career-entry data-win={entry.is_win} data-derived={entry.derived}>{(index===0||entries[index-1].year!==entry.year)&&<b data-career-year>{entry.year}</b>}<span>{entry.text}{entry.derived&&<small>From the world ranking</small>}</span></div>)}</div>}{canEdit&&entries.length===0&&<p className="pro-career-empty">Turning pro, amateur titles, tour cards. Wins show in gold.</p>}</section>}
 {canEdit&&panel&&<ProCollectionSheet panel={panel} setPanel={setPanel} userId={userId} bag={bag} partners={partners} moments={moments}/>}
 </>;
}