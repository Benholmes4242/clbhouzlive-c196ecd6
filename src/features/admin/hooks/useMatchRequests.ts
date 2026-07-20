import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MatchRequestStatus = 'pending' | 'matched' | 'rejected';

export interface MatchRequestRow {
  id: string;
  user_id: string;
  golf_course_id: string;
  whs_course_name: string | null;
  status: MatchRequestStatus;
  created_at: string;
  resolved_at: string | null;
  course_name: string | null;
  requester_name: string | null;
  requester_username: string | null;
}

export const MATCH_REQUESTS_KEY = ['admin-match-requests'] as const;

export async function fetchMatchRequests(status: MatchRequestStatus): Promise<MatchRequestRow[]> {
  const { data, error } = await supabase
    .from('whs_course_match_requests')
    .select(
      `
      id, user_id, golf_course_id, whs_course_name, status, created_at, resolved_at,
      golf_courses:golf_course_id ( name ),
      user_profiles:user_id ( display_name, username )
    `,
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    golf_course_id: r.golf_course_id,
    whs_course_name: r.whs_course_name,
    status: r.status as MatchRequestStatus,
    created_at: r.created_at,
    resolved_at: r.resolved_at,
    course_name: r.golf_courses?.name ?? null,
    requester_name: r.user_profiles?.display_name ?? null,
    requester_username: r.user_profiles?.username ?? null,
  }));
}

export function useMatchRequests(status: MatchRequestStatus = 'pending') {
  return useQuery({
    queryKey: [...MATCH_REQUESTS_KEY, status],
    queryFn: () => fetchMatchRequests(status),
    staleTime: 30_000,
  });
}
