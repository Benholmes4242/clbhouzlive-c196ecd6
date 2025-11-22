import React from "react";
import { NavLink } from "react-router-dom";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";

const LinkItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-motion-fast ease-standard",
        isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      ].join(" ")
    }
  >
    {children}
  </NavLink>
);

export const AdminSidebar: React.FC = () => {
  const { role, loading } = usePanelRole();
  const can = panelCan(role);

  // FULL ADMIN — match the legacy set + new admin pages
  const fullMenu = [
    { to: "/admin/overview",      label: "Overview" },
    { to: "/admin/users",         label: "User Management" },
    { to: "/admin/golf-courses",  label: "Golf Courses" },
    { to: "/admin/logos",         label: "Logos" },
    { to: "/admin/country-flags", label: "Country Flags" },
    { to: "/admin/courses",       label: "Course Import" },
    { to: "/admin/analytics",     label: "Analytics" },
    { to: "/admin/analytics/echo", label: "Echo Analytics" },
    { to: "/admin/team",          label: "Team Management" },
    { to: "/admin/settings",      label: "Settings" },
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
          <LinkItem key={item.to} to={item.to}>
            <span>{item.label}</span>
          </LinkItem>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
