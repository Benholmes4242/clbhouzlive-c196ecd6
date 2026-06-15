import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { revokeBulkInvites } from '@/lib/adminBulkApi';
import { toast } from 'sonner';

export interface InviteRow {
  id: string;
  email: string | null;
  role: string | null;
  status: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  notes: string | null;
  invitedUserId: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

async function fetchInvites(): Promise<InviteRow[]> {
  const { data, error } = await supabase
    .from('admin_invitations')
    .select('id, email, role, status, invited_by, created_at, expires_at, accepted_at, notes, invited_user_id')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data?.length) return [];

  const ids = data.map(r => (r as any).invited_user_id).filter(Boolean) as string[];
  let map = new Map<string, any>();
  if (ids.length) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, profile_photo_url')
      .in('id', ids);
    map = new Map((profiles ?? []).map(p => [p.id, p]));
  }

  return data.map(r => {
    const uid = (r as any).invited_user_id;
    const p = uid ? map.get(uid) : null;
    return {
      id: r.id,
      email: r.email,
      role: r.role,
      status: r.status,
      invitedBy: r.invited_by,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      acceptedAt: r.accepted_at,
      notes: r.notes,
      invitedUserId: uid ?? null,
      displayName: p?.display_name ?? null,
      username: p?.username ?? null,
      avatarUrl: p?.profile_photo_url ?? null,
    };
  });
}

export function useInvites() {
  const qc = useQueryClient();
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'invites'],
    queryFn: fetchInvites,
    staleTime: 60_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-v2', 'invites'] });
    qc.invalidateQueries({ queryKey: ['admin-v2', 'dashboard', 'queue'] });
  };

  const create = useMutation({
    mutationFn: async ({ invitedUserId, role }: { invitedUserId: string; role: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('send-admin-invite', {
        body: { invitedUserId, invitedByUserId: user.id, role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => { toast.success('Invite sent'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Failed to send invite'),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_invitations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Invite cancelled'); invalidate(); },
    onError: () => toast.error('Failed to cancel invite'),
  });

  const resend = useMutation({
    mutationFn: async (id: string) => {
      const exp = new Date();
      exp.setDate(exp.getDate() + 7);
      const { error } = await supabase
        .from('admin_invitations')
        .update({ expires_at: exp.toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Invite extended +7 days'); invalidate(); },
    onError: () => toast.error('Failed to resend invite'),
  });

  const revokeBulk = useMutation({
    mutationFn: (ids: string[]) => revokeBulkInvites(ids),
    onSuccess: () => { toast.success('Invites revoked'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Failed to revoke'),
  });

  const counts = {
    all: data.length,
    pending: data.filter(i => i.status === 'pending' && !i.acceptedAt).length,
    accepted: data.filter(i => !!i.acceptedAt).length,
    expired: data.filter(i => !i.acceptedAt && new Date(i.expiresAt) < new Date()).length,
    cancelled: data.filter(i => i.status === 'cancelled').length,
  };

  return { data, isLoading, refetch, counts, create, cancel, resend, revokeBulk };
}
