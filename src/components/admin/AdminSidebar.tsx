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
  Image,
  Settings,
  ArrowLeft,
  Shield,
  CheckCircle,
  MapPin,
  Trophy,
  FileInput,
  ClipboardList,
  Wrench,
  Map,
  FlaskConical,
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
  icon?: React.ElementType;
  badge?: number;
  tooltip?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// ============================================
// LINK ITEM COMPONENT
// ============================================

interface LinkItemProps {
  to: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  onClick?: () => void;
  badge?: number;
  tooltip?: string;
}

const LinkItem: React.FC<LinkItemProps> = ({ to, children, icon: Icon, onClick, badge, tooltip }) => {
  const linkContent = (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
          "min-h-[44px]", // Touch target
          isActive 
            ? "bg-primary text-primary-foreground font-medium shadow-sm border-l-2 border-l-primary-foreground/30" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )
      }
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span>{children}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {badge}
        </span>
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
// SECTION HEADER COMPONENT
// ============================================

interface SectionHeaderProps {
  label: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ label }) => (
  <div className="px-3 pt-4 pb-2">
    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {label}
    </div>
  </div>
);

// ============================================
// COLLAPSIBLE GROUP COMPONENT (for Tools section)
// ============================================

interface CollapsibleGroupProps {
  group: MenuGroup;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

const CollapsibleGroup: React.FC<CollapsibleGroupProps> = ({
  group,
  isOpen,
  onToggle,
  onNavigate,
}) => {
  const Icon = group.icon;
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors rounded-lg hover:bg-muted/30">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{group.label}</span>
        </div>
        <ChevronDown 
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )} 
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 space-y-0.5">
        {group.items.map((item) => (
          <LinkItem 
            key={item.to} 
            to={item.to} 
            icon={item.icon}
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

const STORAGE_KEY = 'admin-sidebar-collapsed-v2';

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

  // Collapsed state for tools section
  const [toolsExpanded, setToolsExpanded] = useState<boolean>(() => {
    const stored = getCollapsedGroups();
    return stored.tools ?? false; // Collapsed by default
  });

  // Persist collapsed state
  useEffect(() => {
    setCollapsedGroups({ tools: toolsExpanded });
  }, [toolsExpanded]);

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

  // Tools section config (collapsible)
  const toolsGroup: MenuGroup = {
    id: 'tools',
    label: 'Tools',
    icon: Wrench,
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { to: '/admin/top100-geocoding', label: 'Top 100 Geocoding', icon: Map },
      { to: '/admin/test-lab', label: 'Test Lab', icon: FlaskConical },
    ],
  };

  // Limited menu for non-full admins
  if (!can.manageAdmins) {
    return (
      <div className="h-full w-full px-3 py-4 bg-background">
        {/* Back to App */}
        <Link
          to="/clubhouse"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2.5 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to App</span>
        </Link>

        <div className="px-3 pb-4 border-b border-border mb-4">
          <div className="text-sm font-semibold text-foreground">Admin Panel</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {loading ? "Checking role…" : `Role: ${role}`}
          </div>
        </div>

        <nav className="space-y-1">
          <LinkItem to="/admin/golf-courses" icon={MapPin} onClick={onNavigate}>
            Golf Courses
          </LinkItem>
        </nav>
      </div>
    );
  }

  return (
    <div className="h-full w-full px-2 py-4 overflow-y-auto flex flex-col bg-background">
      {/* Back to App link */}
      <Link
        to="/clubhouse"
        onClick={onNavigate}
        className="flex items-center gap-2 px-3 py-2.5 mb-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to App</span>
      </Link>

      {/* Header */}
      <div className="px-3 pb-4 mb-2 border-b border-border">
        <div className="text-sm font-semibold text-foreground">Admin Panel</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
            {loading ? "…" : role === 'full' ? 'Full Admin' : role}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {/* Command Center - Primary dashboard link */}
        <NavLink
          to="/admin/command-center"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 min-h-[44px]",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-foreground hover:bg-muted"
            )
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Command Center</span>
        </NavLink>

        {/* ANALYTICS Section */}
        <SectionHeader label="Analytics" />
        <div className="space-y-0.5">
          <LinkItem to="/admin/analytics" icon={BarChart3} onClick={onNavigate}>
            Analytics
          </LinkItem>
          <LinkItem to="/admin/auth-monitoring" icon={Shield} onClick={onNavigate}>
            Auth Monitoring
          </LinkItem>
        </div>

        {/* USERS & ACCESS Section */}
        <SectionHeader label="Users & Access" />
        <div className="space-y-0.5">
          <LinkItem to="/admin/users" icon={Users} onClick={onNavigate}>
            User Management
          </LinkItem>
          <LinkItem 
            to="/admin/verification" 
            icon={CheckCircle}
            onClick={onNavigate}
            badge={pendingVerificationCount}
            tooltip="Verification requests awaiting review"
          >
            Verification Queue
          </LinkItem>
          <LinkItem to="/admin/team" icon={Shield} onClick={onNavigate}>
            Team Management
          </LinkItem>
        </div>

        {/* CONTENT Section */}
        <SectionHeader label="Content" />
        <div className="space-y-0.5">
          <LinkItem to="/admin/businesses" icon={Building2} onClick={onNavigate}>
            Business Directory
          </LinkItem>
          <LinkItem to="/admin/golf-courses" icon={MapPin} onClick={onNavigate}>
            Golf Courses
          </LinkItem>
          <LinkItem to="/admin/tour" icon={Trophy} onClick={onNavigate}>
            Tour Data
          </LinkItem>
          <LinkItem to="/admin/tour-players" icon={Users} onClick={onNavigate}>
            Tour Players
          </LinkItem>
          <LinkItem to="/admin/courses" icon={FileInput} onClick={onNavigate}>
            Course Import
          </LinkItem>
        </div>

        {/* ASSETS Section */}
        <SectionHeader label="Assets" />
        <div className="space-y-0.5">
          <LinkItem to="/admin/assets" icon={Image} onClick={onNavigate}>
            Asset Manager
          </LinkItem>
        </div>

        {/* SYSTEM Section */}
        <SectionHeader label="System" />
        <div className="space-y-0.5">
          <LinkItem to="/admin/audit" icon={ClipboardList} onClick={onNavigate}>
            Audit Log
          </LinkItem>
          <LinkItem to="/admin/settings" icon={Settings} onClick={onNavigate}>
            Settings
          </LinkItem>
        </div>

        {/* TOOLS Section - Collapsible */}
        <div className="pt-2">
          <CollapsibleGroup
            group={toolsGroup}
            isOpen={toolsExpanded}
            onToggle={() => setToolsExpanded(!toolsExpanded)}
            onNavigate={onNavigate}
          />
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;
