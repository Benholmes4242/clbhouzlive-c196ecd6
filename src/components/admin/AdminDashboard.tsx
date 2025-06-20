
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminOverview from './AdminOverview';
import UserManagement from './UserManagement';
import ExcelCourseImporter from '@/components/courses/ExcelCourseImporter';

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
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, roles, and course data</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="courses">Course Import</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminOverview users={users} />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement users={users} onRoleChange={onRoleChange} />
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Golf Course Data Import
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload and import golf course data from Excel/CSV files
              </p>
            </CardHeader>
            <CardContent>
              <ExcelCourseImporter />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
