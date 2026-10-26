/**
 * Insights section 6 "Engagement" (CB88).
 *
 * Reads `get_business_engagement` (hand-applied INSIGHTS_ENGAGEMENT_V1, not
 * yet in generated types). The server owns every count — golfers reached,
 * distinct golfers engaged, likes, comments, team excluded — so the client
 * never re-counts. Previous-period data stays on screen while a new period loads.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessEngagement {
  period_days: number;
  reached: number;
  engaged: number;
  engaged_prev: number;
  likes: number;
  comments: number;
  has_posts: boolean;
}

const num = (v: unknown) => Number(v) || 0;

export function parseEngagement(raw: any, days: number): BusinessEngagement {
  const p = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  return {
    period_days: num(p.period_days) || days,
    reached: num(p.reached),
    engaged: num(p.engaged),
    engaged_prev: num(p.engaged_prev),
    likes: num(p.likes),
    comments: num(p.comments),
    has_posts: p.has_posts === true,
  };
}

export function useBusinessEngagement(businessId: string | undefined, days: number) {
  return useQuery({
    queryKey: ['business-engagement', businessId, days],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<BusinessEngagement> => {
      const { data, error } = await (supabase.rpc as any)('get_business_engagement', {
        p_business_id: businessId,
        p_days: days,
      });
      if (error) throw error;
      return parseEngagement(data, days);
    },
  });
}
