import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminInvite } from '@/lib/adminInviteApi';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerificationRow {
  id:          string;
  type:        'business' | 'golfer';
  status:      string;
  requestedBy: string | null;
  createdAt:   string;
  reviewedAt:  string | null;
  note:        string | null;
  adminNote:   string | null;
  // Business-specific
  businessId?: string;
  domain?:     string | null;
  // Golfer-specific
  evidenceUrl?: string | null;
  inviteReason?: string | null;
}

export interface TeamMember {
  userId:    string;
  role:      string;
  grantedBy: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  notes:     string | null;
  displayName: string | null;
  username:    string | null;
  avatarUrl:   string | null;
}

export interface InviteRow {
  id:         string;
  email:      string | null;
  role:       string | null;
  status:     string;
  invitedBy:  string;
  createdAt:  string;
  expiresAt:  string;
  acceptedAt: string | null;
  notes:      string | null;
  invitedUserId: string | null;
  // Hydrated profile data
  displayName: string | null;
  username:    string | null;
  avatarUrl:   string | null;
}

// ─── Verification fetchers ─────────────────────────────────────────────────

async function fetchVerifications(): Promise<VerificationRow[]> {
  const [biz, golfer] = await Promise.all([
    supabase
      .from('business_verification_requests')
      .select('id, status, requested_by, created_at, reviewed_at, note, admin_note, business_id, domain')
      .order('created_at', { ascending: false }),
    supabase
      .from('golfer_verification_requests')
      .select('id, status, invited_by, created_at, reviewed_at, note, admin_note, evidence_url, invite_reason')
      .order('created_at', { ascending: false }),
  ]);

  const bizRows: VerificationRow[] = (biz.data ?? []).map(r => ({
    id:          r.id,
    type:        'business',
    status:      r.status,
    requestedBy: r.requested_by,
    createdAt:   r.created_at,
    reviewedAt:  r.reviewed_at,
    note:        r.note,
    adminNote:   r.admin_note,
    businessId:  r.business_id,
    domain:      r.domain,
  }));

  const golferRows: VerificationRow[] = (golfer.data ?? []).map(r => ({
    id:           r.id,
    type:         'golfer',
    status:       r.status,
    requestedBy:  r.invited_by,
    createdAt:    r.created_at,
    reviewedAt:   r.reviewed_at,
    note:         r.note,
    adminNote:    r.admin_note,
    evidenceUrl:  r.evidence_url,
    inviteReason: r.invite_reason,
  }));

  return [...bizRows, ...golferRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function reviewVerification(
  id: string,
  type: 'business' | 'golfer',
  decision: 'approved' | 'rejected',
  adminNote: string
): Promise<void> {
  const now = new Date().toISOString();

  if (type === 'business') {
    const { error } = await supabase
      .from('business_verification_requests')
      .update({
        status:      decision,
        admin_note:  adminNote || null,
        reviewed_at: now,
      })
      .eq('id', id);
    if (error) throw error;
  } else {
    // Golfer table uses 'accepted'/'declined' status values
    const golferStatus = decision === 'approved' ? 'accepted' : 'declined';
    const { error } = await supabase
      .from('golfer_verification_requests' as any)
      .update({
        status:      golferStatus,
        admin_note:  adminNote || null,
        reviewed_at: now,
        ...(decision === 'approved'
          ? { accepted_at: now }
          : { declined_at: now }
        ),
      } as any)
      .eq('id', id);
    if (error) throw error;
  }
}

// ─── Team fetchers ─────────────────────────────────────────────────────────

async function fetchTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('admin_memberships')
    .select('user_id, role, granted_by, created_at, expires_at, notes')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  const userIds = data.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .in('id', userIds);

  const profileMap = new Map(
    (profiles ?? []).map(p => [p.id, p])
  );

  return data.map(m => {
    const profile = profileMap.get(m.user_id);
    return {
      userId:      m.user_id,
      role:        m.role,
      grantedBy:   m.granted_by,
      createdAt:   m.created_at,
      expiresAt:   m.expires_at,
      notes:       m.notes,
      displayName: profile?.display_name ?? null,
      username:    profile?.username ?? null,
      avatarUrl:   profile?.profile_photo_url ?? null,
    };
  });
}

// ─── Invite fetchers ───────────────────────────────────────────────────────

async function fetchInvites(): Promise<InviteRow[]> {
  const { data, error } = await supabase
    .from('admin_invitations')
    .select('id, email, role, status, invited_by, created_at, expires_at, accepted_at, notes, invited_user_id')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  // Hydrate profiles for invites that have invited_user_id
  const userIds = data
    .map(r => (r as any).invited_user_id)
    .filter(Boolean) as string[];

  let profileMap = new Map<string, { display_name: string | null; username: string | null; profile_photo_url: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, profile_photo_url')
      .in('id', userIds);
    profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
  }

  return data.map(r => {
    const userId = (r as any).invited_user_id;
    const profile = userId ? profileMap.get(userId) : null;
    return {
      id:            r.id,
      email:         r.email,
      role:          r.role,
      status:        r.status,
      invitedBy:     r.invited_by,
      createdAt:     r.created_at,
      expiresAt:     r.expires_at,
      acceptedAt:    r.accepted_at,
      notes:         r.notes,
      invitedUserId: userId ?? null,
      displayName:   profile?.display_name ?? null,
      username:      profile?.username ?? null,
      avatarUrl:     profile?.profile_photo_url ?? null,
    };
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAdminV2Verifications() {
  const qc = useQueryClient();

  const { data = [], isLoading, refetch } = useQuery({
    queryKey:  ['admin-v2', 'verifications'],
    queryFn:   fetchVerifications,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, type, decision, adminNote }: {
      id: string;
      type: 'business' | 'golfer';
      decision: 'approved' | 'rejected';
      adminNote: string;
    }) => reviewVerification(id, type, decision, adminNote),
    onSuccess: (_, { decision }) => {
      toast.success(`Request ${decision}`);
      qc.invalidateQueries({ queryKey: ['admin-v2', 'verifications'] });
      qc.invalidateQueries({ queryKey: ['admin-v2-pending-verifications'] });
    },
    onError: () => toast.error('Failed to update verification'),
  });

  const counts = {
    all:      data.length,
    pending:  data.filter(v => v.status === 'pending').length,
    approved: data.filter(v => v.status === 'approved' || v.status === 'accepted').length,
    rejected: data.filter(v => v.status === 'rejected' || v.status === 'declined').length,
    business: data.filter(v => v.type === 'business').length,
    golfer:   data.filter(v => v.type === 'golfer').length,
  };

  return { data, isLoading, refetch, counts, reviewMutation };
}

export function useAdminV2Team() {
  const qc = useQueryClient();

  const { data = [], isLoading, refetch } = useQuery({
    queryKey:  ['admin-v2', 'team'],
    queryFn:   fetchTeam,
    staleTime: 2 * 60_000,
  });

  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('admin_memberships')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Access revoked');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'team'] });
    },
    onError: () => toast.error('Failed to revoke access'),
  });

  return { data, isLoading, refetch, revokeMutation };
}

export function useAdminV2Invites() {
  const qc = useQueryClient();

  const { data = [], isLoading, refetch } = useQuery({
    queryKey:  ['admin-v2', 'invites'],
    queryFn:   fetchInvites,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
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
    onSuccess: () => {
      toast.success('Invite sent — they\'ll see it in their notifications');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'invites'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to send invite'),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_invitations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Invite cancelled');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'invites'] });
    },
    onError: () => toast.error('Failed to cancel invite'),
  });

  const resendMutation = useMutation({
    mutationFn: async (id: string) => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      const { error } = await supabase
        .from('admin_invitations')
        .update({ expires_at: newExpiry.toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Invite resent — expires in 7 days');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'invites'] });
    },
    onError: () => toast.error('Failed to resend invite'),
  });

  const counts = {
    all:       data.length,
    pending:   data.filter(i => i.status === 'pending' && !i.acceptedAt).length,
    accepted:  data.filter(i => !!i.acceptedAt).length,
    expired:   data.filter(i => !i.acceptedAt && new Date(i.expiresAt) < new Date()).length,
    cancelled: data.filter(i => i.status === 'cancelled').length,
  };

  return { data, isLoading, refetch, counts, createMutation, cancelMutation, resendMutation };
}
