/**
 * Status-board drawer: open-only live/Health children share approved hooks.
 * Search mounts the Stage 3 overview only at two trimmed characters.
 * Settings keeps its Health-tab URL until BRIEF_ADMIN_SETTINGS ships.
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Inbox, Users, MapPin, BarChart3, ArrowLeft, Activity, Settings, Search, X, type LucideIcon } from 'lucide-react';
import { adminTheme as t } from './theme';
import type { PanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { useTriageCounts } from './hooks/useTriageCounts';
import { useMembersOverview } from './hooks/useMembersRadar';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
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
    { to: '/admin-v2/health?tab=settings', label: 'Settings', icon: Settings, everyRole: true },
  ] },
];
const pill: React.CSSProperties = { height: 22, padding: '0 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' };
interface Props { open: boolean; onClose: () => void; role: PanelRole; canManageAdmins: boolean; }
export default function AdminDrawer({ open, onClose, role, canManageAdmins }: Props) {
  const location = useLocation();
  const triage = useTriageCounts();
  const maintenance = useMaintenanceMode();
  const [query, setQuery] = useState('');
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
  const contents = (live?: DrawerLive) => <>
    {live && <LiveCard live={live} onClose={onClose} />}
    {canSearch && <label style={{ flexShrink: 0, margin: '12px 14px 0', height: 44, padding: '0 12px', borderRadius: 12, background: t.canvas, border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
      <Search size={16} color={t.inkFaint} style={{ flexShrink: 0 }} />
      <input type="search" aria-label="Find a member" placeholder="Find a member" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', color: t.ink, fontSize: 15, fontFamily: 'inherit' }} />
    </label>}
    <nav aria-label="Admin sections" style={{ flex: 1, minHeight: 0, padding: '6px 10px 10px', overflowY: 'auto', willChange: 'transform' }}>
      {canSearch && trimmed.length >= 2 ? <MemberResults query={trimmed} onClose={onClose} /> : GROUPS.map(group => {
        const rows = group.rows.filter(n => n.everyRole || (role === 'moderator' ? n.moderatorAllowed : !n.requireFull || canManageAdmins));
        if (!rows.length) return null;
        return <div key={group.label}>
          <div style={{ padding: '16px 12px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.inkFaint }}>{group.label}</div>
          {rows.map(item => {
            const [path, qs] = item.to.split('?');
            const onSettings = new URLSearchParams(location.search).get('tab') === 'settings';
            const active = location.pathname.startsWith(path) && (qs ? onSettings : !(path === '/admin-v2/health' && onSettings));
            const Icon = item.icon;
            return <Link key={item.to} to={item.to} onClick={onClose} aria-current={active ? 'page' : undefined} style={{ height: 46, padding: '0 12px', borderRadius: 12, display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr) auto', columnGap: 14, alignItems: 'center', background: active ? t.brandSoft : 'transparent', color: active ? t.brandText : t.ink, textDecoration: 'none' }}>
              <Icon size={18} strokeWidth={1.9} color={active ? t.brandText : t.inkMuted} />
              <span style={{ fontSize: 15, fontWeight: active ? 600 : 500 }}>{item.label}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, whiteSpace: 'nowrap' }}>
                {item.label === 'Inbox' && !triage.isLoading && (total > 0 ? <>{age && <span style={{ color: t.warnText }}>oldest {age}</span>}<span style={{ ...pill, minWidth: 22, background: t.brand, color: t.surface }}>{total}</span></> : <span style={{ color: t.inkFaint }}>Clear</span>)}
                {item.label === 'Analytics' && live && !live.isError && live.data?.now != null && <><StatusDot /><span style={{ color: t.okText }}>{live.data.now} live</span></>}
                {item.label === 'Health' && canManageAdmins && <HealthNavStatus />}
                {item.label === 'Settings' && maintenance.on && <span style={{ ...pill, background: t.dangerSoft, color: t.dangerText }}>Maintenance on</span>}
              </span>
            </Link>;
          })}
        </div>;
      })}
    </nav>
  </>;
  return <>
    <div onClick={onClose} aria-hidden={!open} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.6)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .22s ease' }} />
    <aside role="dialog" aria-label="Admin navigation" aria-modal={open || undefined} aria-hidden={!open} style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 304, maxWidth: '100vw', zIndex: 100, background: t.surface, borderRight: `1px solid ${t.line}`, transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .26s cubic-bezier(0.22,1,0.36,1)', display: 'flex', flexDirection: 'column', paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)', color: t.ink, fontVariantNumeric: 'tabular-nums', boxSizing: 'border-box' }}>
      {open && <>
        <div style={{ padding: '10px 10px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div><div style={{ fontSize: 19, fontWeight: 700 }}>clbhouz</div><div style={{ marginTop: 1, fontSize: 12, color: t.inkFaint }}>Command centre</div></div>
          <Button variant="ghost" size="icon" aria-label="Close menu" onClick={onClose} style={{ width: 44, height: 44, borderRadius: 12, color: t.inkMuted, background: 'transparent' }}><X className="!size-[18px]" /></Button>
        </div>
        {canManageAdmins ? <LiveBoard>{contents}</LiveBoard> : contents()}
        <DrawerFooter role={role} onClose={onClose} />
      </>}
    </aside>
  </>;
}
function MemberResults({ query, onClose }: { query: string; onClose: () => void }) {
  const q = useMembersOverview();
  const needle = query.toLowerCase();
  const members = (q.data?.members ?? []).filter(m => [m.display_name, m.username, m.email].some(v => v?.toLowerCase().includes(needle)))
    .sort((a, b) => Number(b.display_name?.toLowerCase().startsWith(needle) ?? false) - Number(a.display_name?.toLowerCase().startsWith(needle) ?? false)).slice(0, 8);
  if (q.isLoading || q.isError) return <div role="status" style={{ padding: '16px 12px', color: t.inkFaint, fontSize: 13 }}>{q.isError ? 'Member search unavailable' : 'Finding members…'}</div>;
  if (!members.length) return <div style={{ padding: '16px 12px', color: t.inkFaint, fontSize: 13 }}>No member matches "{query}"</div>;
  return <>{members.map(m => <Link key={m.user_id} to={`/admin-v2/users?member=${encodeURIComponent(m.user_id)}`} onClick={onClose} style={{ height: 52, padding: '0 12px', display: 'grid', gridTemplateColumns: '32px minmax(0, 1fr)', gap: 12, alignItems: 'center', color: t.ink, textDecoration: 'none' }}>
    <span aria-hidden="true" style={{ display: 'inline-flex' }}>
      <SquircleAvatar size={32} src={m.photo_url} userId={m.user_id} alt="" hairlineRing />
    </span>
    <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.display_name || m.username || 'Member'}</span>{m.username && <span style={{ display: 'block', fontSize: 12, color: t.inkFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{m.username}</span>}</span>

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
  const background = role === 'full' ? t.okSoft : role === 'limited' ? t.warnSoft : t.neutralSoft;
  const color = role === 'full' ? t.okText : role === 'limited' ? t.warnText : t.inkMuted;
  return <footer style={{ flexShrink: 0, padding: '14px 14px max(30px, env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${t.line}` }}>
    <div style={{ display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center' }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: t.neutralSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: t.brand }}>{initials}</span>
      <span style={{ minWidth: 0, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ ...pill, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', background, color }}>{label}</span>
    </div>
    <Button asChild variant="ghost" className="w-full" style={{ marginTop: 12, height: 44, borderRadius: 12, border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontSize: 14, fontWeight: 600 }}><Link to="/clubhouse" onClick={onClose}><ArrowLeft className="!size-[14px]" />Back to app</Link></Button>
    <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: t.inkFaint }}>Build <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{__BUILD_ID__}</span> · deployed {formatAgo(typeof __BUILD_STAMP__ === 'string' ? __BUILD_STAMP__ : null, { suffix: true })}</div>
  </footer>;
}
