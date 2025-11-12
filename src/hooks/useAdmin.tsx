
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface AdminUser {
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
  role: 'admin' | 'moderator' | 'user' | 'limited_admin' | null;
}

export const useAdmin = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLimitedAdmin, setIsLimitedAdmin] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'limited_admin' | null>(null);
  const [networkError, setNetworkError] = useState(false);

  console.log('useAdmin hook - user:', !!user, 'sessionLoading:', sessionLoading);

  // Check if current user is admin or limited admin by calling edge function
  const checkAdminStatus = async () => {
    if (!user) {
      console.log('No user, setting admin status to false');
      setIsAdmin(false);
      setIsLimitedAdmin(false);
      setUserRole(null);
      setNetworkError(false);
      setLoading(false);
      return;
    }

    console.log('Checking admin status for user:', user.id);
    try {
      // Use the same edge function as the gate for consistency
      const { data, error } = await supabase.functions.invoke('secure-site-access-check', { 
        body: {},
        method: 'POST'
      });
      
      if (error) {
        console.error('[AdminAccess] Error checking admin status via edge function:', error);
        console.error('[AdminAccess] Error details:', JSON.stringify(error, null, 2));
        console.error('[AdminAccess] This may be a CORS/network issue. Check browser console for preflight errors.');
        setIsAdmin(false);
        setIsLimitedAdmin(false);
        setUserRole(null);
        setNetworkError(true);
        setLoading(false);
        return;
      }

      const role = data?.role || 'none';
      const isFullAdmin = role === 'full';
      const isLimitedAdminUser = role === 'limited';

      console.log('Admin status result:', { isFullAdmin, isLimitedAdminUser, role, data });
      
      setIsAdmin(isFullAdmin);
      setIsLimitedAdmin(isLimitedAdminUser);
      setNetworkError(false);
      
      // Set user role for easier access
      if (isFullAdmin) {
        setUserRole('admin');
      } else if (isLimitedAdminUser) {
        setUserRole('limited_admin');
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error('[AdminAccess] Exception checking admin status (likely CORS/network):', error);
      setIsAdmin(false);
      setIsLimitedAdmin(false);
      setUserRole(null);
      setNetworkError(true);
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

  // Assign role to user - simplified version that doesn't auto-refresh
  const assignRole = async (userId: string, role: 'admin' | 'moderator' | 'user' | 'limited_admin') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
      
      if (error) {
        console.error('Error assigning role:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  };

  // Remove role from user - simplified version that doesn't auto-refresh
  const removeRole = async (userId: string, role: 'admin' | 'moderator' | 'user' | 'limited_admin') => {
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
    isLimitedAdmin,
    userRole,
    networkError,
    hasAdminAccess: isAdmin || isLimitedAdmin, // Helper to check if user has any admin access
    fetchUsers,
    assignRole,
    removeRole
  };
};
