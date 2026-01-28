import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface AdminAuditEvent {
  id: string;
  action: string;
  created_at: string;
  target_email: string | null;
  details: Record<string, unknown> | null;
}

export interface AdminTeamMember {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  granted_at: string | null;
  expires_at: string | null;
  granted_by: string | null;
  avatar_url: string | null;
  last_active: string | null;
  status: 'active' | 'expiring' | 'expired';
}

export interface AdminDetailData {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  granted_at: string | null;
  expires_at: string | null;
  granted_by: string | null;
  granted_by_name: string | null;
  avatar_url: string | null;
  status: 'active' | 'expiring' | 'expired';
  recentActivity: AdminAuditEvent[];
}

export interface AdminTeamStats {
  totalAdmins: number;
  fullAdmins: number;
  limitedAdmins: number;
  pendingInvites: number;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  invited_by: string;
  invited_by_name: string | null;
}

// Calculate status based on expiry
function getExpiryStatus(expiresAt: string | null): 'active' | 'expiring' | 'expired' {
  if (!expiresAt) return 'active';
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring';
  return 'active';
}

export function useAdminTeamList() {
  return useQuery({
    queryKey: ['admin-team-list'],
    queryFn: async (): Promise<{ members: AdminTeamMember[]; stats: AdminTeamStats; invitations: AdminInvitation[] }> => {
      // Fetch admin profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('admin_profiles')
        .select('id, user_id, first_name, last_name, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching admin profiles:', profilesError);
        throw profilesError;
      }

      // Fetch memberships for role and expiry info
      const { data: memberships, error: membershipsError } = await supabase
        .from('admin_memberships')
        .select('user_id, role, created_at, expires_at, granted_by, notes');

      if (membershipsError) {
        console.error('Error fetching memberships:', membershipsError);
      }

      // Fetch user profiles for avatars
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('id, profile_photo_url')
        .in('id', userIds);

      // Fetch latest activity per admin
      const { data: auditLogs } = await supabase
        .from('admin_audit_log')
        .select('admin_user_id, created_at')
        .in('admin_user_id', userIds)
        .order('created_at', { ascending: false });

      // Map to get latest activity per admin
      const lastActivityMap = new Map<string, string>();
      auditLogs?.forEach(log => {
        if (!lastActivityMap.has(log.admin_user_id)) {
          lastActivityMap.set(log.admin_user_id, log.created_at);
        }
      });

      // Fetch pending invitations with invited_by name
      const { data: invitations, error: invitationsError } = await supabase
        .from('admin_invitations')
        .select('id, email, role, status, created_at, expires_at, invited_by')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError);
      }

      // Get inviter names
      const inviterIds = [...new Set(invitations?.map(i => i.invited_by) || [])];
      const { data: inviterProfiles } = await supabase
        .from('admin_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', inviterIds);

      const inviterNameMap = new Map<string, string>();
      inviterProfiles?.forEach(p => {
        inviterNameMap.set(p.user_id, `${p.first_name} ${p.last_name}`);
      });

      // Create membership map
      const membershipMap = new Map<string, typeof memberships extends (infer T)[] ? T : never>();
      memberships?.forEach(m => {
        membershipMap.set(m.user_id, m);
      });

      // Create avatar map
      const avatarMap = new Map<string, string>();
      userProfiles?.forEach(p => {
        if (p.profile_photo_url) {
          avatarMap.set(p.id, p.profile_photo_url);
        }
      });

      // Build members list
      const members: AdminTeamMember[] = (profiles || []).map(profile => {
        const membership = membershipMap.get(profile.user_id);
        const expiresAt = membership?.expires_at || null;
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: membership?.role || 'full',
          granted_at: membership?.created_at || profile.created_at,
          expires_at: expiresAt,
          granted_by: membership?.granted_by || null,
          avatar_url: avatarMap.get(profile.user_id) || null,
          last_active: lastActivityMap.get(profile.user_id) || null,
          status: getExpiryStatus(expiresAt),
        };
      });

      // Calculate stats
      const fullAdmins = members.filter(m => m.role === 'full').length;
      const limitedAdmins = members.filter(m => m.role === 'limited').length;

      const stats: AdminTeamStats = {
        totalAdmins: members.length,
        fullAdmins,
        limitedAdmins,
        pendingInvites: invitations?.length || 0,
      };

      // Build invitations with inviter names
      const formattedInvitations: AdminInvitation[] = (invitations || []).map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        created_at: inv.created_at,
        expires_at: inv.expires_at,
        invited_by: inv.invited_by,
        invited_by_name: inviterNameMap.get(inv.invited_by) || null,
      }));

      return { members, stats, invitations: formattedInvitations };
    },
    staleTime: 30000,
  });
}

