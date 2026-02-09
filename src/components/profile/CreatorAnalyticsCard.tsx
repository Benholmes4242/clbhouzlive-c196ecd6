import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, Users, Bookmark, TrendingUp, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CreatorAnalyticsCardProps {
  userId: string;
  className?: string;
}

/**
 * Phase 3.4: Creator Analytics (v1)
 * 
 * Read-only analytics card for creators showing real stats from profile_daily_metrics.
 * Shows last 7 days with week-over-week trend comparison.
 * Links to full /insights page.
 */
export function CreatorAnalyticsCard({ userId, className }: CreatorAnalyticsCardProps) {
  const navigate = useNavigate();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['creator-analytics-card', userId],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data, error } = await supabase
        .from('profile_daily_metrics')
        .select('metric_date, impressions, unique_viewers, post_saves')
        .eq('profile_id', userId)
        .eq('profile_type', 'personal')
        .gte('metric_date', fourteenDaysAgo.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (error) throw error;

      const thisWeekStart = sevenDaysAgo.toISOString().split('T')[0];
      const thisWeek = (data || []).filter(d => d.metric_date >= thisWeekStart);
      const lastWeek = (data || []).filter(d => d.metric_date < thisWeekStart);

      const sum = (arr: typeof data, key: 'impressions' | 'unique_viewers' | 'post_saves') =>
        (arr || []).reduce((acc, d) => acc + (d[key] || 0), 0);

      const views = sum(thisWeek, 'impressions');
      const reach = sum(thisWeek, 'unique_viewers');
      const saves = sum(thisWeek, 'post_saves');

      const prevViews = sum(lastWeek, 'impressions');
      let trendPercent: number | null = null;
      if (prevViews > 0) {
        trendPercent = Math.round(((views - prevViews) / prevViews) * 100);
      } else if (views > 0) {
        trendPercent = 100;
      }

      return { views, reach, saves, trendPercent };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const stats = [
    { icon: Eye, label: 'Views', value: analytics?.views ?? 0 },
    { icon: Users, label: 'Reach', value: analytics?.reach ?? 0 },
    { icon: Bookmark, label: 'Saves', value: analytics?.saves ?? 0 },
  ];

  const trendColor = analytics?.trendPercent != null
    ? analytics.trendPercent > 0 ? 'text-emerald-500' : analytics.trendPercent < 0 ? 'text-red-500' : 'text-muted-foreground'
    : '';
  const trendBg = analytics?.trendPercent != null
    ? analytics.trendPercent > 0 ? 'bg-emerald-500/10' : analytics.trendPercent < 0 ? 'bg-red-500/10' : 'bg-muted'
    : '';

  return (
    <div 
      className={`bg-card border border-border rounded-[18px] shadow-sm ${className ?? ''}`}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#F7931E]" />
          <span className="text-sm font-semibold text-foreground">Creator Stats</span>
        </div>
        {!isLoading && analytics?.trendPercent != null && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendBg} ${trendColor}`}>
            {analytics.trendPercent > 0 ? '+' : ''}{analytics.trendPercent}% this week
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 divide-x divide-border">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="py-4 text-center">
            <div className="flex justify-center mb-1.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            {isLoading ? (
              <div className="mx-auto h-6 w-10 bg-muted rounded animate-pulse mb-1" />
            ) : (
              <p className="text-lg font-semibold text-foreground tabular-nums">
                {value.toLocaleString()}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button
        onClick={() => navigate('/insights')}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors border-t border-border bg-muted/30"
        style={{ borderRadius: '0 0 18px 18px' }}
      >
        <span className="text-sm font-medium text-[#F7931E]">View Full Insights</span>
        <ChevronRight className="h-4 w-4 text-[#F7931E]" />
      </button>
    </div>
  );
}

export default CreatorAnalyticsCard;
