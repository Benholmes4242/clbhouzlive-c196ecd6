/** Existing catalogue remains RPC-owned; WAGR uses the admin-readable claim
 * table and its published summary. Failed WAGR reads fail the catalogue. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProKind } from '@/features/pro-verification/proRules';
export interface VerifiedPerson { id: string; display_name: string | null; username: string | null; avatar_url: string | null; verified_at: string }
export interface VerifiedPro extends VerifiedPerson { pro_kind: ProKind; pro_tour: string | null; pro_club: string | null }
export interface PendingPro { request_id: string; user_id: string; display_name: string | null; username: string | null; avatar_url: string | null; kind: ProKind; pro_tour: string | null; pro_club: string | null; requested_at: string }
export interface VerifiedBusiness { id: string; name: string; slug: string | null; logo_url: string | null; category: string | null; verified_at: string | null }
export interface VerifiedAmateur extends VerifiedPerson { rank: number | null; last_synced_at: string | null; last_error: string | null }
export interface AdminVerified { amateurs?: VerifiedAmateur[]; pros: VerifiedPro[]; pending: PendingPro[]; golfers: VerifiedPerson[]; businesses: VerifiedBusiness[] }
export function adminVerifiedCount(data: AdminVerified | undefined) {
  return data ? data.pros.length + data.pending.length + data.golfers.length + data.businesses.length + (data.amateurs?.length ?? 0) : undefined;
}
export async function fetchAdminVerified(): Promise<AdminVerified> {
  const { data, error } = await supabase.rpc('get_admin_verified');
  if (error) throw error;
  return data as unknown as AdminVerified;
}
export async function fetchAdminAmateurs(): Promise<VerifiedAmateur[]> {
  const amateurs: VerifiedAmateur[] = [];
  for (let offset = 0; ; offset += 1000) {
    const links = await supabase.from('amateur_rank_links').select('user_id,reviewed_at,last_synced_at,last_error').eq('status', 'verified').order('user_id').range(offset, offset + 999);
    if (links.error) throw links.error;
    for (let start = 0; start < (links.data?.length ?? 0); start += 100) {
      const batch = links.data?.slice(start, start + 100) ?? [];
      const ids = batch.map(row => row.user_id);
      const [profiles, summaries] = await Promise.all([
        supabase.from('user_profiles').select('id,display_name,username,profile_photo_url').in('id', ids),
        supabase.from('amateur_rank_summary').select('user_id,rank').in('user_id', ids),
      ]);
      if (profiles.error) throw profiles.error;
      if (summaries.error) throw summaries.error;
      for (const link of batch) {
        const member = profiles.data?.find(p => p.id === link.user_id);
        amateurs.push({ id: link.user_id, display_name: member?.display_name ?? null, username: member?.username ?? null, avatar_url: member?.profile_photo_url ?? null, verified_at: link.reviewed_at ?? '', rank: summaries.data?.find(p => p.user_id === link.user_id)?.rank ?? null, last_synced_at: link.last_synced_at, last_error: link.last_error });
      }
    }
    if (!links.data || links.data.length < 1000) break;
  }
  return amateurs;
}
export function useAdminVerified() {
  const catalogue = useQuery({ queryKey: ['admin-verified'], queryFn: fetchAdminVerified, staleTime: 60_000 });
  const amateurs = useQuery({ queryKey: ['admin-verified', 'amateurs'], queryFn: fetchAdminAmateurs, staleTime: 60_000 });
  return { ...catalogue, data: catalogue.data ? { ...catalogue.data, amateurs: amateurs.data ?? [] } : undefined, isPending: catalogue.isPending || amateurs.isPending, isError: catalogue.isError || amateurs.isError };
}