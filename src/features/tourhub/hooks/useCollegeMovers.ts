import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeasonId } from './useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from './useCollegeMedia';
import type { CollegeSeasonStats } from './useCollegeStats';

export interface CollegeWeeklyMover {
  id: string;
  season_id: string;
  week_start: string;
  normalized_name: string;
  earnings_delta: number;
  wins_delta: number;
  cuts_delta: number;
  top10_delta: number;
  earnings_rank_this_week: number | null;
  earnings_rank_last_week: number | null;
  earnings_rank_change: number | null;
  // Joined
  college?: CollegeMedia | null;
}

export interface CollegeRivalry {
  id: string;
  college_a: string;
  college_b: string;
  weight: number;
}

/**
 * Fetches weekly movers for the current week.
 * direction: 'up' = positive delta, 'down' = negative delta
 */
export function useCollegeWeeklyMovers(options?: {
  direction?: 'up' | 'down';
  metric?: 'earnings' | 'wins' | 'cuts' | 'top10s';
  limit?: number;
}) {
  const { direction = 'up', metric = 'earnings', limit = 10 } = options || {};
  const seasonId = useCurrentSeasonId();
  const { data: collegeMap } = useCollegeMediaMap();
  
  return useQuery({
    queryKey: ['college-weekly-movers', seasonId, direction, metric, limit],
    queryFn: async () => {
      if (!seasonId) return [];
      
      // Fetch the latest available week_start instead of computing it
      const { data: latestWeek } = await supabase
        .from('college_weekly_movers')
        .select('week_start')
        .eq('season_id', seasonId)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();
      
      if (!latestWeek?.week_start) return [];
      
      const weekStart = latestWeek.week_start;
      
      const deltaColumn = {
        earnings: 'earnings_delta',
        wins: 'wins_delta',
        cuts: 'cuts_delta',
        top10s: 'top10_delta',
      }[metric];
      
      let query = supabase
        .from('college_weekly_movers')
        .select('*')
        .eq('season_id', seasonId)
        .eq('week_start', weekStart);
      
      if (direction === 'up') {
        query = query.gt(deltaColumn, 0).order(deltaColumn, { ascending: false });
      } else {
        query = query.lt(deltaColumn, 0).order(deltaColumn, { ascending: true });
      }
      
      const { data, error } = await query.limit(limit);
      
      if (error) {
        console.error('[useCollegeWeeklyMovers] Error:', error);
        throw error;
      }
      
      // Enrich with college media
      return (data || []).map(mover => ({
        ...mover,
        college: collegeMap?.get(mover.normalized_name) || null,
      })) as CollegeWeeklyMover[];
    },
    enabled: !!seasonId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches rivalries for a college.
 * Returns all colleges that are rivals (both directions).
 * Falls back to closest-ranked colleges if no rivalries defined.
 */
export function useCollegeRivalries(normalizedName: string | undefined) {
  const { data: collegeMap } = useCollegeMediaMap();
  
  return useQuery({
    queryKey: ['college-rivalries', normalizedName],
    queryFn: async () => {
      if (!normalizedName) return [];
      
      const { data, error } = await supabase
        .from('college_rivalries')
        .select('*')
        .or(`college_a.eq.${normalizedName},college_b.eq.${normalizedName}`)
        .order('weight', { ascending: false });
      
      if (error) {
        console.error('[useCollegeRivalries] Error:', error);
        throw error;
      }
      
      // Extract rival colleges (the "other" side)
      if (data && data.length > 0) {
        return data.map(r => {
          const rivalName = r.college_a === normalizedName ? r.college_b : r.college_a;
          return {
            ...r,
            rivalNormalizedName: rivalName,
            college: collegeMap?.get(rivalName) || null,
            isFallback: false,
          };
        });
      }
      
      // Fallback: get closest-ranked colleges by earnings
      const { data: allStats } = await supabase
        .from('college_season_stats')
        .select('normalized_name, earnings_total')
        .order('earnings_total', { ascending: false });
      
      if (!allStats || allStats.length === 0) return [];
      
      const myIndex = allStats.findIndex(s => s.normalized_name === normalizedName);
      if (myIndex === -1) return [];
      
      // Get up to 3 colleges from nearby ranks (±3 positions)
      const nearby: typeof allStats = [];
      for (let i = Math.max(0, myIndex - 3); i <= Math.min(allStats.length - 1, myIndex + 3); i++) {
        if (i !== myIndex) nearby.push(allStats[i]);
        if (nearby.length >= 3) break;
      }
      
      return nearby.map(c => ({
        id: `fallback-${c.normalized_name}`,
        college_a: normalizedName,
        college_b: c.normalized_name,
        weight: 1,
        created_at: new Date().toISOString(),
        rivalNormalizedName: c.normalized_name,
        college: collegeMap?.get(c.normalized_name) || null,
        isFallback: true,
      }));
    },
    enabled: !!normalizedName,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetches user's followed colleges.
 */
export function useFollowedColleges(userId: string | undefined) {
  return useQuery({
    queryKey: ['followed-colleges', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_followed_colleges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[useFollowedColleges] Error:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

/**
 * Mutations for following/unfollowing colleges.
 */
export function useFollowCollegeMutations(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  const follow = useMutation({
    mutationFn: async (normalizedName: string) => {
      if (!userId) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_followed_colleges')
        .insert({ user_id: userId, normalized_name: normalizedName });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followed-colleges', userId] });
    },
  });
  
  const unfollow = useMutation({
    mutationFn: async (normalizedName: string) => {
      if (!userId) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_followed_colleges')
        .delete()
        .eq('user_id', userId)
        .eq('normalized_name', normalizedName);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followed-colleges', userId] });
    },
  });
  
  return { follow, unfollow };
}

/**
 * Hook to check if a specific college is followed.
 */
export function useIsCollegeFollowed(userId: string | undefined, normalizedName: string | undefined) {
  const { data: followed } = useFollowedColleges(userId);
  
  if (!followed || !normalizedName) return false;
  return followed.some(f => f.normalized_name === normalizedName);
}
