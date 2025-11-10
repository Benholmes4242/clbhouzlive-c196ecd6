import React from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  BarChart3, 
  Users, 
  Upload, 
  TrendingUp, 
  UserCheck, 
  Settings as SettingsIcon,
  MapPin,
  Flag,
  Image,
  Database,
  Shield
} from "lucide-react";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";

const menuItems = [
  {
    title: "Overview",
    icon: BarChart3,
    value: "overview",
    requiredRole: "admin",
  },
  {
    title: "User Management",
    icon: Users,
    value: "users",
    requiredRole: "admin",
  },
  {
    title: "Golf Courses",
    icon: MapPin,
    value: "golf-courses",
    requiredRole: "limited_admin", // Available to both admin and limited_admin
  },
  {
    title: "Logos",
    icon: Image,
    value: "logos",
    requiredRole: "admin",
  },
  {
    title: "Country Flags",
    icon: Flag,
    value: "country-flags",
    requiredRole: "admin",
  },
  {
    title: "Course Import",
    icon: Upload,
    value: "courses",
    requiredRole: "admin",
  },
  {
    title: "Analytics",
    icon: TrendingUp,
    value: "analytics",
    requiredRole: "admin",
  },
  {
    title: "Team Management",
    icon: UserCheck,
    value: "team",
    requiredRole: "admin",
  },
  {
    title: "Settings",
    icon: SettingsIcon,
    value: "settings",
    requiredRole: "admin",
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole?: 'admin' | 'limited_admin';
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange, userRole = 'admin' }) => {
  const { role, loading } = usePanelRole();
  const can = panelCan(role);
  
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === 'admin') return true; // Admin sees everything
    if (userRole === 'limited_admin') return item.value === 'golf-courses'; // Limited admin only sees golf courses
    return false;
  });

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-6">
        <h2 className="text-lg font-semibold text-foreground">
          {userRole === 'limited_admin' ? 'Golf Courses Admin' : 'Admin Panel'}
        </h2>
        <div className="mt-2 text-xs text-muted-foreground">
          {loading ? "Checking role…" : `Role: ${role}`}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 py-2 text-sm font-medium text-muted-foreground">
            {userRole === 'limited_admin' ? 'Golf Courses' : 'Management'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.value)}
                    isActive={activeTab === item.value}
                    className="w-full justify-start gap-3 px-3 py-2 text-sm"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* New role-gated navigation links */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 py-2 text-sm font-medium text-muted-foreground">
            Admin Access
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4">
              {can.viewUsers && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin/users" 
                      className="w-full justify-start gap-3 px-3 py-2 text-sm"
                    >
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {can.manageAdmins && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin/admins" 
                      className="w-full justify-start gap-3 px-3 py-2 text-sm"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Members</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <p className="text-xs text-muted-foreground">
          © 2025 clbhouz Admin Panel
        </p>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
