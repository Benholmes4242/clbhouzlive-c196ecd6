import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UnmatchedCourseStatus = 'open' | 'resolved' | 'ignored';

export interface UnmatchedCourseRow {
  whs_course_id: string;
  whs_course_name: string | null;
  round_count: number;
  member_count: number;
  last_tier_tried: string | null;
  echo_suggestion: string | null;
  first_seen_at: string;
  last_attempt_at: string;
  status: UnmatchedCourseStatus;
}

export const UNMATCHED_COURSES_KEY = ['admin-unmatched-courses'] as const;

const sb: any = supabase;

// Plain select - no PostgREST embeds (the single FK to whs_courses is not
// relied on here; the course name is denormalised onto the row).
export async function fetchUnmatchedCourses(
  status: UnmatchedCourseStatus = 'open',
): Promise<UnmatchedCourseRow[]> {
  const { data, error } = await sb
    .from('whs_unmatched_courses')
    .select(
      'whs_course_id, whs_course_name, round_count, member_count, last_tier_tried, echo_suggestion, first_seen_at, last_attempt_at, status',
    )
    .eq('status', status)
    .order('round_count', { ascending: false })
    .order('first_seen_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    whs_course_id: r.whs_course_id,
    whs_course_name: r.whs_course_name ?? null,
    round_count: r.round_count ?? 0,
    member_count: r.member_count ?? 0,
    last_tier_tried: r.last_tier_tried ?? null,
    echo_suggestion: r.echo_suggestion ?? null,
    first_seen_at: r.first_seen_at,
    last_attempt_at: r.last_attempt_at,
    status: r.status as UnmatchedCourseStatus,
  }));
}

export function useUnmatchedCourses(status: UnmatchedCourseStatus = 'open') {
  return useQuery({
    queryKey: [...UNMATCHED_COURSES_KEY, status],
    queryFn: () => fetchUnmatchedCourses(status),
    staleTime: 30_000,
  });
}

// Link the WHS course to a golf_courses row. The DB trigger clears the queue
// row and re-enqueues that course's rounds - never invoke a gam-* function
// from the client.
export async function linkUnmatchedCourse(
  whsCourseId: string,
  golfCourseId: string,
): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id ?? null;

  const payload = {
    golf_course_id: golfCourseId,
    match_method: 'manual_admin',
    match_confidence: 1.0,
    reviewed_at: new Date().toISOString(),
    reviewed_by: uid,
  };

  // Most unmatched courses already have a null-mapping row: UPDATE it in place
  // (the requeue trigger fires on UPDATE OF golf_course_id). If no row exists
  // yet, fall back to a plain INSERT.
  const { data: updated, error: updateError } = await sb
    .from('whs_to_golf_course_map')
    .update(payload)
    .eq('whs_course_id', whsCourseId)
    .select('whs_course_id');
  if (updateError) throw updateError;
  if (updated && updated.length > 0) return;

  const { error: insertError } = await sb
    .from('whs_to_golf_course_map')
    .insert({ whs_course_id: whsCourseId, ...payload });
  if (insertError) throw insertError;
}

export async function ignoreUnmatchedCourse(whsCourseId: string): Promise<void> {
  const { error } = await sb
    .from('whs_unmatched_courses')
    .update({ status: 'ignored' })
    .eq('whs_course_id', whsCourseId);
  if (error) throw error;
}
