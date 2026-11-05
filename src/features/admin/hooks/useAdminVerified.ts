/** Verified catalogue is owned by the admin-only RPC, never overview flags or table reads. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProKind } from '@/features/pro-verification/proRules';
export interface VerifiedPerson { id: string; display_name: string | null; username: string | null; avatar_url: string | null; verified_at: string }
export interface VerifiedPro extends VerifiedPerson { pro_kind: ProKind; pro_tour: string | null; pro_club: string | null }
export interface PendingPro { request_id: string; user_id: string; display_name: string | null; username: string | null; avatar_url: string | null; kind: ProKind; pro_tour: string | null; pro_club: string | null; requested_at: string }
export interface VerifiedBusiness { id: string; name: string; slug: string | null; logo_url: string | null; category: string | null; verified_at: string | null }
export interface AdminVerified { pros: VerifiedPro[]; pending: PendingPro[]; golfers: VerifiedPerson[]; businesses: VerifiedBusiness[] }
export function adminVerifiedCount(data: AdminVerified | undefined) {
  return data ? data.pros.length + data.pending.length + data.golfers.length + data.businesses.length : undefined;
}
export async function fetchAdminVerified(): Promise<AdminVerified> {
  const { data, error } = await supabase.rpc('get_admin_verified');
  if (error) throw error;
  return data as unknown as AdminVerified;
}
export function useAdminVerified() {
  return useQuery({ queryKey: ['admin-verified'], queryFn: fetchAdminVerified, staleTime: 60_000 });
}