import React from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        [
          "flex items-center justify-between gap-3 rounded-sq-sm px-3 py-2 text-sm transition-all duration-motion-fast ease-standard",
          isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        ].join(" ")
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

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onNavigate }) => {
  const { role, loading } = usePanelRole();
  const can = panelCan(role);

  // Fetch total pending verification count (businesses + people)
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
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // FULL ADMIN — match the legacy set + new admin pages
  const fullMenu = [
    { to: "/admin/overview",      label: "Overview" },
    { to: "/admin/audit",         label: "Audit Log" },
    { to: "/admin/users",         label: "User Management" },
    { to: "/admin/businesses",    label: "Business Directory" },
    { to: "/admin/verification", label: "Verification", badge: pendingVerificationCount, tooltip: "There are verification requests awaiting review." },
    { to: "/admin/tour",          label: "Tour Data" },
    { to: "/admin/golf-courses",  label: "Golf Courses" },
    { to: "/admin/logos",         label: "Logos" },
    { to: "/admin/college-logos", label: "College Logos" },
    { to: "/admin/country-flags", label: "Country Flags" },
    { to: "/admin/courses",       label: "Course Import" },
    { to: "/admin/analytics",     label: "Analytics" },
    { to: "/admin/analytics/echo", label: "Echo Analytics" },
    { to: "/admin/auth-monitoring", label: "Auth Monitoring" },
    { to: "/admin/team",          label: "Team Management" },
    { to: "/admin/settings",      label: "Settings" },
    { to: "/admin/top100-geocoding", label: "Top 100 Geocoding" },
    { to: "/admin/test-lab",       label: "Test Lab" },
    // Phase 3 additions:
    { to: "/admin/admins",        label: "Admin Members" },
    { to: "/admin/invites",       label: "Invitations" },
  ];

  // LIMITED ADMIN — per spec, at least Golf Courses
  const limitedMenu = [
    { to: "/admin/golf-courses", label: "Golf Courses" },
  ];

  const menu = can.manageAdmins ? fullMenu : limitedMenu;

  return (
    <div className="h-full w-full px-3 py-4">
      <div className="px-2 pb-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Management</div>
        <div className="text-sm text-muted-foreground">
          {loading ? "Checking role…" : `Role: ${role}`}
        </div>
      </div>

      <nav className="space-y-1">
        {menu.map((item) => (
          <LinkItem key={item.to} to={item.to} onClick={onNavigate} badge={(item as any).badge} tooltip={(item as any).tooltip}>
            {item.label}
          </LinkItem>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
