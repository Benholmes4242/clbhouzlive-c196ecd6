import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type InsightsRange = '7d' | '30d' | '90d';
const RANGE_TO_DAYS: Record<InsightsRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

export interface HeadlineMetric { value: number; prev: number }

export interface BusinessInsightsHeadline {
  profile_views: HeadlineMetric;
  unique_visitors: HeadlineMetric;
  directory_impressions: HeadlineMetric;
  click_outs: HeadlineMetric;
  message_clicks: HeadlineMetric;
  new_followers: HeadlineMetric;
  total_followers: number;
}

export interface VisitsSeriesPoint { day: string; total: number; unique: number }
export interface FollowersSeriesPoint { day: string; count: number }
export interface DiscoverySource {
  source: 'direct' | 'directory' | 'search' | 'feed' | 'shared' | 'course_page' | string;
  count: number;
}
export interface TopContent {
  post_id: string;
  content_preview: string;
  created_at: string;
  impressions: number;
  likes: number;
  comments: number;
}

export interface BusinessInsights {
  headline: BusinessInsightsHeadline;
  visits_series: VisitsSeriesPoint[];
  followers_series: FollowersSeriesPoint[];
  sources: DiscoverySource[];
  content: TopContent[];
}

const EMPTY_METRIC: HeadlineMetric = { value: 0, prev: 0 };
const EMPTY: BusinessInsights = {
  headline: {
    profile_views: EMPTY_METRIC,
    unique_visitors: EMPTY_METRIC,
    directory_impressions: EMPTY_METRIC,
    click_outs: EMPTY_METRIC,
    message_clicks: EMPTY_METRIC,
    new_followers: EMPTY_METRIC,
    total_followers: 0,
  },
  visits_series: [],
  followers_series: [],
  sources: [],
  content: [],
};

function toMetric(raw: any): HeadlineMetric {
  if (!raw || typeof raw !== 'object') return EMPTY_METRIC;
  return { value: Number(raw.value) || 0, prev: Number(raw.prev) || 0 };
}

export function useBusinessInsights(businessId: string | undefined, range: InsightsRange = '30d') {
  const days = RANGE_TO_DAYS[range];
  const query = useQuery({
    queryKey: ['business-insights', businessId, days],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<BusinessInsights> => {
      const { data, error } = await supabase.rpc('get_business_insights', {
        p_business_id: businessId!,
        p_days: days,
      });
      if (error) throw error;
      const parsed: any = typeof data === 'string' ? JSON.parse(data) : (data ?? {});
      const h = parsed.headline ?? {};
      return {
        headline: {
          profile_views: toMetric(h.profile_views),
          unique_visitors: toMetric(h.unique_visitors),
          directory_impressions: toMetric(h.directory_impressions),
          click_outs: toMetric(h.click_outs),
          message_clicks: toMetric(h.message_clicks),
          new_followers: toMetric(h.new_followers),
          total_followers: Number(h.total_followers) || 0,
        },
        visits_series: Array.isArray(parsed.visits_series) ? parsed.visits_series.map((p: any) => ({
          day: String(p.day),
          total: Number(p.total) || 0,
          unique: Number(p.unique) || 0,
        })) : [],
        followers_series: Array.isArray(parsed.followers_series) ? parsed.followers_series.map((p: any) => ({
          day: String(p.day),
          count: Number(p.count) || 0,
        })) : [],
        sources: Array.isArray(parsed.sources) ? parsed.sources.map((s: any) => ({
          source: String(s.source ?? 'direct'),
          count: Number(s.count) || 0,
        })) : [],
        content: Array.isArray(parsed.content) ? parsed.content.map((c: any) => ({
          post_id: String(c.post_id),
          content_preview: String(c.content_preview ?? ''),
          created_at: String(c.created_at ?? ''),
          impressions: Number(c.impressions) || 0,
          likes: Number(c.likes) || 0,
          comments: Number(c.comments) || 0,
        })) : [],
      };
    },
  });

  return {
    range,
    days,
    data: query.data ?? EMPTY,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Percent-change helper. Returns null when previous == 0 (do not fabricate).
 */
export function deltaPct(value: number, prev: number): number | null {
  if (!prev || prev <= 0) return null;
  return ((value - prev) / prev) * 100;
}
