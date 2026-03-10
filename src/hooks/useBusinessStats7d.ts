import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

interface BusinessStats7d {
  visits: number;
  followersGained: number;
  impressions: number;
}

export function useBusinessStats7d(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-stats-7d', businessId],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<BusinessStats7d> => {
      if (!businessId) {
        return { visits: 0, followersGained: 0, impressions: 0 };
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fromDate = sevenDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('business_daily_metrics')
        .select('profile_visits, new_followers, impressions')
        .eq('business_id', businessId)
        .gte('metric_date', fromDate);

      if (error) {
        console.error('[useBusinessStats7d] error', error);
        return { visits: 0, followersGained: 0, impressions: 0 };
      }

      const totals = (data || []).reduce(
        (acc, row) => ({
          visits: acc.visits + (row.profile_visits || 0),
          followersGained: acc.followersGained + (row.new_followers || 0),
          impressions: acc.impressions + (row.impressions || 0),
        }),
        { visits: 0, followersGained: 0, impressions: 0 }
      );

      return totals;
    },
  });
}
