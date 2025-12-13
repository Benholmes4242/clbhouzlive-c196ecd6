import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GolferVerificationRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  invited_by: string;
  evidence_url: string | null;
  note: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  approval_count: number;
  required_approvals: number;
}

/**
 * Fetches the latest verification request for a golfer/personal profile
 */
export function useGolferVerificationRequest(userId: string | undefined) {
  return useQuery({
    queryKey: ['golfer-verification-request', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('golfer_verification_requests')
        .select('id, user_id, status, invited_by, evidence_url, note, admin_note, created_at, reviewed_at, approval_count, required_approvals')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[useGolferVerificationRequest] error', error);
        throw error;
      }

      return data as GolferVerificationRequest | null;
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Fetches golfer cooldown data from user_profiles
 */
export function useGolferCooldown(userId: string | undefined) {
  return useQuery({
    queryKey: ['golfer-cooldown', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      // Check if there's a cooldown from the verification_audit_log
      const { data, error } = await supabase
        .from('verification_audit_log')
        .select('action, created_at')
        .eq('entity_type', 'person')
        .eq('entity_id', userId)
        .in('action', ['rejected', 'revoked'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      // Calculate cooldown based on action
      const actionDate = new Date(data.created_at);
      const cooldownDays = data.action === 'revoked' ? 7 : 14;
      const cooldownUntil = new Date(actionDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000);

      if (cooldownUntil <= new Date()) return null;

      return {
        cooldownUntil,
        lastAction: data.action as 'rejected' | 'revoked',
      };
    },
    staleTime: 30_000,
  });
}

/**
 * Derive verification state from user profile and request data
 */
export function deriveGolferVerificationState(
  isVerified: boolean | null | undefined,
  request: GolferVerificationRequest | null | undefined
): 'verified' | 'pending' | 'rejected' | 'none' {
  if (isVerified) return 'verified';
  if (!request) return 'none';
  if (request.status === 'pending') return 'pending';
  if (request.status === 'rejected') return 'rejected';
  if (request.status === 'approved') return 'verified';
  return 'none';
}
