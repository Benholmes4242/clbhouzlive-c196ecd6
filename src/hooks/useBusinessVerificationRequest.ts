import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

export interface BusinessVerificationRequest {
  id: string;
  business_id: string;
  // 'superseded' is set automatically by the DB when a newer request replaces
  // an older needs_more_info/rejected row (see supersede_prior_verification_requests
  // trigger). It is treated as terminal and maps to 'none' in deriveVerificationState.
  status: 'pending' | 'approved' | 'rejected' | 'revoked' | 'needs_more_info' | 'cancelled' | 'superseded';
  requested_by: string;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
  /** PHASE 4 §3.3 — structured decision reason; null on pre-Phase-4 rows. */
  review_reason: string | null;
  // admin-initiated flag; client never sets this. When true the owner must
  // complete the Domain step before an admin can approve the request.
  requires_domain_check: boolean;
  domain: string | null;
  domain_confirmed: boolean;
  contact_email: string | null;
  contact_role: string | null;
  /** PHASE 3 signals object; read-only here, drives the evidence line. */
  proof_metadata: unknown;
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
        .select('id, business_id, status, requested_by, created_at, reviewed_at, admin_note, review_reason, requires_domain_check, domain, domain_confirmed, contact_email, contact_role, proof_metadata')
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
      return data as unknown as BusinessVerificationRequest | null;
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
  // Cancelled requests are treated as never-applied: the Get-verified prompt
  // should show again. Explicit mapping so this is not a silent fall-through.
  if (request.status === 'cancelled') return 'none';
  // Superseded means a newer request has taken over. This row is terminal and
  // no longer represents the live state, so map to 'none' - the newer row
  // (fetched by created_at DESC LIMIT 1) will drive the actual state.
  if (request.status === 'superseded') return 'none';
  if (request.status === 'approved') return 'verified';
  return 'none';
}
