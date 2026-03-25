import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { PanelRole } from '@/hooks/usePanelRole';
import {
  LayoutDashboard, BarChart3, Users, CheckCircle, Shield,
  Mail, MapPin, Upload, Trophy, Building2, Image, BookOpen,
  Flag, ClipboardList, Settings, Wrench, Map, FlaskConical,
  ArrowLeft, ChevronDown, ChevronRight, Activity, Sparkles, MessageCircle,
  Medal, TrendingUp, Layers,
} from 'lucide-react';

interface SidebarProps {
  role: PanelRole;
  can: { viewUsers: boolean; manageAdmins: boolean; dangerousOps: boolean };
  onNavigate?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  requiresFull?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

// ─── Individual nav link ───────────────────────────────────────────

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end
      onClick={() => onNavigate?.()}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center justify-between gap-2.5 px-3 py-[9px] rounded-[10px] text-[13px] font-medium transition-all duration-100',
          isActive
            ? 'text-[#F5A623] bg-[#FFF7ED]'
            : 'text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 2, background: '#F5A623' }} />
          )}
          <span className="flex items-center gap-2.5">
            <Icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </span>
          {item.badge !== undefined && item.badge > 0 && (
            <span
              className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: '#F5A623', color: '#FFFFFF' }}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Section header (non-collapsible) ─────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      className="px-3 pt-5 pb-1.5"
      style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94A3B8' }}
    >
      {label}
    </div>
  );
}

// ─── Collapsible group (Tools) ─────────────────────────────────────

function CollapsibleGroup({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(`admin-v2-group-${group.id}`);
      return stored !== null ? JSON.parse(stored) : (group.defaultOpen ?? false);
    } catch { return group.defaultOpen ?? false; }
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(`admin-v2-group-${group.id}`, JSON.stringify(next)); } catch {}
  };

  return (
    <div className="mt-1">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-1.5 transition-colors"
        style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94A3B8' }}
      >
        {group.label}
        {open
          ? <ChevronDown className="w-3 h-3" />
          : <ChevronRight className="w-3 h-3" />
        }
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map(item => (
            <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main sidebar ──────────────────────────────────────────────────

export default function AdminV2Sidebar({ role, can, onNavigate }: SidebarProps) {
  const navigate = useNavigate();

  // Live pending verification count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['admin-v2-pending-verifications'],
    queryFn: async () => {
      const [biz, golfer] = await Promise.all([
        supabase.from('business_verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('golfer_verification_requests' as any).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return (biz.count ?? 0) + (golfer.count ?? 0);
    },
    enabled: can.manageAdmins,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const groups: NavGroup[] = [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        { to: '/admin-v2/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    ...(can.manageAdmins ? [{
      id: 'analytics',
      label: 'Analytics',
      requiresFull: true,
      items: [
        { to: '/admin-v2/analytics/platform',   label: 'Platform',           icon: BarChart3 },
        { to: '/admin-v2/analytics/engagement',  label: 'Engagement',         icon: Activity },
        { to: '/admin-v2/analytics/navigation',  label: 'Pages & Nav',        icon: Map },
        { to: '/admin-v2/analytics/echo',        label: 'Echo AI',            icon: Sparkles },
        { to: '/admin-v2/analytics/social',      label: 'Social & Messaging', icon: MessageCircle },
        { to: '/admin-v2/analytics/content',     label: 'Content',            icon: BookOpen },
        { to: '/admin-v2/analytics/auth',        label: 'Auth & Security',    icon: Shield },
        { to: '/admin-v2/analytics/retention',             label: 'Retention',              icon: Activity },
        { to: '/admin-v2/analytics/content-performance',   label: 'Content Performance',    icon: BarChart3 },
        { to: '/admin-v2/analytics/creator-leaderboard',   label: 'Creator Leaderboard',    icon: Trophy },
        { to: '/admin-v2/analytics/growth',                label: 'Growth',                 icon: TrendingUp },
        { to: '/admin-v2/analytics/feature-adoption',      label: 'Feature Adoption',       icon: Layers },
      ],
    }] : []),
    ...(can.manageAdmins ? [{
      id: 'users',
      label: 'Users & Access',
      requiresFull: true,
      items: [
        { to: '/admin-v2/users',         label: 'All Users',          icon: Users },
        { to: '/admin-v2/verifications', label: 'Verification Queue', icon: CheckCircle, badge: pendingCount },
        { to: '/admin-v2/team',          label: 'Team & Roles',       icon: Shield },
        { to: '/admin-v2/invites',       label: 'Invites',            icon: Mail },
      ],
    }] : []),
    {
      id: 'content',
      label: 'Content',
      items: [
        { to: '/admin-v2/courses',        label: 'Golf Courses',       icon: MapPin },
        { to: '/admin-v2/courses/import', label: 'Course Import',      icon: Upload },
        ...(can.manageAdmins ? [
          { to: '/admin-v2/tour',          label: 'Tour Data',          icon: Trophy },
          { to: '/admin-v2/tour/players',  label: 'Tour Players',       icon: Users },
          { to: '/admin-v2/leaderboards',  label: 'Leaderboards',       icon: Medal },
          { to: '/admin-v2/businesses',    label: 'Business Directory', icon: Building2 },
        ] : []),
      ],
    },
    ...(can.manageAdmins ? [{
      id: 'assets',
      label: 'Assets',
      items: [
        { to: '/admin-v2/assets',               label: 'Asset Manager',  icon: Image },
        { to: '/admin-v2/assets/logos',         label: 'Logos',          icon: Image },
        { to: '/admin-v2/assets/college-logos', label: 'College Logos',  icon: Image },
        { to: '/admin-v2/assets/flags',         label: 'Country Flags',  icon: Flag },
      ],
    }] : []),
    {
      id: 'system',
      label: 'System',
      items: [
        ...(can.manageAdmins ? [
          { to: '/admin-v2/audit', label: 'Audit Log', icon: ClipboardList },
        ] : []),
        { to: '/admin-v2/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const toolsGroup: NavGroup = {
    id: 'tools',
    label: 'Dev Tools',
    collapsible: true,
    defaultOpen: false,
    items: [
      { to: '/admin-v2/tools/geocoding', label: 'Geocoding',  icon: Map },
      { to: '/admin-v2/tools/testlab',   label: 'Test Lab',   icon: FlaskConical },
    ],
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo / Brand */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          height: 'calc(52px + max(env(safe-area-inset-top, 0px), 47px))',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #F5A623 0%, #E8920F 100%)',
          borderRadius: 12, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(245,166,35,0.35)',
        }}>
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>Clbhouz</span>
          <span style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.2 }}>Command Center</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {groups.map(group => (
          <div key={group.id}>
            <SectionLabel label={group.label} />
            <div className="space-y-0.5">
              {group.items.map(item => (
                <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}

        {/* Dev tools — collapsible */}
        {can.manageAdmins && (
          <CollapsibleGroup group={toolsGroup} onNavigate={onNavigate} />
        )}
      </nav>

      {/* Footer — back to app */}
      <div className="flex-shrink-0 p-3 space-y-2" style={{ borderTop: '1px solid #E2E8F0' }}>
        <button
          onClick={() => navigate('/clubhouse')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] transition-all"
          style={{ color: '#64748B' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#334155'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </button>
        <div className="px-3 py-1">
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: 10, color: '#94A3B8' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F5A623' }} />
            {role === 'full' ? 'Full Admin' : 'Limited Admin'}
          </span>
        </div>
      </div>
    </div>
  );
}
