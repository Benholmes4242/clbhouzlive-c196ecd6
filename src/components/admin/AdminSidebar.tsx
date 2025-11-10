import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";
import { 
  BarChart3, 
  Users, 
  Shield,
  Mail
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = () => {
  const { role, loading } = usePanelRole();
  const can = panelCan(role);

  return (
    <div className="h-full w-full flex flex-col border-r border-border bg-background">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          {can.manageAdmins ? 'Admin Panel' : 'Management'}
        </h2>
        <div className="mt-2 text-xs text-muted-foreground">
          {loading ? "Checking role…" : `Role: ${role}`}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {can.manageAdmins && (
          <NavLink
            to="/admin/overview"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`
            }
          >
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </NavLink>
        )}

        {can.viewUsers && (
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`
            }
          >
            <Users className="h-4 w-4" />
            <span>Users</span>
          </NavLink>
        )}

        {can.manageAdmins && (
          <>
            <NavLink
              to="/admin/admins"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              <Shield className="h-4 w-4" />
              <span>Admin Members</span>
            </NavLink>

            <NavLink
              to="/admin/invites"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              <Mail className="h-4 w-4" />
              <span>Invitations</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          © 2025 clbhouz Admin Panel
        </p>
      </div>
    </div>
  );
};

export default AdminSidebar;
