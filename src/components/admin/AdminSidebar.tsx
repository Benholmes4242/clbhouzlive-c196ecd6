import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ChevronDown,
  BarChart3,
  Users,
  Building2,
  Palette,
  Settings,
  ArrowLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ============================================
// TYPES
// ============================================

interface MenuItem {
  to: string;
  label: string;
  badge?: number;
  tooltip?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
  getBadgeCount?: () => number | undefined;
}

// ============================================
// LINK ITEM COMPONENT
// ============================================

interface LinkItemProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  tooltip?: string;
}

const LinkItem: React.FC<LinkItemProps> = ({ to, children, onClick, badge, tooltip }) => {
  const linkContent = (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center justify-between gap-3 rounded-sq-sm px-3 py-2 text-sm transition-all duration-motion-fast ease-standard",
          isActive 
            ? "bg-muted text-foreground font-medium" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )
      }
    >
      <span>{children}</span>
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
      )}
    </NavLink>
  );

  if (tooltip && badge && badge > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
};

// ============================================
// COLLAPSIBLE GROUP COMPONENT
// ============================================

interface CollapsibleGroupProps {
  group: MenuGroup;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  badgeCount?: number;
}

const CollapsibleGroup: React.FC<CollapsibleGroupProps> = ({
  group,
  isOpen,
  onToggle,
  onNavigate,
  badgeCount,
}) => {
  const Icon = group.icon;
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors rounded-sq-sm hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{group.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {badgeCount}
            </span>
          )}
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen ? "rotate-180" : ""
            )} 
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 space-y-0.5 pl-2">
        {group.items.map((item) => (
          <LinkItem 
            key={item.to} 
            to={item.to} 
            onClick={onNavigate}
            badge={item.badge}
            tooltip={item.tooltip}
          >
            {item.label}
          </LinkItem>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

const STORAGE_KEY = 'admin-sidebar-collapsed';

function getCollapsedGroups(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setCollapsedGroups(collapsed: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// MAIN SIDEBAR COMPONENT
// ============================================

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onNavigate }) => {
  const { role, loading } = usePanelRole();
  const can = panelCan(role);

  // Collapsed state per group
  const [collapsedGroups, setCollapsedGroupsState] = useState<Record<string, boolean>>(() => {
    const stored = getCollapsedGroups();
    // Default: all groups expanded except specified ones
    return {
      analytics: stored.analytics ?? false,
      users: stored.users ?? false,
      content: stored.content ?? false,
      assets: stored.assets ?? true, // Collapsed by default
      system: stored.system ?? true, // Collapsed by default
    };
  });

  // Persist collapsed state
  useEffect(() => {
    setCollapsedGroups(collapsedGroups);
  }, [collapsedGroups]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroupsState(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Fetch pending verification count
  const { data: pendingVerificationCount } = useQuery({
    queryKey: ['admin-verifications-count'],
    queryFn: async () => {
      const [businessResult, golferResult] = await Promise.all([
        supabase.from('business_verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('golfer_verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      const businessCount = businessResult.count ?? 0;
      const golferCount = golferResult.count ?? 0;
      return businessCount + golferCount;
    },
    enabled: can.manageAdmins,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Define menu groups
  const menuGroups: MenuGroup[] = [
    {
      id: 'analytics',
      label: 'Analytics & Monitoring',
      icon: BarChart3,
      items: [
        { to: '/admin/analytics', label: 'Analytics' },
        { to: '/admin/analytics/echo', label: 'Echo Analytics' },
        { to: '/admin/auth-monitoring', label: 'Auth Monitoring' },
      ],
    },
    {
      id: 'users',
      label: 'Users & Verification',
      icon: Users,
      items: [
        { to: '/admin/users', label: 'User Management' },
        { 
          to: '/admin/verification', 
          label: 'Verification Queue',
          badge: pendingVerificationCount,
          tooltip: 'There are verification requests awaiting review.',
        },
        { to: '/admin/team', label: 'Team Management' },
        { to: '/admin/admins', label: 'Admin Members' },
        { to: '/admin/invites', label: 'Invitations' },
      ],
    },
    {
      id: 'content',
      label: 'Content & Business',
      icon: Building2,
      items: [
        { to: '/admin/businesses', label: 'Business Directory' },
        { to: '/admin/golf-courses', label: 'Golf Courses' },
        { to: '/admin/tour', label: 'Tour Data' },
        { to: '/admin/courses', label: 'Course Import' },
      ],
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: Palette,
      items: [
        { to: '/admin/logos', label: 'Logos' },
        { to: '/admin/college-logos', label: 'College Logos' },
        { to: '/admin/country-flags', label: 'Country Flags' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      icon: Settings,
      items: [
        { to: '/admin/overview', label: 'Legacy Overview' },
        { to: '/admin/audit', label: 'Audit Log' },
        { to: '/admin/settings', label: 'Settings' },
        { to: '/admin/top100-geocoding', label: 'Top 100 Geocoding' },
        { to: '/admin/test-lab', label: 'Test Lab' },
      ],
    },
  ];

  // Calculate badge counts per group
  const getGroupBadgeCount = (groupId: string): number | undefined => {
    if (groupId === 'users') {
      return pendingVerificationCount;
    }
    return undefined;
  };

  // Limited menu for non-full admins
  if (!can.manageAdmins) {
    return (
      <div className="h-full w-full px-3 py-4">
        <div className="px-2 pb-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Management</div>
          <div className="text-sm text-muted-foreground">
            {loading ? "Checking role…" : `Role: ${role}`}
          </div>
        </div>
        <nav className="space-y-1">
          <LinkItem to="/admin/golf-courses" onClick={onNavigate}>
            Golf Courses
          </LinkItem>
        </nav>
      </div>
    );
  }

  return (
    <div className="h-full w-full px-3 py-4 overflow-y-auto flex flex-col">
      {/* Back to App link */}
      <Link
        to="/clubhouse"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 py-2 mb-3 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-sq-sm hover:bg-muted/50"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to App</span>
      </Link>

      {/* Header */}
      <div className="px-2 pb-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Management</div>
        <div className="text-sm text-muted-foreground">
          {loading ? "Checking role…" : `Role: ${role}`}
        </div>
      </div>

      <nav className="space-y-4">
        {/* Command Center - Primary dashboard link, outside groups */}
        <div>
          <NavLink
            to="/admin/command-center"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-sq-sm px-3 py-2.5 text-sm font-medium transition-all duration-motion-fast ease-standard",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-foreground hover:bg-muted"
              )
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Command Center</span>
          </NavLink>
        </div>

        {/* Grouped sections */}
        <div className="space-y-2">
          {menuGroups.map((group) => (
            <CollapsibleGroup
              key={group.id}
              group={group}
              isOpen={!collapsedGroups[group.id]}
              onToggle={() => toggleGroup(group.id)}
              onNavigate={onNavigate}
              badgeCount={getGroupBadgeCount(group.id)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;
