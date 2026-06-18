import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

export interface BusinessVerificationRequest {
  id: string;
  business_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked' | 'needs_more_info';
  requested_by: string;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
  requires_domain_check: boolean;
  domain: string | null;
  domain_confirmed: boolean;
}

/**
 * Fetches the latest verification request for a business
 */
export function useBusinessVerificationRequest(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-verification-request', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return null;

      const { data, error } = await supabase
        .from('business_verification_requests')
        .select('id, business_id, status, requested_by, created_at, reviewed_at, admin_note, requires_domain_check, domain, domain_confirmed')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        AppLog.error('[useBusinessVerificationRequest]', 'error', error);
        throw error;
      }

      // NOTE: BusinessVerificationRequest.status is cast from string — if new statuses
      // are added to the DB, update the union type in this file to match.
      return data as BusinessVerificationRequest | null;
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Derive verification state from business and request data
 */
export function deriveVerificationState(
  isVerified: boolean | null | undefined,
  request: BusinessVerificationRequest | null | undefined
): 'verified' | 'pending' | 'needs_more_info' | 'rejected' | 'none' {
  if (isVerified) return 'verified';
  if (!request) return 'none';
  if (request.status === 'pending') return 'pending';
  if (request.status === 'needs_more_info') return 'needs_more_info';
  if (request.status === 'rejected') return 'rejected';
  // Revoked status means unverified - show as 'none' to allow re-request
  if (request.status === 'revoked') return 'none';
  if (request.status === 'approved') return 'verified';
  return 'none';
}