export function useAdminDetails(userId: string | null) {
  return useQuery({
    queryKey: ['admin-detail', userId],
    queryFn: async (): Promise<AdminDetailData | null> => {
      if (!userId) return null;

      // Fetch admin profile
      const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching admin profile:', profileError);
        throw profileError;
      }

      if (!profile) return null;

      // Fetch membership info
      const { data: membership } = await supabase
        .from('admin_memberships')
        .select('role, created_at, expires_at, granted_by, notes')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch user profile for avatar
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('profile_photo_url')
        .eq('id', userId)
        .maybeSingle();

      // Fetch granted by name
      let grantedByName: string | null = null;
      if (membership?.granted_by) {
        const { data: granter } = await supabase
          .from('admin_profiles')
          .select('first_name, last_name')
          .eq('user_id', membership.granted_by)
          .maybeSingle();
        if (granter) {
          grantedByName = `${granter.first_name} ${granter.last_name}`;
        }
      }

      // Fetch recent activity
      const { data: auditLogs, error: auditError } = await supabase
        .from('admin_audit_log')
        .select('id, action, created_at, target_email, details')
        .eq('admin_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (auditError) {
        console.error('Error fetching audit logs:', auditError);
      }

      const expiresAt = membership?.expires_at || null;

      return {
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: membership?.role || 'full',
        granted_at: membership?.created_at || profile.created_at,
        expires_at: expiresAt,
        granted_by: membership?.granted_by || null,
        granted_by_name: grantedByName,
        avatar_url: userProfile?.profile_photo_url || null,
        status: getExpiryStatus(expiresAt),
        recentActivity: (auditLogs || []).map(log => ({
          id: log.id,
          action: log.action,
          created_at: log.created_at,
          target_email: log.target_email,
          details: log.details as Record<string, unknown> | null,
        })),
      };
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

export function useAdminTeamActions() {
  const [loading, setLoading] = useState<string | null>(null);

  const updateRole = useCallback(async (userId: string, newRole: 'full' | 'limited') => {
    setLoading(userId);
    try {
      const { error } = await supabase
        .from('admin_memberships')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating role:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, []);

  const extendAccess = useCallback(async (userId: string, newExpiryDate: string) => {
    setLoading(userId);
    try {
      const { error } = await supabase
        .from('admin_memberships')
        .update({ 
          expires_at: newExpiryDate, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error extending access:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, []);

  const revokeAccess = useCallback(async (userId: string, userEmail: string) => {
    setLoading(userId);
    try {
      // Delete from admin_memberships
      const { error: membershipError } = await supabase
        .from('admin_memberships')
        .delete()
        .eq('user_id', userId);

      if (membershipError) throw membershipError;

      // Delete from admin_profiles
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      return { success: true };
    } catch (error) {
      console.error('Error revoking access:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, []);

  const resendInvite = useCallback(async (invitationId: string) => {
    setLoading(invitationId);
    try {
      // Update expiry to extend invite
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      
      const { error } = await supabase
        .from('admin_invitations')
        .update({ 
          expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error resending invite:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, []);

  const cancelInvite = useCallback(async (invitationId: string) => {
    setLoading(invitationId);
    try {
      const { error } = await supabase
        .from('admin_invitations')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error cancelling invite:', error);
      return { success: false, error };
    } finally {
      setLoading(null);
    }
  }, []);

  return {
    loading,
    updateRole,
    extendAccess,
    revokeAccess,
    resendInvite,
    cancelInvite,
  };
}
