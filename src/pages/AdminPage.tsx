
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import { useAdmin } from '@/hooks/useAdmin';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AccessDenied from '@/components/admin/AccessDenied';
import AdminLoading from '@/components/admin/AdminLoading';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { users, loading, isAdmin, assignRole, removeRole } = useAdmin();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole === 'none') {
      // Remove all roles
      await removeRole(userId, 'admin');
      await removeRole(userId, 'moderator');
      await removeRole(userId, 'user');
    } else {
      await assignRole(userId, newRole as 'admin' | 'moderator' | 'user');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <AdminLoading />
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <AccessDenied />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <AdminDashboard users={users} onRoleChange={handleRoleChange} />
      </div>
    </div>
  );
};

export default AdminPage;
