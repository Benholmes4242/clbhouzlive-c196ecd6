import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BusinessDecision = 'approved' | 'rejected' | 'needs_more_info';
export type GolferDecision = 'approved' | 'rejected';

export interface VerificationRow {
  id: string;
  type: 'business' | 'golfer';
  status: string;
  requestedBy: string | null;
  createdAt: string;
  reviewedAt: string | null;
  note: string | null;
  adminNote: string | null;
  businessId?: string;
  domain?: string | null;
  domainConfirmed?: boolean | null;
  proofMethod?: string | null;
  proofValue?: string | null;
  proofMetadata?: Record<string, unknown> | null;
  evidenceUrl?: string | null;
  inviteReason?: string | null;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
}

async function fetchVerifications(): Promise<VerificationRow[]> {
  const [biz, golfer] = await Promise.all([
    supabase
      .from('business_verification_requests')
      .select('id, status, requested_by, created_at, reviewed_at, note, admin_note, business_id, domain, domain_confirmed, proof_method, proof_value, proof_metadata')
      .order('created_at', { ascending: false }),
    supabase
      .from('golfer_verification_requests')
      .select('id, status, invited_by, created_at, reviewed_at, note, admin_note, evidence_url, invite_reason')
      .order('created_at', { ascending: false }),
  ]);

  const rows: VerificationRow[] = [
    ...(biz.data ?? []).map((r: any) => ({
      id: r.id, type: 'business' as const, status: r.status,
      requestedBy: r.requested_by, createdAt: r.created_at, reviewedAt: r.reviewed_at,
      note: r.note, adminNote: r.admin_note, businessId: r.business_id,
      domain: r.domain, domainConfirmed: r.domain_confirmed,
      proofMethod: r.proof_method ?? null,
      proofValue: r.proof_value ?? null,
      proofMetadata: r.proof_metadata ?? null,
    })),
    ...(golfer.data ?? []).map(r => ({
      id: r.id, type: 'golfer' as const, status: r.status,
      requestedBy: r.invited_by, createdAt: r.created_at, reviewedAt: r.reviewed_at,
      note: r.note, adminNote: r.admin_note,
      evidenceUrl: r.evidence_url, inviteReason: r.invite_reason,
    })),
  ];

  const userIds = [...new Set(rows.map(r => r.requestedBy).filter(Boolean))] as string[];
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, profile_photo_url')
      .in('id', userIds);
    const map = new Map((profiles ?? []).map(p => [p.id, p]));
    for (const r of rows) {
      const p = r.requestedBy ? map.get(r.requestedBy) : null;
      r.displayName = p?.display_name ?? null;
      r.username = p?.username ?? null;
      r.avatarUrl = p?.profile_photo_url ?? null;
    }
  }

  return rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function useVerifications() {
  const qc = useQueryClient();
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'verifications'],
    queryFn: fetchVerifications,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id, type, decision, adminNote,
    }: { id: string; type: 'business' | 'golfer'; decision: BusinessDecision | GolferDecision; adminNote: string }) => {
      if (type === 'business') {
        // Route through edge functions so is_verified flips + emails fire.
        const fn =
          decision === 'approved' ? 'verify-business-approve' :
          decision === 'rejected' ? 'verify-business-reject' :
          'verify-business-request-info';
        const { data, error } = await supabase.functions.invoke(fn, {
          body: { request_id: id, admin_notes: adminNote || null },
        });
        if (error) throw new Error(error.message || 'Edge function error');
        if (!data?.ok) throw new Error(data?.error || 'Failed to update verification');
        return;
      }

      // Golfer branch — keep direct table update (separate flow / no badge bug here)
      if (decision === 'needs_more_info') {
        throw new Error('needs_more_info not supported for golfer requests');
      }
      const now = new Date().toISOString();
      const golferStatus = decision === 'approved' ? 'accepted' : 'declined';
      const { error } = await supabase
        .from('golfer_verification_requests' as any)
        .update({
          status: golferStatus,
          admin_note: adminNote || null,
          reviewed_at: now,
          ...(decision === 'approved' ? { accepted_at: now } : { declined_at: now }),
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { decision }) => {
      const label =
        decision === 'approved' ? 'approved' :
        decision === 'rejected' ? 'rejected' :
        'sent back for more info';
      toast.success(`Request ${label}`);
      qc.invalidateQueries({ queryKey: ['admin-v2', 'verifications'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'dashboard', 'queue'] });
      qc.invalidateQueries({ queryKey: ['business-verification-request'] });
      qc.invalidateQueries({ queryKey: ['business-account-verification-status'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update verification'),
  });

  const counts = {
    all: data.length,
    pending: data.filter(v => v.status === 'pending').length,
    business: data.filter(v => v.type === 'business' && v.status === 'pending').length,
    golfer: data.filter(v => v.type === 'golfer' && v.status === 'pending').length,
  };

  return { data, isLoading, refetch, counts, reviewMutation };
}
