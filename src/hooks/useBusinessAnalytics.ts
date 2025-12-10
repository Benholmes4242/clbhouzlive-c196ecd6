import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AnalyticsRange = '7d' | '30d' | '90d';

const RANGE_TO_DAYS: Record<AnalyticsRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export interface DailyAnalytics {
  day: string;
  profile_views: number;
  directory_impressions: number;
  click_outs: number;
  post_views: number;
  post_engagements: number;
  message_clicks: number;
  mentions: number;
}

export interface HeadlineStats {
  profile_views: number;
  directory_impressions: number;
  click_outs: number;
  post_views: number;
  post_engagements: number;
  message_clicks: number;
  mentions: number;
}

export function useBusinessAnalytics(businessProfileId?: string, range: AnalyticsRange = '30d') {
  const days = RANGE_TO_DAYS[range];

  const dailyQuery = useQuery({
    queryKey: ['business-analytics-daily', businessProfileId, days],
    enabled: !!businessProfileId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_business_profile_analytics', {
        p_business_profile_id: businessProfileId,
        p_days: days,
      });
      if (error) throw error;
      return (data ?? []) as DailyAnalytics[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const headlineQuery = useQuery({
    queryKey: ['business-analytics-headline', businessProfileId, days],
    enabled: !!businessProfileId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_business_profile_headline_stats', {
        p_business_profile_id: businessProfileId,
        p_days: days,
      });
      if (error) throw error;
      const defaultStats: HeadlineStats = {
        profile_views: 0,
        directory_impressions: 0,
        click_outs: 0,
        post_views: 0,
        post_engagements: 0,
        message_clicks: 0,
        mentions: 0,
      };
      if (!data) return defaultStats;
      // Parse the JSON response
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return {
        profile_views: Number(parsed.profile_views) || 0,
        directory_impressions: Number(parsed.directory_impressions) || 0,
        click_outs: Number(parsed.click_outs) || 0,
        post_views: Number(parsed.post_views) || 0,
        post_engagements: Number(parsed.post_engagements) || 0,
        message_clicks: Number(parsed.message_clicks) || 0,
        mentions: Number(parsed.mentions) || 0,
      } as HeadlineStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    range,
    days,
    daily: dailyQuery.data ?? [],
    headline: headlineQuery.data ?? {
      profile_views: 0,
      directory_impressions: 0,
      click_outs: 0,
      post_views: 0,
      post_engagements: 0,
      message_clicks: 0,
      mentions: 0,
    },
    isLoading: dailyQuery.isLoading || headlineQuery.isLoading,
    error: dailyQuery.error || headlineQuery.error,
  };
}
