
import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AdminSidebar from './AdminSidebar';
import AdminOverview from './AdminOverview';
import ExcelCourseImporter from '@/components/courses/ExcelCourseImporter';
import Analytics from './Analytics';
import TeamManagement from './TeamManagement';
import AdminSettings from './AdminSettings';
import GolfCoursesManagement from './GolfCoursesManagement';
import CountryFlagsManagement from './CountryFlagsManagement';
import LogosManagement from './LogosManagement';
import UrlConversionTool from './UrlConversionTool';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

// Import AdminUser type from useAdmin hook to avoid duplicate definitions
import type { AdminUser } from '@/hooks/useAdmin';

interface AdminDashboardProps {
  users: AdminUser[];
  onRoleChange: (userId: string, newRole: string) => Promise<void>;
  userRole?: 'admin' | 'limited_admin';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onRoleChange, userRole = 'admin' }) => {
  const [activeTab, setActiveTab] = useState(() => {
    // Set default tab based on user role
    return userRole === 'limited_admin' ? 'golf-courses' : 'overview';
  });

  // Ensure limited admin can only access golf-courses tab
  const handleTabChange = (tab: string) => {
    if (userRole === 'limited_admin' && tab !== 'golf-courses') {
      return; // Prevent navigation to other tabs
    }
    setActiveTab(tab);
  };

  // Update active tab if userRole changes
  useEffect(() => {
    if (userRole === 'limited_admin' && activeTab !== 'golf-courses') {
      setActiveTab('golf-courses');
    }
  }, [userRole, activeTab]);

  const renderContent = () => {
    // Limited admin can only see golf courses
    if (userRole === 'limited_admin') {
      return <GolfCoursesManagement />;
    }

    // Full admin access
    switch (activeTab) {
      case 'overview':
        return <AdminOverview users={users} />;
      case 'golf-courses':
        return <GolfCoursesManagement />;
      case 'logos':
        return <LogosManagement />;
      case 'country-flags':
        return <CountryFlagsManagement />;
      case 'courses':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Course Import</h2>
              <p className="text-muted-foreground">Upload and import golf course data from Excel/CSV files</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Golf Course Data Import
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExcelCourseImporter />
              </CardContent>
            </Card>
          </div>
        );
      case 'analytics':
        return <Analytics />;
      case 'team':
        return <TeamManagement />;
      case 'settings':
        return (
          <div className="space-y-6">
            <AdminSettings />
            <UrlConversionTool />
          </div>
        );
      default:
        return <AdminOverview users={users} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6">
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
