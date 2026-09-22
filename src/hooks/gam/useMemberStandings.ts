import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * WHERE YOU STAND — every figure comes from public.get_member_standings and
 * NOTHING is derived here. The RPC is SECURITY DEFINER and gated on
 * auth.uid() = p_user_id OR can_view_handicap, so a viewer without permission
 * gets an error and this hook returns an empty list rather than a partial one.
 *
 * Rows arrive ordered strongest-first; that order IS the display order.
 */
export interface MemberStandingRow {
  course_id: string;
  course_name: string;
  category: string;
  is_tenure: boolean;
  lower_is_better: boolean;
  rank: number;
  field_size: number;
  ahead_count: number;
  behind_count: number;
  value: number | null;
  leader_value: number | null;
  better_value: number | null;
  next_value: number | null;
  attained_at: string | null;
  medal_earned: boolean;
}

function isStandingRow(value: unknown): value is MemberStandingRow {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<MemberStandingRow>;
  return (
    typeof r.course_id === 'string' &&
    typeof r.category === 'string' &&
    typeof r.rank === 'number' &&
    typeof r.field_size === 'number'
  );
}

/**
 * BRIEF_YOU_TAB_STANDINGS — an optional course scope. When courseId is present
 * the RPC is passed p_course_id and the rows are computed within that course's
 * boards only; the query keys on (userId, courseId) so the scoped and unscoped
 * reads never share a cache entry.
 */
export function useMemberStandings(
  userId: string | null | undefined,
  enabled = true,
  courseId?: string | null,
) {
  return useQuery({
    queryKey: ['member-standings', userId, courseId ?? null],
    enabled: enabled && !!userId,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<MemberStandingRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('get_member_standings', {
        p_user_id: userId,
        ...(courseId ? { p_course_id: courseId } : {}),
      });
      if (error || !Array.isArray(data)) return [];
      return data.filter(isStandingRow);
    },
  });
}
