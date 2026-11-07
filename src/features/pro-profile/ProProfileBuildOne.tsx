/** Verified tour-pro opt-in only. Reads live here, never inside shared hero;
 * each settled section expands independently and failures suppress stale data.
 * The profile runs itself: THIS WEEK is only the live tour card, and SEASON
 * and its hero cells exist only when he has events. */
import { useEffect, useRef, type ReactNode, type Ref } from 'react';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { HeroShell } from '@/components/profile/hero/HeroShell';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import type { ProMember } from '@/features/pro-verification/proMembersCache';
import { usePlayerSeasonResults } from '@/features/tourhub/player-v2/data/usePlayerData';
import { Button } from '@/components/ui/button';
import { useProEvents, useProWorldRank } from './useProProfile';
import { rankMovement, seasonSummary, tourEvents, finishLabel, finishPosition } from './proProfileRules';
import { ProSeasonSection } from './ProSeasonSection';
import { HowProPlays, LinkedLiveCard, useLinkedProLive, useLinkedProStats } from './LinkedProSections';
import {ProCollectionSections} from './ProCollectionSections';
import {ProAskSection} from './ProAskSection';
import { analyticsEvents } from '@/utils/analyticsEvents';
import './pro-profile.css';
export interface ProProfileProps { pro:ProMember;name:string;nameRef?:Ref<HTMLHeadingElement>;avatar?:string|null;cover?:string|null;owner:boolean;viewerId?:string;username?:string;friends?:number|null;onFriends?:()=>void;friendLabel?:string;friendBusy?:boolean;onFriend?:()=>void;businessViewer?:boolean;followers:number|null;followersReady:boolean;onFollowers:()=>void;onAvatar:()=>void;onEdit:()=>void;onShare:()=>void;onFollow:()=>void;following:boolean;followBusy:boolean;onMessage:()=>void;messageBusy:boolean;menu:ReactNode;onSeeAllResults?:()=>void }
export function ProProfileBuildOne(p:ProProfileProps){
  const id=p.pro.user_id,playerId=p.pro.pro_player_id??'',year=new Date().getUTCFullYear(),first=p.name.split(' ')[0]||p.name;
  const events=useProEvents(id),rank=useProWorldRank(id),tourResults=usePlayerSeasonResults(playerId,year),live=useLinkedProLive(playerId),stats=useLinkedProStats(playerId,year,p.pro.pro_tour_code??'pga');
  const {homeClub}=useProfileClubs(id,p.viewerId),{topTen}=useUserTopTenCourses(id);
  const linked=!!playerId,ready=linked?tourResults.isSuccess&&!tourResults.isError:events.isSuccess&&!events.isError;
  const rows=linked?tourEvents(tourResults.data??[],id):events.data??[],summary=seasonSummary(rows,year),movement=rankMovement(rank.isSuccess&&!rank.isError?rank.data:null);
  const rankReady=rank.isSuccess&&!rank.isError;
  const headline=rankReady&&(rank.data||ready&&summary.best)?<div className="pro-hero-headline"><strong>{rank.data?`#${rank.data.rank.toLocaleString('en-GB')}`:finishLabel(summary.best)}</strong><div><b>{rank.data?'WORLD RANKING':`BEST FINISH ${year}`}</b>{movement&&<p><span className={movement.improved?'pro-profile-up':'pro-profile-worse'}>{movement.improved?'▲':'▼'} {movement.difference}</span> {movement.period}</p>}</div></div>:null;
  const cover=p.cover||[...(topTen??[])].sort((a,b)=>a.position-b.position)[0]?.thumbnail_image||null;
  const names=p.name.trim().split(/\s+/),last=names.pop()??p.name;
  // pro_profile_viewed — once per mount, ref-guarded, never the owner. Guests
  // are tracked too (the guest split puts guest_id in props). The profile
  // page has no visit source today, so source is null.
  const viewedRef=useRef(false);
  useEffect(()=>{if(p.owner||viewedRef.current)return;viewedRef.current=true;void analyticsEvents.track('pro_profile_viewed',{pro_id:id,source:null});},[p.owner,id]);
  const identity=<><h1 ref={p.nameRef} className="pro-hero-name">{names.length>0&&`${names.join(' ')} `}<span className="pro-hero-surname">{last}<ProLabel size="large"/></span></h1><div className="pro-hero-profession">Tour professional</div>{(p.pro.pro_tour||homeClub?.name)&&<div className="pro-hero-club">{[p.pro.pro_tour,homeClub?.name].filter(Boolean).join(' · ')}</div>}</>;
  return <div className="pro-profile"><HeroShell coverUrl={cover} avatarSize={72} identityContent={identity} avatar={<SquircleAvatar size={72} hairlineRing src={p.avatar??undefined} alt={p.name} userId={id}/>} onAvatarTap={p.onAvatar} displayName={p.name} headlineContent={headline} counters={ready?[...(summary.events>0?[{key:'events',label:'EVENTS',value:summary.events},...(summary.top10s>0?[{key:'top10',label:'TOP 10S',value:summary.top10s}]:summary.best?[{key:'best',label:'BEST',value:finishPosition(summary.best),displayValue:<span className={finishLabel(summary.best)==='1st'?'pro-profile-gold':''}>{finishLabel(summary.best)}</span>}]:[])]:[]),{key:'followers',label:'FOLLOWERS',value:p.followersReady?p.followers:null,state:p.followersReady?'ok':'error',onTap:p.onFollowers},{key:'friends',label:'FRIENDS',value:p.followersReady?p.friends??null:null,state:p.followersReady?'ok':'error',onTap:p.onFriends}]:[]} footer={<div className={`pro-hero-actions ${!p.owner&&!p.businessViewer?'pro-hero-visitor':''}`}>{p.owner?<><Button variant={null} size={null} className="pro-profile-command" onClick={p.onEdit}>Edit profile</Button><Button variant={null} size={null} className="pro-profile-command pro-hero-secondary" onClick={p.onShare}>Share profile</Button></>:<><Button variant={null} size={null} className={`pro-profile-command ${p.following?'pro-hero-secondary':''}`} onClick={p.onFollow} disabled={p.followBusy}>{p.following?'Following':'Follow'}</Button>{!p.businessViewer&&<Button variant={null} size={null} className="pro-profile-command pro-hero-secondary" onClick={p.onFriend} disabled={p.friendBusy}>{p.friendLabel??'Add friend'}</Button>}<Button variant={null} size={null} className="pro-profile-command pro-hero-secondary" onClick={p.onMessage} disabled={p.messageBusy}>Message</Button></>}<div>{p.menu}</div></div>}/>
    {linked&&live.isSuccess&&!live.isError&&live.data&&<LinkedLiveCard data={live.data} playerId={playerId} name={p.name} tour={p.pro.pro_tour??'Tour'}/>}
    {ready&&rows.length>0&&<ProSeasonSection events={rows} year={year} first={first} linked={linked} scoring={stats.isSuccess&&!stats.isError?stats.data.player?.scoring_average:null} onSeeAll={p.onSeeAllResults}/>}
    {linked&&stats.isSuccess&&!stats.isError&&<HowProPlays data={stats.data}/>}
    <ProCollectionSections userId={id} owner={p.owner} first={first} events={events.data??[]} eventsReady={events.isSuccess&&!events.isError}/>
    <ProAskSection userId={id} owner={p.owner} first={first} viewerId={p.viewerId}/>
  </div>;
}
