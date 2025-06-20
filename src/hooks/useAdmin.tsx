
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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

export const useAdmin = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  console.log('useAdmin hook - user:', !!user, 'sessionLoading:', sessionLoading);

  // Check if current user is admin
  const checkAdminStatus = async () => {
    if (!user) {
      console.log('No user, setting isAdmin to false');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    console.log('Checking admin status for user:', user.id);
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        console.log('Admin status result:', data);
        setIsAdmin(data || false);
      }
    } catch (error) {
      console.error('Exception checking admin status:', error);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  // Fetch all users (admin only)
  const fetchUsers = async () => {
    if (!isAdmin) {
      console.log('User is not admin, skipping user fetch');
      return;
    }
    
    console.log('Fetching users for admin dashboard');
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_users_admin');
      if (error) {
        console.error('Error fetching users:', error);
      } else {
        console.log('Fetched users:', data?.length || 0);
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Assign role to user
  const assignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
      
      if (error) {
        console.error('Error assigning role:', error);
        return false;
      }
      
      await fetchUsers(); // Refresh users list
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  };

  // Remove role from user
  const removeRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) {
        console.error('Error removing role:', error);
        return false;
      }
      
      await fetchUsers(); // Refresh users list
      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      return false;
    }
  };

  // Check admin status when user changes or session loading completes
  useEffect(() => {
    if (!sessionLoading) {
      checkAdminStatus();
    }
  }, [user, sessionLoading]);

  // Fetch users when admin status is confirmed
  useEffect(() => {
    if (isAdmin && !loading) {
      fetchUsers();
    }
  }, [isAdmin]);

  return {
    users,
    loading: loading || sessionLoading,
    isAdmin,
    fetchUsers,
    assignRole,
    removeRole
  };
};
