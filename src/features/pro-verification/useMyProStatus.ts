/**
 * BRIEF 1 §1 — the viewer's own pro status, one read: the profile's pro
 * fields come from the shared useProfileData cache (select *), and the only
 * added fetch is the member's own golfer_verification_requests row (kinds
 * tour_pro / teaching_pro), readable through the gvr_select_own policy.
 * Invalidate after request, withdraw and decide.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileData } from '@/hooks/useProfileData';
import { isProKind, type ProKind, type ProRequestRow } from './proRules';

export interface MyProStatus {
  verified: boolean;
  pending: boolean;
  declined: boolean;
  kind: ProKind | null;
  tour: string | null;
  tourCode: string | null;
  club: string | null;
  body: string | null;
  reviewReason: string | null;
  request: ProRequestRow | null;
  isLoading: boolean;
}

const PRO_REQUEST_SELECT =
  'id, kind, status, pro_tour, pro_tour_code, pro_body, pro_club, pro_membership_number, pro_link, pro_no_profile, pro_how_to_check, pro_player_id, review_reason, created_at';

export function useMyProStatus(userId: string | undefined): MyProStatus {
  const { profile } = useProfileData();
  const request = useQuery({
    queryKey: ['my-pro-request', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golfer_verification_requests')
        .select(PRO_REQUEST_SELECT)
        .eq('user_id', userId!)
        .in('kind', ['tour_pro', 'teaching_pro'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ProRequestRow | null;
    },
  });

  const p = profile as Record<string, unknown> | null | undefined;
  const verified = !!p?.pro_verified_at;
  const row = request.data ?? null;
  const pending = row?.status === 'pending';
  const declined = !verified && !pending && (row?.status === 'rejected' || row?.status === 'declined');
  const rawKind = row?.kind ?? (p?.pro_kind as string | null | undefined) ?? null;

  return {
    verified,
    pending,
    declined,
    kind: isProKind(rawKind) ? rawKind : null,
    tour: (row?.pro_tour ?? (p?.pro_tour as string | null | undefined)) ?? null,
    tourCode: (row?.pro_tour_code ?? (p?.pro_tour_code as string | null | undefined)) ?? null,
    club: (row?.pro_club ?? (p?.pro_club as string | null | undefined)) ?? null,
    body: (row?.pro_body ?? (p?.pro_body as string | null | undefined)) ?? null,
    reviewReason: row?.review_reason ?? null,
    request: row,
    isLoading: request.isLoading,
  };
}

/** §1 — request, withdraw and decide all land here. */
export function useInvalidateMyProStatus() {
  const qc = useQueryClient();
  return (userId: string) => {
    void qc.invalidateQueries({ queryKey: ['my-pro-request', userId] });
    void qc.invalidateQueries({ queryKey: ['profile', userId] });
  };
}
