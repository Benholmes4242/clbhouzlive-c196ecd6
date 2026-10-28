/** Account content owns no handicap reads or message previews. GlanceShell owns
 * modal lifecycle; PostingAsMenu owns actor routes, unread sources and logout.
 * Course analytics stays mounted outside the glance so close-before-open works.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { GlanceShell } from './GlanceShell';
import { analyticsEvents } from '@/utils/analyticsEvents';
import './account-glance.css';

export interface AccountActor { id: string; type: 'personal' | 'business'; name: string; avatarUrl?: string | null }
export interface AccountGlanceProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  currentActor: AccountActor;
  profiles: AccountActor[];
  onSwitchProfile: (id: string) => Promise<void> | void;
  onNavigate: (route: string) => void;
  viewProfileRoute: string;
  settingsRoute: string;
  categoryLabel?: string;
  isAdmin: boolean;
  countFor: (type: 'personal' | 'business', id: string) => number;
  unreadMessages: number;
  unreadNotifications: number;
  onOpenCourses: () => void;
  onInviteFriends: () => void;
}
function Count({ n, badge = false }: { n: number; badge?: boolean }) {
  return n > 0 ? <span className={`account-count${badge ? ' account-badge' : ''}`} aria-label={`${n} unread`}>{n > 99 ? '99+' : n}</span> : null;
}
function Face({ actor, size }: { actor: AccountActor; size: number }) {
  return <span aria-hidden="true" style={{ display: 'inline-flex', flexShrink: 0 }}><SquircleAvatar size={size} src={actor.avatarUrl} alt={actor.name} userId={actor.id} hairlineRing className="[&>div:first-child]:!aspect-square" /></span>;
}
export default function AccountGlance(props: AccountGlanceProps) {
  const { open, onClose, anchorRef, currentActor, profiles, onSwitchProfile, onNavigate, isAdmin, countFor } = props;
  const [listOpen, setListOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) analyticsEvents.track('profile_hub_sheet_opened', { actor_type: currentActor.type, is_admin: isAdmin });
    wasOpen.current = open;
    if (!open) { setListOpen(false); setConfirming(false); if (timer.current) clearTimeout(timer.current); }
  }, [open, currentActor.type, isAdmin]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  if (!open) return null;
  const others = profiles.filter(actor => actor.id !== currentActor.id || actor.type !== currentActor.type);
  const other = others[0];
  const total = others.reduce((sum, actor) => sum + countFor(actor.type, actor.id), 0);
  const switchTo = async (id: string) => {
    if (switching) return;
    setSwitching(true);
    setListOpen(false);
    try { await onSwitchProfile(id); } finally { setSwitching(false); }
  };
  const business = currentActor.type === 'business';
  const rows = business
    ? [{ label: 'Manage businesses', action: () => onNavigate('/businesses/manage') }, { label: 'Business settings', action: () => onNavigate(props.settingsRoute) }]
    : [{ label: 'Your courses', action: props.onOpenCourses }, { label: 'Invite friends', action: props.onInviteFriends }, { label: 'Manage businesses', action: () => onNavigate('/businesses/manage') }, { label: 'Settings', action: () => onNavigate(props.settingsRoute) }];
  const signOut = () => {
    if (confirming) { if (timer.current) clearTimeout(timer.current); setConfirming(false); onNavigate('/logout'); return; }
    setConfirming(true);
    timer.current = setTimeout(() => setConfirming(false), 4000);
  };
  return <GlanceShell label="Your account" anchorRef={anchorRef} onClose={onClose}>
    <div className="account-glance">
      <Button variant="ghost" className="account-button account-identity" onClick={() => onNavigate(props.viewProfileRoute)}>
        <span aria-hidden="true" style={{ display: 'inline-flex', flexShrink: 0 }}><SquircleAvatar size={44} src={currentActor.avatarUrl} alt={currentActor.name} userId={currentActor.id} ringWidth={1.5} ringColor="var(--account-amber)" className="[&>div:first-child]:!aspect-square" /></span>
        <span className="account-text"><span className="account-name">{currentActor.name}</span><span className="account-subline">{business ? `${props.categoryLabel ? `${props.categoryLabel} · ` : ''}View page` : 'View profile'}</span></span>
        <ChevronRight className="account-chevron" size={16} strokeWidth={2} />
      </Button>
      {profiles.length > 1 && other && <>
        <Button variant="ghost" className="account-button account-switch" aria-expanded={others.length > 1 ? listOpen : undefined} disabled={switching} onClick={() => others.length === 1 ? void switchTo(other.id) : setListOpen(v => !v)}>
          <span className="account-faces">{others.slice(0, 2).map(actor => <span key={`${actor.type}:${actor.id}`}><Face actor={actor} size={22} /></span>)}</span>
          <span className="account-switch-label">{others.length === 1 ? `Switch to ${other.name}` : 'Switch account'}</span><Count n={total} />
          {others.length > 1 && <ChevronDown className="account-chevron" size={15} strokeWidth={2} />}
        </Button>
        {listOpen && <div className="account-list">{others.map(actor => <Button key={`${actor.type}:${actor.id}`} variant="ghost" className="account-button account-actor" disabled={switching} onClick={() => void switchTo(actor.id)}><Face actor={actor} size={26} /><span className="account-actor-name">{actor.name}</span><Count n={countFor(actor.type, actor.id)} /></Button>)}</div>}
      </>}
      <div className="account-doors">
        <Button variant="ghost" className="account-button account-door" onClick={() => onNavigate('/messages')}><span className="account-door-icon"><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x={3} y={5} width={18} height={14} rx={2} /><path d="m3 7 9 6 9-6" /></svg><Count n={props.unreadMessages} badge /></span><span className="account-door-label">Messages</span></Button>
        <Button variant="ghost" className="account-button account-door" onClick={() => onNavigate('/notificationmessages')}><span className="account-door-icon"><Bell size={18} strokeWidth={1.9} /><Count n={props.unreadNotifications} badge /></span><span className="account-door-label">Notifications</span></Button>
      </div>
      <div className="account-rows">{rows.map(row => <Button key={row.label} variant="ghost" className="account-button account-row" onClick={row.action}><span className="account-row-label">{row.label}</span><ChevronRight className="account-chevron" size={16} strokeWidth={2} /></Button>)}
        {isAdmin && <Button variant="ghost" className="account-button account-row" onClick={() => onNavigate('/admin/command-center')}><span className="account-row-label">Command centre</span><span className="account-admin">ADMIN</span></Button>}
      </div>
      <div className="account-signout"><Button variant="ghost" className="account-button account-signout-button" onClick={signOut}>{confirming ? 'Tap again to confirm' : 'SIGN OUT'}</Button></div>
    </div>
  </GlanceShell>;
}