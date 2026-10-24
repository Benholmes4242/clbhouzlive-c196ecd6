import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** CB75: summary and card share this key/read; realtime and CB74 invalidate it.
 * Profile-read failures are query failures, never invented club affiliation. */
export interface AccessRequest {
  id: string;
  business_id: string;
  requester_user_profile_id: string;
  requested_role: string;
  message: string | null;
  status: string;
  created_at: string;
  requester: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    primary_club_id: string | null;
    home_club_visibility: string | null;
  };
}

export function useBusinessAccessRequests(businessId?: string, enabled = false) {
  return useQuery({
    queryKey: ['business-access-requests', businessId],
    enabled: !!businessId && enabled,
    staleTime: 0,
    queryFn: async (): Promise<AccessRequest[]> => {
      const { data, error } = await supabase.from('business_access_requests')
        .select('id, business_id, requester_user_profile_id, requested_role, message, status, created_at')
        .eq('business_id', businessId).eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];
      const { data: profiles, error: profileError } = await supabase.from('user_profiles')
        .select('id, display_name, username, profile_photo_url, primary_club_id, home_club_visibility')
        .in('id', data.map(r => r.requester_user_profile_id));
      if (profileError) throw profileError;
      const byId = new Map(profiles?.map(p => [p.id, p]) ?? []);
      return data.map(r => ({ ...r, requester: byId.get(r.requester_user_profile_id) ?? {
        id: r.requester_user_profile_id, display_name: null, username: null, profile_photo_url: null,
        primary_club_id: null, home_club_visibility: null,
      } }));
    },
  });
}