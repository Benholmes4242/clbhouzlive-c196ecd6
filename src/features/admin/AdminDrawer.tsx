import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, BarChart3, Settings, Shield, ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { adminTheme as t } from './theme';
import type { PanelRole } from '@/hooks/usePanelRole';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  requireFull?: boolean;
}

const NAV: NavItem[] = [
  { to: '/admin-v3/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin-v3/users',     label: 'Users',     icon: Users, requireFull: true },
  { to: '/admin-v3/content',   label: 'Content',   icon: MapPin },
  { to: '/admin-v3/analytics', label: 'Analytics', icon: BarChart3, requireFull: true },
  { to: '/admin-v3/system',    label: 'System',    icon: Settings },
];

interface Props {
  open: boolean;
  onClose: () => void;
  role: PanelRole;
  canManageAdmins: boolean;
}

export default function AdminDrawer({ open, onClose, role, canManageAdmins }: Props) {
  const location = useLocation();

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items = NAV.filter(n => !n.requireFull || canManageAdmins);

  return (
    <>
      {/* Backdrop */}
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
      {/* Drawer */}
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
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `1px solid ${t.line}` }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 12,
              background: 'linear-gradient(135deg,#F7931E,#E8920F)',
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

        {/* Nav */}
        <nav style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {items.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
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
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: 14, borderTop: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: t.brand, boxShadow: `0 0 0 3px ${t.brandSoft}`,
              }}
            />
            <span style={{ fontSize: 12, color: t.inkMuted }}>
              {role === 'full' ? 'Full Admin' : role === 'limited' ? 'Limited Admin' : '—'}
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
