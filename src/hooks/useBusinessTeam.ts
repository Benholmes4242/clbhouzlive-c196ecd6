import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BusinessMember {
  id: string;
  user_profile_id: string;
  role: 'owner' | 'admin' | 'editor' | 'analyst' | 'member';
  created_at: string;
  user_profile?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
}

export interface BusinessInvite {
  id: string;
  business_id: string;
  invited_by: string;
  invitee_email: string;
  role: 'admin' | 'editor' | 'analyst' | 'member';
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  token: string;
  created_at: string;
  expires_at: string;
}

export function useBusinessTeam(businessId?: string) {
  return useQuery({
    queryKey: ['business-team', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_members')
        .select(`
          id,
          user_profile_id,
          role,
          created_at,
          user_profile:user_profiles!business_members_user_profile_id_fkey (
            id,
            display_name,
            username,
            profile_photo_url
          )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as BusinessMember[];
    },
  });
}

export function useBusinessInvites(businessId?: string) {
  return useQuery({
    queryKey: ['business-invites', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_invites')
        .select('id, business_id, invited_by, invitee_email, role, status, token, created_at, expires_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BusinessInvite[];
    },
  });
}

export function useCreateInvite(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: BusinessInvite['role'] }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('business_invites')
        .insert({
          business_id: businessId,
          invited_by: session.session.user.id,
          invitee_email: email.toLowerCase().trim(),
          role,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for invitee (if they have an account)
      const { data: inviteeProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Look up user by email via auth
      // Note: We can't query auth.users directly, so notification will be handled by accept flow

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-invites', businessId] });
      toast.success('Invitation sent');
    },
    onError: (error: Error) => {
      toast.error('Failed to send invitation', { description: error.message });
    },
  });
}

export function useRevokeInvite(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('business_invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-invites', businessId] });
      toast.success('Invitation revoked');
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('accept_business_invite', { p_token: token });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; membership_id?: string };
      if (!result.success) throw new Error(result.error || 'Failed to accept invite');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      toast.success('Invitation accepted', { description: 'You are now a team member' });
    },
    onError: (error: Error) => {
      toast.error('Failed to accept invitation', { description: error.message });
    },
  });
}

export function useRemoveMember(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberUserId: string) => {
      const { data, error } = await supabase.rpc('remove_business_member', {
        p_business_id: businessId,
        p_member_user_id: memberUserId,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Failed to remove member');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-team', businessId] });
      toast.success('Member removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove member', { description: error.message });
    },
  });
}

export function useUpdateMemberRole(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberUserId, newRole }: { memberUserId: string; newRole: string }) => {
      const { data, error } = await supabase.rpc('update_business_member_role', {
        p_business_id: businessId,
        p_member_user_id: memberUserId,
        p_new_role: newRole,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Failed to update role');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-team', businessId] });
      toast.success('Role updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update role', { description: error.message });
    },
  });
}
