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
  // whs_course_match_requests has no FK relationships in PostgREST, so we cannot
  // embed golf_courses / user_profiles. Fetch plain rows then hydrate by id.
  const { data: rows, error } = await supabase
    .from('whs_course_match_requests')
    .select('id, user_id, golf_course_id, whs_course_name, status, created_at, resolved_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  const list = (rows ?? []) as any[];
  if (list.length === 0) return [];

  const courseIds = Array.from(new Set(list.map((r) => r.golf_course_id).filter(Boolean))) as string[];
  const userIds = Array.from(new Set(list.map((r) => r.user_id).filter(Boolean))) as string[];

  const [coursesRes, profilesRes] = await Promise.all([
    courseIds.length
      ? supabase.from('golf_courses').select('id, name').in('id', courseIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    userIds.length
      ? supabase.from('user_profiles').select('id, display_name, username').in('id', userIds)
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);

  const courseMap = new Map<string, { name: string | null }>();
  ((coursesRes.data ?? []) as any[]).forEach((c) => courseMap.set(c.id, { name: c.name ?? null }));
  const profileMap = new Map<string, { display_name: string | null; username: string | null }>();
  ((profilesRes.data ?? []) as any[]).forEach((p) =>
    profileMap.set(p.id, { display_name: p.display_name ?? null, username: p.username ?? null }),
  );

  return list.map((r) => {
    const p = profileMap.get(r.user_id);
    return {
      id: r.id,
      user_id: r.user_id,
      golf_course_id: r.golf_course_id,
      whs_course_name: r.whs_course_name,
      status: r.status as MatchRequestStatus,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      course_name: courseMap.get(r.golf_course_id)?.name ?? null,
      requester_name: p?.display_name ?? null,
      requester_username: p?.username ?? null,
    };
  });
}

export function useMatchRequests(status: MatchRequestStatus = 'pending') {
  return useQuery({
    queryKey: [...MATCH_REQUESTS_KEY, status],
    queryFn: () => fetchMatchRequests(status),
    staleTime: 30_000,
  });
}
