
import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AdminSidebar from './AdminSidebar';
import AdminOverview from './AdminOverview';
import UserManagement from './UserManagement';
import ExcelCourseImporter from '@/components/courses/ExcelCourseImporter';
import Analytics from './Analytics';
import TeamManagement from './TeamManagement';
import AdminSettings from './AdminSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  auth_created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  display_name: string | null;
  username: string | null;
  home_club: string | null;
  is_public: boolean | null;
  profile_created_at: string | null;
  role: 'admin' | 'moderator' | 'user' | null;
}

interface AdminDashboardProps {
  users: AdminUser[];
  onRoleChange: (userId: string, newRole: string) => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onRoleChange }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview users={users} />;
      case 'users':
        return <UserManagement users={users} onRoleChange={onRoleChange} />;
      case 'courses':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Course Import</h2>
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
        return <AdminSettings />;
      default:
        return <AdminOverview users={users} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
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
