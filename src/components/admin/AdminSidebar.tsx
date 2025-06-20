
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Settings as SettingsIcon 
} from "lucide-react";

const menuItems = [
  {
    title: "Overview",
    icon: BarChart3,
    value: "overview",
  },
  {
    title: "User Management",
    icon: Users,
    value: "users",
  },
  {
    title: "Course Import",
    icon: Upload,
    value: "courses",
  },
  {
    title: "Analytics",
    icon: TrendingUp,
    value: "analytics",
  },
  {
    title: "Team Management",
    icon: UserCheck,
    value: "team",
  },
  {
    title: "Settings",
    icon: SettingsIcon,
    value: "settings",
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 py-2 text-sm font-medium text-muted-foreground">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4">
              {menuItems.map((item) => (
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
