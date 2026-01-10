import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, TrendingUp, Eye, Users, MessageSquare } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const CreatorInsightsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  // Fetch creator page by slug
  const { data: creatorPage, isLoading } = useQuery({
    queryKey: ['creator-page', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_pages')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch daily metrics (last 28 days)
  const { data: metrics } = useQuery({
    queryKey: ['creator-metrics', creatorPage?.id],
    enabled: !!creatorPage?.id,
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      const { data, error } = await supabase
        .from('creator_daily_metrics')
        .select('*')
        .eq('creator_page_id', creatorPage!.id)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: false });
      
      if (error) throw error;
      return data ?? [];
    },
  });

  // Calculate totals
  const totals = metrics?.reduce((acc, day) => ({
    impressions: acc.impressions + (day.impressions || 0),
    profile_visits: acc.profile_visits + (day.profile_visits || 0),
    new_followers: acc.new_followers + (day.new_followers || 0),
    engagements: acc.engagements + (day.engagements || 0),
  }), { impressions: 0, profile_visits: 0, new_followers: 0, engagements: 0 }) ?? { impressions: 0, profile_visits: 0, new_followers: 0, engagements: 0 };

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </PageRoot>
    );
  }

  if (!creatorPage) {
    return (
      <PageRoot className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-muted-foreground mb-4">Creator page not found</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </PageRoot>
    );
  }

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <PageRoot className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="mx-auto max-w-xl px-4 pt-3 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <h1 className="text-xl font-semibold text-center">Insights</h1>
          <p className="text-sm text-muted-foreground text-center mt-0.5">
            {creatorPage.display_name}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {/* Period selector */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium text-muted-foreground">Last 28 days</h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Impressions</span>
            </div>
            <p className="text-2xl font-semibold">{formatNumber(totals.impressions)}</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Profile Visits</span>
            </div>
            <p className="text-2xl font-semibold">{formatNumber(totals.profile_visits)}</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">New Followers</span>
            </div>
            <p className="text-2xl font-semibold">{formatNumber(totals.new_followers)}</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Engagements</span>
            </div>
            <p className="text-2xl font-semibold">{formatNumber(totals.engagements)}</p>
          </div>
        </div>

        {/* Placeholder for charts */}
        <div className="bg-white rounded-xl p-6 border border-border/50 text-center">
          <p className="text-muted-foreground text-sm">
            Detailed charts and top posts coming soon
          </p>
        </div>
      </main>
    </PageRoot>
  );
};

export default CreatorInsightsPage;
