import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * RECORD SPLIT — one row per course from public.get_member_record_split, the
 * Course Legend badge's rule (BRIEF_CONTESTED_TITLES). NOTHING is derived here:
 * contested / sole / attendance are passed through exactly as returned.
 */
export interface CourseRecordSplit {
  contested: number;
  sole: number;
  attendance: number;
}

export interface MemberRecordSplit {
  available: boolean;
  byCourse: Map<string, CourseRecordSplit>;
}

const UNAVAILABLE = (): MemberRecordSplit => ({ available: false, byCourse: new Map() });

export function useMemberRecordSplit(userId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['member-record-split', userId],
    enabled: enabled && !!userId,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<MemberRecordSplit> => {
      if (!userId) return UNAVAILABLE();
      const { data, error } = await supabase.rpc('get_member_record_split', {
        p_user_id: userId,
      });
      if (error || !Array.isArray(data)) return UNAVAILABLE();
      const byCourse = new Map<string, CourseRecordSplit>();
      for (const r of data) {
        if (typeof r?.course_id !== 'string') continue;
        byCourse.set(r.course_id, {
          contested: Number(r.contested) || 0,
          sole: Number(r.sole) || 0,
          attendance: Number(r.attendance) || 0,
        });
      }
      return { available: true, byCourse };
    },
  });
}
