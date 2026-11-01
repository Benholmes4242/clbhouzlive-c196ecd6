/** IF1 connected-only presentation owns local groups and elapsed reminder gates.
 * No amber. Shared invitable order, RPC/share authority and unconnected sheet
 * stay independent. Duplicate hook subscribers share React Query's read cache. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useProfileData } from '@/hooks/useProfileData';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFriendLeaderboard, useSentInvites, whsKeys } from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite, shareInvitesBulk, firstName } from '@/lib/whs/share';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { displayName } from '@/lib/whs/utils/initials';
import { getInitialsFromName } from '@/lib/avatarFallback';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { toast } from '@/lib/toast';
import { useInvitableFriends } from './useInvitableFriends';
import { groupInviteFriends, inviteCanRemind, invitePendingMeta, inviteRelative } from './inviteSheetRules';
import './inviteConnected.css';

type Generic = { ok:boolean; share_url?:string; share_message?:string } | null;
export function ConnectedInviteState({ownerUserId,source,createGeneric}:{ownerUserId:string;source:string;createGeneric:(source:string)=>Promise<Generic>}) {
  const {t}=useTranslation('common');const queryClient=useQueryClient();const {profile}=useProfileData();
  const {invitable,pending,invited,alreadyFor,invitedTotal}=useInvitableFriends(ownerUserId);
  const friendsRead=useFriendLeaderboard(ownerUserId);const sentRead=useSentInvites();
  const [q,setQ]=useState('');const debouncedQ=useDebouncedValue(q,200);const [bulkBusy,setBulkBusy]=useState(false);const [shareBusy,setShareBusy]=useState(false);
  const homeClub=profile?.home_club?.trim() || null;
  const groups=useMemo(()=>groupInviteFriends(pending,invited,homeClub,alreadyFor,debouncedQ),[pending,invited,homeClub,alreadyFor,debouncedQ]);
  const friendsUnknown=friendsRead.isLoading || friendsRead.isError;const sentUnknown=sentRead.isLoading || sentRead.isError;
  const figures=[{key:'pending',value:friendsUnknown||sentUnknown?null:pending.length,label:'To invite'},{key:'invited',value:friendsUnknown||sentUnknown?null:invitedTotal,label:'Invited'},{key:'joined',value:sentUnknown?null:(sentRead.data??[]).filter(row=>row.status==='redeemed').length,label:'Joined'}];
  const viewed=useRef(false);useEffect(()=>{if(viewed.current)return;viewed.current=true;analyticsEvents.track('invite_sheet_viewed',{source,connected:true,friends:invitable.length,invited:invitedTotal});},[source,invitable.length,invitedTotal]);
  useEffect(()=>{if(debouncedQ.trim())analyticsEvents.track('invite_searched',{query_length:debouncedQ.trim().length,results:groups.club.length+groups.playing.length+groups.invited.length});},[debouncedQ]);
  const inviteAll=useCallback(async()=>{
    if(bulkBusy || !pending.length)return;setBulkBusy(true);const successful:Parameters<typeof shareInvitesBulk>[0]=[];let failed=0;
    try {
      for(const friend of pending){
        if(friend.friend_passport_id==null){failed++;continue;}
        try {const result=await callCreateInvite(friend.friend_passport_id,'copy_link');if(!result.ok||!result.share_url){failed++;continue;}
          successful.push({share_url:result.share_url,share_message:result.share_message??'',invitee_name:result.invitee_name??friend.friend_name});
          analyticsEvents.track('invite_sent',{source,kind:'friend',is_reshare:false,bulk:true});
        }catch{failed++;}
      }
      if(successful.length)await shareInvitesBulk(successful);
      if(failed)toast.error(`Couldn't create ${failed} ${failed===1?'invite':'invites'}.`);
    }finally{void queryClient.invalidateQueries({queryKey:whsKeys.sentInvites()});setBulkBusy(false);}
  },[bulkBusy,pending,source,queryClient]);
  const generic=async()=>{if(shareBusy)return;setShareBusy(true);try{const res=await createGeneric(source);if(!res?.ok||!res.share_url){toast.error(t('invite.toast.createFailed'));return;}analyticsEvents.track('invite_sent',{source,kind:'generic',is_reshare:false});await shareInvite({share_url:res.share_url,share_message:res.share_message??res.share_url,invitee_name:'a friend'});}finally{setShareBusy(false);}};
  return <div className="if1"><div className="if1-head"><h2 id="invite-friends-title" className="if1-title">Golf's better with your circle.</h2><div className="if1-context">{invitable.length} of your England Golf friends {invitable.length===1?"isn't":"aren't"} on clbhouz yet. When they join, their rounds sit next to yours.</div><div className="if1-stats">{figures.map(f=><div className="if1-stat" key={f.key} data-invite-figure={f.key}><b data-unknown={f.value==null}>{f.value??'–'}</b><span>{f.label}</span></div>)}</div><div className="if1-actions">{pending.length>0?<Button variant="ghost" className="if1-bulk" onClick={()=>void inviteAll()} disabled={bulkBusy||friendsUnknown||sentUnknown}>{bulkBusy?'Inviting…':`Invite all ${pending.length}`}</Button>:null}<Button variant="ghost" className="if1-share" onClick={()=>void generic()} disabled={shareBusy}>Share link</Button></div>{invitable.length>0?<div className="if1-search"><Search size={17}/><input type="search" value={q} onChange={event=>setQ(event.target.value)} placeholder={t('invite.searchPlaceholder')} aria-label={t('invite.searchPlaceholder')}/></div>:null}</div><div className="if1-scroll">{invitable.length===0?<div className="if1-empty">{t('invite.emptyFriends')}</div>:groups.club.length+groups.playing.length+groups.invited.length===0?<div className="if1-empty">{t('invite.noMatch')}</div>:<>{homeClub?<InviteGroup label={`From ${homeClub}`} kind="club" rows={groups.club} alreadyFor={alreadyFor} source={source} bulkBusy={bulkBusy}/>:null}<InviteGroup label="Playing most" kind="playing" rows={groups.playing} alreadyFor={alreadyFor} source={source} bulkBusy={bulkBusy}/><InviteGroup label="Invited" kind="invited" rows={groups.invited} alreadyFor={alreadyFor} source={source} bulkBusy={bulkBusy}/></>}</div></div>;
}
function InviteGroup({label,kind,rows,alreadyFor,source,bulkBusy}:{label:string;kind:string;rows:FriendLeaderboardEntry[];alreadyFor:(friend:FriendLeaderboardEntry)=>{created_at:string}|undefined;source:string;bulkBusy:boolean}) {
  if(!rows.length)return null;
  return <section data-invite-group={kind}><div className="if1-group-title"><span>{label}</span><span>{rows.length}</span></div><div>{rows.map(friend=><InviteRow key={friend.friend_passport_id} friend={friend} already={alreadyFor(friend)} clubGroup={kind==='club'} source={source} bulkBusy={bulkBusy}/>)}</div></section>;
}
function InviteRow({friend,already,clubGroup,source,bulkBusy}:{friend:FriendLeaderboardEntry;already?:{created_at:string};clubGroup:boolean;source:string;bulkBusy:boolean}) {
  const {t}=useTranslation('common');const queryClient=useQueryClient();const [busy,setBusy]=useState(false);const shown=displayName(friend.friend_name);const meta=invitePendingMeta(friend,clubGroup);const remind=already?inviteCanRemind(already.created_at):false;
  const onInvite=async()=>{if(busy||bulkBusy)return;if(friend.friend_passport_id==null){toast.error(t('invite.toast.missingId'));return;}setBusy(true);try{const res=await callCreateInvite(friend.friend_passport_id,'copy_link');if(!res.ok||!res.share_url){toast.error(res.message??t('invite.toast.createFailed'));return;}analyticsEvents.track('invite_sent',{source,kind:'friend',is_reshare:!!already});void queryClient.invalidateQueries({queryKey:whsKeys.sentInvites()});await shareInvite({share_url:res.share_url,share_message:res.share_message??'',invitee_name:res.invitee_name??friend.friend_name});}finally{setBusy(false);}};
  return <div className="if1-row" data-invite-friend={friend.friend_passport_id}><SquircleAvatar size={40} className="if1-avatar" hairlineRing src={pickAvatarSrc(friend.friend_thumbnail_url,friend.friend_profile_photo_url)} alt={shown} fallback={getInitialsFromName(shown)} userId={friend.friend_user_id??friend.friend_row_id??String(friend.friend_passport_id)}/><div className="if1-person"><span className="if1-name">{shown}</span><span className="if1-meta">{already?`Invited ${inviteRelative(already.created_at)}`:<>{meta.text}{meta.fall?<>{meta.text?' · ':''}<span className="if1-fall">▾{meta.fall}</span></>:null}</>}</span></div>{already&&!remind?<span className="if1-sent">Sent</span>:<Button variant="ghost" className="if1-invite" onClick={()=>void onInvite()} disabled={busy||bulkBusy} aria-label={`${remind?'Remind':'Invite'} ${firstName(friend.friend_name)}`}>{remind?'Remind':'Invite'}</Button>}</div>;
}