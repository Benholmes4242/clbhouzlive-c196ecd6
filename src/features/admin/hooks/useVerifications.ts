import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BusinessDecision = 'approved' | 'rejected' | 'needs_more_info';
export type GolferDecision = 'approved' | 'rejected';
export type CourseClaimDecision = 'approved' | 'rejected' | 'needs_more_info';

export interface VerificationRow {
  id: string;
  type: 'business' | 'golfer' | 'course_claim';
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
  // course-claim only
  claimBusinessName?: string | null;
  claimCourseName?: string | null;
  claimClubId?: string | null;
  claimSourceCourseId?: string | null;
  claimProofNote?: string | null;
}

async function fetchVerifications(): Promise<VerificationRow[]> {
  const [biz, golfer, claims] = await Promise.all([
    supabase
      .from('business_verification_requests')
      .select('id, status, requested_by, created_at, reviewed_at, note, admin_note, business_id, domain, domain_confirmed, proof_method, proof_value, proof_metadata')
      .order('created_at', { ascending: false }),
    supabase
      .from('golfer_verification_requests')
      .select('id, status, invited_by, created_at, reviewed_at, note, admin_note, evidence_url, invite_reason')
      .order('created_at', { ascending: false }),
    supabase
      .from('course_claim_requests')
      .select('id, status, business_id, club_id, source_course_id, proof_note, admin_notes, created_at, reviewed_at, requested_by')
      .order('created_at', { ascending: false }),
  ]);

  // Enrich course-claim rows with business name + course label
  const claimRows = claims.data ?? [];
  const claimBusinessIds = [...new Set(claimRows.map((c: any) => c.business_id).filter(Boolean))];
  const claimClubIds = [...new Set(claimRows.map((c: any) => c.club_id).filter(Boolean))];
  const claimSourceCourseIds = [...new Set(claimRows.map((c: any) => c.source_course_id).filter(Boolean))];

  const [claimBizMap, claimCourseBySource, claimCourseByClub] = await Promise.all([
    claimBusinessIds.length
      ? supabase.from('business_accounts').select('id, name').in('id', claimBusinessIds)
      : Promise.resolve({ data: [] as any[] }),
    claimSourceCourseIds.length
      ? supabase.from('golf_courses').select('id, name').in('id', claimSourceCourseIds)
      : Promise.resolve({ data: [] as any[] }),
    claimClubIds.length
      ? supabase.from('golf_courses').select('id, name, club_id').in('club_id', claimClubIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const bizNameById = new Map(((claimBizMap.data ?? []) as any[]).map((b) => [b.id, b.name]));
  const courseNameBySourceId = new Map(((claimCourseBySource.data ?? []) as any[]).map((c) => [c.id, c.name]));
  const courseNameByClubId = new Map<string, string>();
  for (const c of (claimCourseByClub.data ?? []) as any[]) {
    if (c.club_id && !courseNameByClubId.has(c.club_id)) courseNameByClubId.set(c.club_id, c.name);
  }

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
    ...claimRows.map((r: any) => ({
      id: r.id, type: 'course_claim' as const, status: r.status,
      requestedBy: r.requested_by, createdAt: r.created_at, reviewedAt: r.reviewed_at,
      note: r.proof_note ?? null, adminNote: r.admin_notes ?? null,
      businessId: r.business_id,
      claimBusinessName: bizNameById.get(r.business_id) ?? null,
      claimCourseName:
        (r.source_course_id ? courseNameBySourceId.get(r.source_course_id) : null) ??
        (r.club_id ? courseNameByClubId.get(r.club_id) : null) ??
        null,
      claimClubId: r.club_id ?? null,
      claimSourceCourseId: r.source_course_id ?? null,
      claimProofNote: r.proof_note ?? null,
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
    }: {
      id: string;
      type: 'business' | 'golfer' | 'course_claim';
      decision: BusinessDecision | GolferDecision | CourseClaimDecision;
      adminNote: string;
    }) => {
      // Shared edge-function error classifier (used by business + course_claim)
      const classifyEdgeError = async (error: any) => {
        const ctx = error?.context;
        const status = ctx?.status ?? error?.status;
        let bodyText = '';
        try { bodyText = typeof ctx?.text === 'function' ? await ctx.text() : ''; } catch { /* ignore */ }
        const combined = `${error?.message || ''} ${bodyText}`.toLowerCase();
        if (status === 409 || combined.includes('not pending') || combined.includes('already')) {
          const e: any = new Error('already_actioned');
          e.alreadyActioned = true;
          return e;
        }
        return new Error(error?.message || 'Edge function error');
      };

      if (type === 'business') {
        // Route through edge functions so is_verified flips + emails fire.
        const fn =
          decision === 'approved' ? 'verify-business-approve' :
          decision === 'rejected' ? 'verify-business-reject' :
          'verify-business-request-info';
        const { data, error } = await supabase.functions.invoke(fn, {
          body: { request_id: id, admin_notes: adminNote || null },
        });
        if (error) throw await classifyEdgeError(error);
        if (!data?.ok) {
          const msg = String(data?.error || '').toLowerCase();
          if (msg.includes('not pending') || msg.includes('already')) {
            const e: any = new Error('already_actioned');
            e.alreadyActioned = true;
            throw e;
          }
          throw new Error(data?.error || 'Failed to update verification');
        }
        return;
      }

      if (type === 'course_claim') {
        const fn =
          decision === 'approved' ? 'approve-course-claim' :
          decision === 'rejected' ? 'reject-course-claim' :
          'request-info-course-claim';
        const { data, error } = await supabase.functions.invoke(fn, {
          body: decision === 'approved'
            ? { request_id: id }
            : { request_id: id, admin_notes: adminNote || null },
        });
        if (error) throw await classifyEdgeError(error);
        if (data && data.ok === false) {
          const msg = String(data?.error || '').toLowerCase();
          if (msg.includes('not pending') || msg.includes('already')) {
            const e: any = new Error('already_actioned');
            e.alreadyActioned = true;
            throw e;
          }
          throw new Error(data?.error || 'Failed to update claim');
        }
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
    },
    onError: (e: any) => {
      if (e?.alreadyActioned) {
        toast.info('Request was already actioned — refreshing.');
        return;
      }
      toast.error(e?.message || 'Failed to update verification');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin-v2', 'verifications'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'dashboard', 'queue'] });
      qc.invalidateQueries({ queryKey: ['business-verification-request'] });
      qc.invalidateQueries({ queryKey: ['business-account-verification-status'] });
      qc.invalidateQueries({ queryKey: ['course-claim'] });
      qc.invalidateQueries({ queryKey: ['course-claim-status'] });
    },
  });

  const counts = {
    all: data.length,
    pending: data.filter(v => v.status === 'pending').length,
    business: data.filter(v => v.type === 'business' && v.status === 'pending').length,
    golfer: data.filter(v => v.type === 'golfer' && v.status === 'pending').length,
    courseClaim: data.filter(v => v.type === 'course_claim' && v.status === 'pending').length,
  };

  return { data, isLoading, refetch, counts, reviewMutation };
}

/**
 * Detects when a business verification request's proof matches an already-approved
 * request on a *different* business. Returns the conflicting business id + name when
 * a duplicate exists, otherwise null.
 */
export function useProofConflict(active: VerificationRow | null) {
  return useQuery({
    queryKey: [
      'verification-proof-conflict',
      active?.id,
      active?.proofMethod,
      active?.proofValue,
      active?.businessId,
    ],
    enabled:
      !!active &&
      active.type === 'business' &&
      !!active.proofMethod &&
      !!active.proofValue &&
      !!active.businessId,
    queryFn: async () => {
      if (!active?.proofMethod || !active.proofValue || !active.businessId) return null;
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select('business_id')
        .eq('proof_method', active.proofMethod)
        .eq('proof_value', active.proofValue)
        .eq('status', 'approved')
        .neq('business_id', active.businessId)
        .limit(1);
      if (error) throw error;
      if (!data?.length) return null;
      const conflictBusinessId = data[0].business_id as string;
      const { data: biz } = await supabase
        .from('business_accounts')
        .select('name')
        .eq('id', conflictBusinessId)
        .maybeSingle();
      return {
        businessId: conflictBusinessId,
        businessName: biz?.name ?? 'another business',
      };
    },
    staleTime: 30_000,
  });
}
