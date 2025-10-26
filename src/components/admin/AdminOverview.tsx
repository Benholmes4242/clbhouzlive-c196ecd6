
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Shield, Clock } from 'lucide-react';
import type { AdminUser } from '@/hooks/useAdmin';

interface AdminOverviewProps {
  users: AdminUser[];
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ users }) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.last_sign_in_at).length;
  const adminUsers = users.filter(user => user.role === 'admin' || user.role === 'limited_admin').length;
  const recentUsers = users.filter(user => {
    if (!user.auth_created_at) return false;
    const createdAt = new Date(user.auth_created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdAt > sevenDaysAgo;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-2">Admin Overview</h2>
        <p className="text-muted-foreground">Monitor your platform's key metrics</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users who have signed in
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Admins and limited admins
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold">{recentUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users registered in last 7 days
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users
                .sort((a, b) => new Date(b.auth_created_at).getTime() - new Date(a.auth_created_at).getTime())
                .slice(0, 5)
                .map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.display_name || user.username || 'No name set'}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.auth_created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Distribution of user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { role: 'admin', count: users.filter(u => u.role === 'admin').length },
                { role: 'limited_admin', count: users.filter(u => u.role === 'limited_admin').length },
                { role: 'moderator', count: users.filter(u => u.role === 'moderator').length },
                { role: 'user', count: users.filter(u => u.role === 'user').length },
                { role: 'no role', count: users.filter(u => !u.role).length },
              ].map(({ role, count }) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
