import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface UserStats {
  postsCount: number;
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
  xp: number;
}

export interface UserActivity {
  id: string;
  name: string;
  created_at: string;
  props: Record<string, unknown>;
}

export interface UserDetailData {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  home_club: string | null;
  is_verified: boolean;
  is_public: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  auth_provider: string | null;
  role: string | null;
  stats: UserStats;
  recentActivity: UserActivity[];
}

export function useUserDetails(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user-details', userId],
    queryFn: async (): Promise<UserDetailData | null> => {
      if (!userId) return null;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw profileError;
      }

      if (!profile) return null;

      // Fetch stats in parallel
      const [postsResult, reviewsResult, followersResult, followingResult, xpResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('course_ratings').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('user_xp_events').select('amount').eq('user_id', userId),
      ]);

      // Calculate total XP
      const totalXp = (xpResult.data || []).reduce((sum, event) => sum + (event.amount || 0), 0);

      // Fetch recent activity (last 10 events)
      const { data: activityData, error: activityError } = await supabase
        .from('analytics_events')
        .select('id, name, created_at, props')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) {
        console.error('Error fetching activity:', activityError);
      }

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // Get email from business_contact_email or default
      const userEmail = profile.business_contact_email || `${profile.username || profile.id}@user`;

      return {
        id: profile.id,
        email: userEmail,
        display_name: profile.display_name,
        username: profile.username,
        avatar_url: profile.profile_photo_url,
        bio: profile.bio,
        home_club: profile.home_club,
        is_verified: profile.is_verified_golfer || false,
        is_public: profile.is_public || false,
        created_at: profile.created_at || new Date().toISOString(),
        last_sign_in_at: null, // Would need auth.users access
        auth_provider: null, // Would need auth.users access
        role: roleData?.role || null,
        stats: {
          postsCount: postsResult.count || 0,
          reviewsCount: reviewsResult.count || 0,
          followersCount: followersResult.count || 0,
          followingCount: followingResult.count || 0,
          xp: totalXp,
        },
        recentActivity: (activityData || []).map((event) => ({
          id: event.id,
          name: event.name,
          created_at: event.created_at,
          props: event.props as Record<string, unknown>,
        })),
      };
    },
    enabled: !!userId,
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useUserActions() {
  const [loading, setLoading] = useState<string | null>(null);

  const changeRole = useCallback(async (userId: string, newRole: string) => {
    setLoading(userId);
    try {
      if (newRole === 'none') {
        await supabase.from('user_roles').delete().eq('user_id', userId);
      } else {
        // First delete existing roles, then insert new one
        await supabase.from('user_roles').delete().eq('user_id', userId);
        await supabase.from('user_roles').insert({
          user_id: userId,
          role: newRole as 'admin' | 'limited_admin' | 'moderator' | 'user',
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Error changing role:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, []);

  const suspendUser = useCallback(async (userId: string) => {
    setLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke('secure-admin-operations', {
        body: {
          action: 'suspend_user',
          targetUserId: userId,
          reason: 'Admin suspended user',
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error suspending user:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string, userEmail: string) => {
    setLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke('secure-admin-operations', {
        body: {
          action: 'delete_user',
          targetUserId: userId,
          targetEmail: userEmail,
          reason: 'Admin requested user deletion',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, []);

  const resetPassword = useCallback(async (userId: string, userEmail: string) => {
    setLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke('secure-admin-operations', {
        body: {
          action: 'reset_password',
          targetUserId: userId,
          targetEmail: userEmail,
          reason: 'Admin requested password reset',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, []);

  return {
    loading,
    changeRole,
    suspendUser,
    deleteUser,
    resetPassword,
  };
}
