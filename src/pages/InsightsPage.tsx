/**
 * InsightsPage - Personal Creator Insights
 * 
 * Dedicated analytics page for Personal Creator Mode users (is_creator = true).
 * Shows last 28 days of metrics from profile_daily_metrics table.
 * 
 * Business Creator insights are at /businesses/:id/insights
 */

import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfileData } from '@/hooks/useProfileData';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Bookmark,
  ChevronLeft,
  Sparkles,
  X,
  Lightbulb
} from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileDailyMetric {
  metric_date: string;
  profile_id: string;
  profile_type: string;
  impressions: number;
  profile_visits: number;
  new_followers: number;
  engagements: number;
  post_views: number;
  post_likes: number;
  post_comments: number;
  post_saves: number;
  unique_viewers: number;
}

export default function InsightsPage() {
  const { hasCreatorFeatures } = usePermissions();
  const { profile } = useProfileData();
  const navigate = useNavigate();
  
  // Check if first visit to insights
  const [showInsightsWelcome, setShowInsightsWelcome] = useState(false);

  useEffect(() => {
    const hasSeenInsights = localStorage.getItem('has_seen_insights_welcome');
    if (!hasSeenInsights && hasCreatorFeatures) {
      setShowInsightsWelcome(true);
    }
  }, [hasCreatorFeatures]);

  const dismissInsightsWelcome = () => {
    setShowInsightsWelcome(false);
    localStorage.setItem('has_seen_insights_welcome', 'true');
  };
  
  // Redirect if user doesn't have creator features
  if (!hasCreatorFeatures) {
    return <Navigate to="/" replace />;
  }
  
  // Fetch last 28 days of metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['profile-insights', profile?.id],
    queryFn: async () => {
      const twentyEightDaysAgo = new Date();
      twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
      
      const { data, error } = await supabase
        .from('profile_daily_metrics')
        .select('*')
        .eq('profile_id', profile?.id)
        .eq('profile_type', 'personal')
        .gte('metric_date', twentyEightDaysAgo.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ProfileDailyMetric[];
    },
    enabled: !!profile?.id && hasCreatorFeatures,
  });
  
  // Calculate totals
  const totals = metrics?.reduce((acc, day) => ({
    impressions: acc.impressions + (day.impressions || 0),
    profile_visits: acc.profile_visits + (day.profile_visits || 0),
    new_followers: acc.new_followers + (day.new_followers || 0),
    engagements: acc.engagements + (day.engagements || 0),
    post_views: acc.post_views + (day.post_views || 0),
    post_likes: acc.post_likes + (day.post_likes || 0),
    post_comments: acc.post_comments + (day.post_comments || 0),
    post_saves: acc.post_saves + (day.post_saves || 0),
    unique_viewers: acc.unique_viewers + (day.unique_viewers || 0),
  }), {
    impressions: 0,
    profile_visits: 0,
    new_followers: 0,
    engagements: 0,
    post_views: 0,
    post_likes: 0,
    post_comments: 0,
    post_saves: 0,
    unique_viewers: 0,
  });
  
  // Calculate engagement rate
  const engagementRate = totals && totals.impressions > 0 
    ? ((totals.engagements / totals.impressions) * 100).toFixed(1)
    : '0.0';

  return (
    <PageRoot className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Creator Insights</h1>
              <p className="text-xs text-muted-foreground">Last 28 days performance</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* First Visit Welcome Banner */}
      <AnimatePresence>
        {showInsightsWelcome && (
          <motion.div 
            className="px-4 pt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div 
              className="relative p-4 rounded-xl border"
              style={{ 
                background: 'linear-gradient(135deg, rgba(247, 147, 30, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)',
                borderColor: 'rgba(247, 147, 30, 0.2)',
              }}
            >
              <button
                onClick={dismissInsightsWelcome}
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
              
              <div className="flex items-start gap-3 pr-6">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #F7931E 0%, #f97316 100%)' }}
                >
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Welcome to Creator Insights!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Track your impressions, engagement, and audience growth. Data updates daily based on your content performance.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="p-4 pb-24 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="h-4 w-20 bg-muted rounded mb-2" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Primary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={<Eye className="h-4 w-4" />}
                label="Impressions" 
                value={totals?.impressions || 0} 
                color="blue"
              />
              <StatCard 
                icon={<Users className="h-4 w-4" />}
                label="Profile Visits" 
                value={totals?.profile_visits || 0}
                color="green"
              />
              <StatCard 
                icon={<TrendingUp className="h-4 w-4" />}
                label="New Followers" 
                value={totals?.new_followers || 0}
                color="purple"
              />
              <StatCard 
                icon={<BarChart3 className="h-4 w-4" />}
                label="Engagement Rate" 
                value={`${engagementRate}%`}
                color="orange"
                isPercentage
              />
            </div>
            
            {/* Secondary Stats */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Content Performance
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard 
                  icon={<Eye className="h-4 w-4" />}
                  label="Post Views" 
                  value={totals?.post_views || 0}
                  color="gray"
                  size="sm"
                />
                <StatCard 
                  icon={<Heart className="h-4 w-4" />}
                  label="Likes" 
                  value={totals?.post_likes || 0}
                  color="red"
                  size="sm"
                />
                <StatCard 
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="Comments" 
                  value={totals?.post_comments || 0}
                  color="blue"
                  size="sm"
                />
                <StatCard 
                  icon={<Bookmark className="h-4 w-4" />}
                  label="Saves" 
                  value={totals?.post_saves || 0}
                  color="yellow"
                  size="sm"
                />
              </div>
            </div>
            
            {/* Unique Viewers */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Viewers</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {(totals?.unique_viewers || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Individual accounts that viewed your content
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            
            {/* Empty State */}
            {metrics?.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No data yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Start posting content to see your creator insights. Analytics will appear here once your content starts getting views.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </PageRoot>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'red' | 'yellow';
  size?: 'sm' | 'md';
  isPercentage?: boolean;
}

function StatCard({ icon, label, value, color, size = 'md', isPercentage }: StatCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    gray: 'bg-muted text-muted-foreground',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
  };
  
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${colorStyles[color]}`}>
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className={`font-bold text-foreground tabular-nums ${size === 'sm' ? 'text-xl' : 'text-2xl'}`}>
        {isPercentage ? value : (typeof value === 'number' ? value.toLocaleString() : value)}
      </p>
    </div>
  );
}
