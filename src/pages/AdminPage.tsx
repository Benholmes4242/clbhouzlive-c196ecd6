
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
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { users, loading: adminLoading, isAdmin, assignRole, removeRole } = useAdmin();

  console.log('AdminPage render - user:', !!user, 'sessionLoading:', sessionLoading, 'isAdmin:', isAdmin, 'adminLoading:', adminLoading);

  // Don't redirect immediately, wait for session to load
  React.useEffect(() => {
    if (!sessionLoading && !user) {
      console.log('No user found after session loaded, redirecting to auth');
      navigate('/auth');
    }
  }, [user, sessionLoading, navigate]);

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

  // Show loading state while session or admin status is loading
  if (sessionLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <AdminLoading />
        </div>
      </div>
    );
  }

  // Show access denied if not admin (but only after loading is complete)
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
      <AdminDashboard users={users} onRoleChange={handleRoleChange} />
    </div>
  );
};

export default AdminPage;
