import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
/**
 * Status-board drawer: open-only live/Health children share approved hooks.
 * Search mounts the Stage 3 overview only at two trimmed characters.
 * Settings is its own route since BRIEF_ADMIN_SETTINGS.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Inbox, Users, MapPin, BarChart3, ArrowLeft, Activity, Settings, Search, X, type LucideIcon } from 'lucide-react';
import { useCommandCentreV2 } from './hooks/useCommandCentreV2';
import { doNowTotal } from './lib/doNowTotal';
import type { PanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { useTriageCounts } from './hooks/useTriageCounts';
import { useMembersOverview } from './hooks/useMembersRadar';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { Button } from '@/components/ui/button';
import { formatAgo } from './lib/formatAgo';
import { LiveBoard, LiveCard, HealthNavStatus, StatusDot, type DrawerLive } from './AdminDrawerStatus';

interface NavItem { to: string; label: string; icon: LucideIcon; requireFull?: boolean; moderatorAllowed?: boolean; everyRole?: boolean; }
const GROUPS: { label: string; rows: NavItem[] }[] = [
  { label: 'Today', rows: [
    { to: '/admin-v2/dashboard', label: 'Command centre', icon: LayoutDashboard },
    { to: '/admin-v2/inbox', label: 'Inbox', icon: Inbox, moderatorAllowed: true },
  ] },
  { label: 'Members and golf', rows: [
    { to: '/admin-v2/users', label: 'Members', icon: Users },
    { to: '/admin-v2/content', label: 'Content', icon: MapPin },
    { to: '/admin-v2/analytics', label: 'Analytics', icon: BarChart3, requireFull: true },
  ] },
  { label: 'System', rows: [
    { to: '/admin-v2/health', label: 'Health', icon: Activity },
    { to: '/admin-v2/settings', label: 'Settings', icon: Settings, everyRole: true },
  ] },
];
const t = { canvas: 'var(--cc3-canvas)', surface: 'var(--cc3-surface)', ink: 'var(--cc3-ink)', inkMuted: 'var(--cc3-mute)', inkFaint: 'var(--cc3-faint)', line: 'var(--cc3-line)', hairline: 'var(--cc3-hair)', inset: 'var(--cc3-inset)', initials: 'var(--cc3-initials)', bad: 'var(--cc3-bad)' };
const pill: React.CSSProperties = { height: 20, padding: '0 6px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' };
interface Props { open: boolean; onClose: () => void; role: PanelRole; canManageAdmins: boolean; }
export default function AdminDrawer({ open, onClose, role, canManageAdmins }: Props) {
  const location = useLocation();
  const triage = useTriageCounts();
  const maintenance = useMaintenanceMode();
  const [query, setQuery] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) { setQuery(''); return; }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  const trimmed = query.trim();
  const canSearch = panelCan(role).viewUsers;
  const total = triage.data?.total ?? 0;
  const oldest = triage.data?.oldestCreatedAt;
  const hours = oldest ? Math.max(1, Math.floor((Date.now() - new Date(oldest).getTime()) / 3_600_000)) : null;
  const age = hours !== null && Number.isFinite(hours) ? (hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`) : null;
  const contents = (live?: DrawerLive, signals?: DrawerSignals) => <>
    {live && <LiveCard live={live} onClose={onClose} />}
    {canSearch && <label style={{ flexShrink: 0, marginTop: 10, height: 38, padding: '0 11px', borderRadius: 11, background: t.inset, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Search size={15} color={t.inkFaint} style={{ flexShrink: 0 }} />
      <input ref={searchInput} type="search" aria-label="Find a member" placeholder="Find a member" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', color: t.ink, fontSize: 13 }} />
      {query.length > 0 && <Button type="button" variant="ghost" onClick={e => { e.preventDefault(); setQuery(''); searchInput.current?.blur(); }} style={{ padding: 0, height: 'auto', background: 'transparent', color: t.inkFaint, fontSize: 11, fontWeight: 400 }}>Cancel</Button>}
    </label>}
    <nav aria-label="Admin sections" style={{ paddingTop: canSearch && trimmed.length >= 2 ? 6 : 0 }}>
      {canSearch && trimmed.length >= 2 ? <MemberResults query={trimmed} onClose={onClose} /> : GROUPS.map(group => {
        const rows = group.rows.filter(n => n.everyRole || (role === 'moderator' ? n.moderatorAllowed : !n.requireFull || canManageAdmins));
        if (!rows.length) return null;
        return <div key={group.label}>
          <div style={{ padding: '16px 10px 5px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint }}>{group.label}</div>
          {rows.map(item => {
            const [path] = item.to.split('?');
            const active = location.pathname.startsWith(path);
            const Icon = item.icon;
            return <Link key={item.to} to={item.to} onClick={onClose} aria-current={active ? 'page' : undefined} style={{ height: 40, padding: '0 10px', borderRadius: 11, display: 'grid', gridTemplateColumns: '16px minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center', background: active ? t.inset : 'transparent', color: active ? t.ink : t.inkMuted, textDecoration: 'none' }}>
              <Icon size={16} strokeWidth={2} color={active ? t.ink : t.inkFaint} />
              <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 600 }}>{item.label}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.inkFaint, whiteSpace: 'nowrap' }}>
                {item.label === 'Command centre' && signals && (signals.total > 0 ? <span><b style={{ color: t.ink, fontWeight: 700 }}>{signals.total}</b> to do</span> : <span>clear</span>)}
                {item.label === 'Members' && signals && <b style={{ color: t.ink, fontWeight: 700 }}>{signals.members}</b>}
                {item.label === 'Inbox' && !triage.isLoading && (total > 0 ? <>{age && <span style={{ color: t.inkFaint }}>oldest {age}</span>}<span style={{ ...pill, minWidth: 20, background: t.ink, color: t.canvas }}>{total}</span></> : <span style={{ color: t.inkFaint }}>Clear</span>)}
                {item.label === 'Analytics' && live && !live.isError && live.data?.now != null && <><StatusDot /><span style={{ color: t.inkFaint }}>{live.data.now} live</span></>}
                {item.label === 'Health' && canManageAdmins && <HealthNavStatus />}
                {item.label === 'Settings' && maintenance.on && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 6, color: t.bad, border: `1px solid color-mix(in srgb, ${t.bad} 35%, transparent)` }}>Maintenance on</span>}
              </span>
            </Link>;
          })}
        </div>;
      })}
    </nav>
  </>;
  return <>
    <div onClick={onClose} aria-hidden={!open} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.6)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .22s ease' }} />
    <aside className="admin-drawer-v3" role="dialog" aria-label="Admin navigation" aria-modal={open || undefined} aria-hidden={!open} style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 304, maxWidth: '100vw', zIndex: 100, background: t.surface, borderRight: `1px solid ${t.line}`, transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .26s cubic-bezier(0.22,1,0.36,1)', display: 'flex', flexDirection: 'column', paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)', color: t.ink, fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"tnum", "lnum"', lineHeight: 'normal', boxSizing: 'border-box' }}>
      {open && <>
        <div style={{ padding: '6px 12px 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div><div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.035em' }}>clbhouz</div><div style={{ marginTop: 1, fontSize: 11, color: t.inkFaint }}>Admin</div></div>
          <Button variant="ghost" size="icon" aria-label="Close menu" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 11, border: `1px solid ${t.line}`, color: t.inkMuted, background: 'transparent' }}><X className="!size-[16px]" /></Button>
        </div>
        <style>{`.admin-drawer-v3 input::placeholder { color: var(--cc3-faint); }
.admin-drawer-v3 input::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }
.admin-drawer-v3 .drawer-avatar > .relative > .absolute:first-child { background: var(--cc3-initials) !important; color: var(--cc3-mute); }
.admin-drawer-v3 [data-avatar-fallback] { font-size: 10.5px !important; font-weight: 700 !important; }`}</style>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 12px 10px', willChange: 'transform' }}>{canManageAdmins ? <FullAdminBoard>{contents}</FullAdminBoard> : contents()}</div>
        <DrawerFooter role={role} onClose={onClose} />
      </>}
    </aside>
  </>;
}
interface DrawerSignals { total: number; members: number; }
/** This open-only full-admin child owns the default-window observer; closed/limited/moderator drawers never request it. */
function FullAdminBoard({ children }: { children: (live: DrawerLive, signals?: DrawerSignals) => React.ReactNode }) {
  const q = useCommandCentreV2(7);
  const signals = !q.isLoading && !q.isError && q.data ? { total: doNowTotal(q.data.do_now), members: q.data.target.members } : undefined;
  return <LiveBoard>{live => children(live, signals)}</LiveBoard>;
}
function MemberResults({ query, onClose }: { query: string; onClose: () => void }) {
  const q = useMembersOverview();
  const needle = query.toLowerCase();
  const members = (q.data?.members ?? []).filter(m => [m.display_name, m.username, m.email].some(v => v?.toLowerCase().includes(needle)))
    .sort((a, b) => Number(b.display_name?.toLowerCase().startsWith(needle) ?? false) - Number(a.display_name?.toLowerCase().startsWith(needle) ?? false)).slice(0, 8);
  if (q.isLoading || q.isError) return <div role="status" style={{ padding: 10, color: t.inkFaint, fontSize: 12 }}>{q.isError ? 'Member search unavailable' : 'Finding members…'}</div>;
  if (!members.length) return <div style={{ padding: 10, color: t.inkFaint, fontSize: 12 }}>No member matches "{query}"</div>;
  return <>{members.map(m => <Link key={m.user_id} to={`/admin-v2/users?member=${encodeURIComponent(m.user_id)}`} onClick={onClose} style={{ padding: '7px 10px', borderRadius: 11, display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) auto', gap: 10, alignItems: 'center', color: t.ink, textDecoration: 'none' }}>
    <span aria-hidden="true" style={{ display: 'inline-flex' }}>
      <SquircleAvatar className="drawer-avatar" size={28} src={m.photo_url} userId={m.user_id} alt="" fallback={getInitialsFromName(m.display_name || m.username)} hairlineRing />
    </span>
    <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere', lineHeight: 1.25 }}><InlineProMemberName userId={m.user_id}>{m.display_name || m.username || 'Member'}</InlineProMemberName></span>{m.username && <span style={{ display: 'block', marginTop: 1, fontSize: 11, color: t.inkFaint, overflowWrap: 'anywhere' }}>@{m.username}</span>}</span>
    <span aria-hidden style={{ fontSize: 13, color: t.inkFaint }}>›</span>
  </Link>)}</>;
}
function DrawerFooter({ role, onClose }: { role: PanelRole; onClose: () => void }) {
  const { user } = useSupabaseSession();
  const me = useQuery({ queryKey: ['admin-v2', 'me'], staleTime: 600_000, enabled: !!user?.id, queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from('user_profiles').select('display_name, username').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return data;
  } });
  const name = me.data?.display_name || user?.email?.split('@')[0] || 'Admin';
  const initials = name.trim().split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase();
  const label = role === 'full' ? 'Full admin' : role === 'limited' ? 'Limited admin' : 'Moderator';
  return <footer style={{ flexShrink: 0, padding: '12px 12px max(24px, env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${t.hairline}` }}>
    <div style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center' }}>
      <span style={{ width: 30, height: 30, borderRadius: '34%', background: t.initials, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: t.inkMuted }}>{initials}</span>
      <span style={{ minWidth: 0, fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere', lineHeight: 1.25 }}>{name}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 6, border: `1px solid ${t.line}`, color: t.inkMuted }}>{label}</span>
    </div>
    <Button asChild variant="ghost" className="w-full" style={{ marginTop: 10, height: 38, borderRadius: 11, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink, fontSize: 12.5, fontWeight: 600 }}><Link to="/clubhouse" onClick={onClose}><ArrowLeft className="!size-[14px]" />Back to app</Link></Button>
    <div style={{ marginTop: 9, textAlign: 'center', fontSize: 10.5, color: t.inkFaint }}>Build <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{__BUILD_ID__}</span> · deployed {formatAgo(typeof __BUILD_STAMP__ === 'string' ? __BUILD_STAMP__ : null, { suffix: true })}</div>
  </footer>;
}
