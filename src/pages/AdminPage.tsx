import React from 'react';
import Header from "@/components/Header";
import { useAdmin } from '@/hooks/useAdmin';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminRouteProtection from '@/components/admin/AdminRouteProtection';

const AdminPage = () => {
  const { 
    users, 
    userRole,
    assignRole, 
    removeRole 
  } = useAdmin();

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole === 'none') {
      // Remove all roles
      await removeRole(userId, 'admin');
      await removeRole(userId, 'moderator');
      await removeRole(userId, 'user');
      await removeRole(userId, 'limited_admin');
    } else {
      await assignRole(userId, newRole as 'admin' | 'moderator' | 'user' | 'limited_admin');
    }
  };

  return (
    <AdminRouteProtection requiredRole="limited_admin">
      <div className="min-h-screen bg-background">
        
        <AdminDashboard 
          users={users} 
          onRoleChange={handleRoleChange}
          userRole={userRole || 'admin'}
        />
      </div>
    </AdminRouteProtection>
  );
};

export default AdminPage;
