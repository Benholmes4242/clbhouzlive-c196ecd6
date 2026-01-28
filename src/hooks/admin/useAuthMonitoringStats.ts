import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/hooks/admin/useAnalyticsData';

export interface AuthMonitoringStats {
  // Core metrics
  totalProfiles: number;
  signups24h: number;
  signups7d: number;
  profileErrorsCount: number;
  
  // Onboarding metrics
  completedOnboarding: number;
  incompleteOnboarding: number;
  onboardingRate: number;
  
  // Issues
  orphanedUsers: number;
  
  // Trends (calculated)
  signupTrend: number; // percentage change
}

export interface AuthEvent {
  id: string;
  created_at: string;
  name: string;
  props: Record<string, unknown>;
  user_id: string | null;
  ua: string | null;
  ip: string | null;
}

export interface ProfileIssue {
  id: string;
  username: string;
  created_at: string;
  has_completed_onboarding: boolean;
  issue_type: 'incomplete_onboarding' | 'no_avatar' | 'missing_details';
}

export function useAuthMonitoringStats(dateRange: DateRange = '7d') {
  const [stats, setStats] = useState<AuthMonitoringStats | null>(null);
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [issues, setIssues] = useState<ProfileIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateThreshold = useCallback((range: DateRange) => {
    const now = new Date();
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '14d':
        return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const rangeThreshold = getDateThreshold(dateRange);

      // Fetch all profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, created_at, has_completed_onboarding, username, profile_photo_url');

      if (profileError) throw profileError;

      const profiles = profileData || [];
      const totalProfiles = profiles.length;
      const completedOnboarding = profiles.filter(p => p.has_completed_onboarding).length;
      const incompleteOnboarding = totalProfiles - completedOnboarding;
      
      // Signups in time ranges
      const signups24h = profiles.filter(p => 
        new Date(p.created_at) > yesterday
      ).length;
      
      const signups7d = profiles.filter(p => 
        new Date(p.created_at) > weekAgo
      ).length;
      
      const signupsLastWeek = profiles.filter(p => 
        new Date(p.created_at) > twoWeeksAgo && new Date(p.created_at) <= weekAgo
      ).length;
      
      // Calculate trend
      const signupTrend = signupsLastWeek > 0 
        ? Math.round(((signups7d - signupsLastWeek) / signupsLastWeek) * 100)
        : signups7d > 0 ? 100 : 0;

      // Fetch profile creation errors
      const { count: errorCount } = await supabase
        .from('profile_creation_errors')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', rangeThreshold.toISOString());

      // Identify issues - users with incomplete profiles
      const issuesList: ProfileIssue[] = profiles
        .filter(p => !p.has_completed_onboarding || !p.profile_photo_url)
        .slice(0, 20)
        .map(p => ({
          id: p.id,
          username: p.username || 'Unknown',
          created_at: p.created_at,
          has_completed_onboarding: p.has_completed_onboarding ?? false,
          issue_type: !p.has_completed_onboarding 
            ? 'incomplete_onboarding' 
            : !p.profile_photo_url 
              ? 'no_avatar' 
              : 'missing_details'
        }));

      // Fetch auth-related analytics events
      const { data: eventData } = await supabase
        .from('analytics_events')
        .select('*')
        .or('name.ilike.%auth%,name.ilike.%login%,name.ilike.%signup%')
        .gte('created_at', rangeThreshold.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      setStats({
        totalProfiles,
        signups24h,
        signups7d,
        profileErrorsCount: errorCount || 0,
        completedOnboarding,
        incompleteOnboarding,
        onboardingRate: totalProfiles > 0 ? Math.round((completedOnboarding / totalProfiles) * 100) : 0,
        orphanedUsers: 0, // Would need auth.users access
        signupTrend,
      });

      setEvents((eventData || []) as AuthEvent[]);
      setIssues(issuesList);
      setError(null);
    } catch (err) {
      console.error('Failed to load auth monitoring stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, getDateThreshold]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, events, issues, loading, error, refresh: loadStats };
}
