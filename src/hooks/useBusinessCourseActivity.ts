/**
 * CB99: get_business_course_activity alone owns availability, totals, visitor
 * privacy and row ordering. Never re-count or fall back to client table reads.
 * Period switches retain the complete previous payload until the read settles.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BusinessCourseActivity = { available: false } | {
  available: true;
  period_days: number;
  rounds: number;
  prev_rounds: number;
  golfers: number;
  member_rounds: number;
  visitor_rounds: number;
  unknown_rounds: number;
  visitors: number;
  repeat_visitors: number;
  courses: { course_id: string; name: string; rounds: number }[];
  regions: { region: string; count: number }[] | null;
  elsewhere: number | null;
  last_round: string | null;
};

export function useBusinessCourseActivity(businessId: string | undefined, days: number) {
  return useQuery({
    queryKey: ['business-course-activity', businessId, days],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<BusinessCourseActivity> => {
      const { data, error } = await (supabase.rpc as any)('get_business_course_activity', { p_business_id: businessId, p_days: days });
      if (error) throw error;
      return typeof data === 'string' ? JSON.parse(data) : data;
    },
  });
}