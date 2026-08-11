import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, Users, MapPin, BarChart3, Shield, ArrowLeft,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { adminTheme as t } from './theme';
import type { PanelRole } from '@/hooks/usePanelRole';
import { useTriageCounts } from './hooks/useTriageCounts';
import { useHealthChips } from './lib/healthChips';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  requireFull?: boolean;
  moderatorAllowed?: boolean;
  showBadge?: boolean;
  showHealthDot?: boolean;
}

const NAV: NavItem[] = [
  { to: '/admin-v2/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin-v2/inbox',     label: 'Inbox',     icon: Inbox, moderatorAllowed: true, showBadge: true },
  { to: '/admin-v2/users',     label: 'Members',   icon: Users },
  { to: '/admin-v2/content',   label: 'Content',   icon: MapPin },
  { to: '/admin-v2/analytics', label: 'Analytics', icon: BarChart3, requireFull: true },
  { to: '/admin-v2/health',    label: 'Health',    icon: Activity, showHealthDot: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
  role: PanelRole;
  canManageAdmins: boolean;
}

export default function AdminDrawer({ open, onClose, role, canManageAdmins }: Props) {
  const location = useLocation();
  const triage = useTriageCounts();
  const badge = triage.data?.total ?? 0;
  const health = useHealthChips();
  const healthDegraded = health.nonOk > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items = NAV.filter(n => {
    if (role === 'moderator') return !!n.moderatorAllowed;
    return !n.requireFull || canManageAdmins;
  });

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden={!open}
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .22s ease',
        }}
      />
      <aside
        role="dialog"
        aria-label="Admin navigation"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 100,
          background: t.surface,
          borderRight: `1px solid ${t.line}`,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .26s cubic-bezier(0.22,1,0.36,1)',
          display: 'flex', flexDirection: 'column',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `1px solid ${t.line}` }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 12,
              background: `linear-gradient(135deg,${t.brand},${t.brandText})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.surface,
            }}
          >
            <Shield size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: t.ink, fontSize: 15, lineHeight: 1.1 }}>clbhouz</span>
            <span style={{ color: t.inkFaint, fontSize: 11 }}>Command Center</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {items.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            const showBadge = item.showBadge && badge > 0;
            const showDot = item.showHealthDot && healthDegraded;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  borderRadius: t.radius.md,
                  background: active ? t.brandSoft : 'transparent',
                  color: active ? t.brandText : t.ink,
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  textDecoration: 'none',
                }}
              >
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <Icon size={18} />
                  {showDot && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 8, height: 8, borderRadius: 999,
                      background: t.warn, border: `1.5px solid ${t.surface}`,
                    }} />
                  )}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {showBadge && (
                  <span
                    style={{
                      background: t.brand, color: t.surface,
                      fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 999,
                      minWidth: 20, textAlign: 'center',
                      fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: 14, borderTop: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: t.brand, boxShadow: `0 0 0 3px ${t.brandSoft}`,
              }}
            />
            <span style={{ fontSize: 12, color: t.inkMuted }}>
              {role === 'full' ? 'Full Admin' : role === 'limited' ? 'Limited Admin' : role === 'moderator' ? 'Moderator' : '-'}
            </span>
          </div>
          <Link
            to="/clubhouse"
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              borderRadius: t.radius.md,
              background: t.canvas,
              color: t.ink,
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              border: `1px solid ${t.line}`,
            }}
          >
            <ArrowLeft size={14} /> Back to App
          </Link>
        </div>
      </aside>
    </>
  );
}
