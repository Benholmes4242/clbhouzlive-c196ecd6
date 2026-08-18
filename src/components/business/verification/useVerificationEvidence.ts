/**
 * BRIEF_VERIFICATION_PHASE_5B §2 — reads the approved request behind a verified
 * business so the profile can state what was confirmed. Read-only, cached long:
 * an approval does not change.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { evidenceLine } from './evidenceLine';

export function useVerificationEvidence(businessId: string | null | undefined, verified: boolean | undefined) {
  const query = useQuery({
    queryKey: ['business-verification-evidence', businessId],
    enabled: !!businessId && !!verified,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select('proof_metadata, reviewed_at')
        .eq('business_id', businessId!)
        .eq('status', 'approved')
        .order('reviewed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.proof_metadata ?? null;
    },
  });

  return {
    /** null until settled, and null forever for a pre-Phase-3 approval (§2.5). */
    line: query.isFetched ? evidenceLine(query.data) : null,
    isFetched: query.isFetched,
  };
}
