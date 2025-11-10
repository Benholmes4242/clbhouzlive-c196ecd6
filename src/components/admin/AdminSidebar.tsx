import React from "react";
import { NavLink } from "react-router-dom";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";

const LinkItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
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

  // Full Admin menu — all admin features
  const fullMenu = [
    { to: "/admin/overview",   label: "Overview" },
    { to: "/admin/users",      label: "User Management" },
    { to: "/admin/admins",     label: "Admin Members" },
    { to: "/admin/invites",    label: "Invitations" },
  ];

  // Limited Admin menu — restricted access (currently empty, will show golf courses when available)
  const limitedMenu: typeof fullMenu = [];

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
        {menu.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No sections available
          </div>
        ) : (
          menu.map((item) => (
            <LinkItem key={item.to} to={item.to}>
              <span>{item.label}</span>
            </LinkItem>
          ))
        )}
      </nav>
    </div>
  );
};

export default AdminSidebar;
