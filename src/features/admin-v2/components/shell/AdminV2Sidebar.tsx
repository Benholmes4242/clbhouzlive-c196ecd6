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
  ArrowLeft, ChevronDown, ChevronRight,
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
          'group flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-100',
          isActive
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
        )
      }
    >
      <span className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
      </span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold" style={{ background: 'hsl(var(--accent-amber))', color: 'hsl(var(--accent-amber-foreground, 0 0% 0%))' }}>
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </NavLink>
  );
}

// ─── Section header (non-collapsible) ─────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/60">
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
      <button onClick={toggle} className="w-full flex items-center justify-between px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors">
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
        { to: '/admin-v2/analytics/platform', label: 'Platform',  icon: BarChart3 },
        { to: '/admin-v2/analytics/content',  label: 'Content',   icon: BookOpen },
        { to: '/admin-v2/analytics/auth',     label: 'Auth & Security', icon: Shield },
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
    <div className="h-full flex flex-col bg-card">
      {/* Logo / Brand */}
      <div className="h-[52px] flex items-center gap-3 px-4 border-b border-border/60 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--accent-amber))' }}>
          <Shield className="w-4 h-4 text-background" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground leading-tight">Clbhouz</span>
          <span className="text-[10px] text-muted-foreground leading-tight">Admin Console</span>
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
      <div className="flex-shrink-0 border-t border-border/60 p-3 space-y-2">
        <button
          onClick={() => navigate('/clubhouse')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </button>
        <div className="px-3 py-1">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--accent-amber))' }} />
            {role === 'full' ? 'Full Admin' : 'Limited Admin'}
          </span>
        </div>
      </div>
    </div>
  );
}
