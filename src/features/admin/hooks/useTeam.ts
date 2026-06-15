import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminRoleManage } from '@/lib/adminRoleApi';
import { toast } from 'sonner';

export interface TeamMember {
  userId: string;
  role: string;
  grantedBy: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

async function fetchTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('admin_memberships')
    .select('user_id, role, granted_by, created_at, expires_at, notes')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data?.length) return [];

  const ids = data.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .in('id', ids);
  const map = new Map((profiles ?? []).map(p => [p.id, p]));

  return data.map(m => {
    const p = map.get(m.user_id);
    return {
      userId: m.user_id,
      role: m.role,
      grantedBy: m.granted_by,
      createdAt: m.created_at,
      expiresAt: m.expires_at,
      notes: m.notes,
      displayName: p?.display_name ?? null,
      username: p?.username ?? null,
      avatarUrl: p?.profile_photo_url ?? null,
    };
  });
}

export function useTeam() {
  const qc = useQueryClient();
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v3', 'team'],
    queryFn: fetchTeam,
    staleTime: 2 * 60_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-v3', 'team'] });
    qc.invalidateQueries({ queryKey: ['admin-v3', 'dashboard', 'queue'] });
  };

  const grantFull = useMutation({
    mutationFn: (userId: string) => adminRoleManage('grant_full', { userId }),
    onSuccess: () => { toast.success('Granted Full admin'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Failed'),
  });

  const grantLimited = useMutation({
    mutationFn: (userId: string) => adminRoleManage('grant_limited', { userId }),
    onSuccess: () => { toast.success('Granted Limited admin'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Failed'),
  });

  const downgrade = useMutation({
    mutationFn: (userId: string) => adminRoleManage('downgrade', { userId }),
    onSuccess: () => { toast.success('Downgraded'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Failed'),
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => adminRoleManage('revoke', { userId }),
    onSuccess: () => { toast.success('Access revoked'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Failed'),
  });

  const setExpiry = useMutation({
    mutationFn: ({ userId, expiresAt }: { userId: string; expiresAt: string | null }) =>
      expiresAt
        ? adminRoleManage('set_expiry', { userId, expiresAt })
        : adminRoleManage('clear_expiry', { userId }),
    onSuccess: () => { toast.success('Expiry updated'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Failed'),
  });

  return { data, isLoading, refetch, grantFull, grantLimited, downgrade, revoke, setExpiry };
}
