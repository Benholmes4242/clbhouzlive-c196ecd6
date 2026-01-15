/**
 * useLeaderboardMilestones - Fetch user's rank milestones
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RankMilestone } from '@/components/leaderboard/v2/RankHistorySheet';

// Type for milestone from database (using string enums since DB types may not be in sync)
interface MilestoneRow {
  id: string;
  user_id: string;
  milestone_type: string;
  rank_scope: string;
  time_range: string;
  rank_value: number;
  rank_delta: number | null;
  rivals_overtaken: number | null;
  percentile: number | null;
  season_key: string | null;
  created_at: string;
}

// Map milestone_type to display config
function getMilestoneDisplay(row: MilestoneRow): { type: RankMilestone['type']; headline: string } {
  switch (row.milestone_type) {
    case 'new_personal_best':
      return {
        type: 'new_pb',
        headline: `New personal best: #${row.rank_value}`,
      };
    case 'entered_rank_tier':
      return {
        type: 'tier_entry',
        headline: `Entered Global Top ${row.rank_value}`,
      };
    case 'fast_climber':
      return {
        type: 'fast_climber',
        headline: row.rank_delta 
          ? `Fast climber (+${row.rank_delta} places)` 
          : 'Fast climber',
      };
    case 'top_percentile':
      return {
        type: 'tier_entry',
        headline: `Top ${row.percentile || 10}% this ${row.time_range === 'this_month' ? 'month' : 'year'}`,
      };
    case 'overtook_rivals':
      return {
        type: 'overtook_rivals',
        headline: row.rivals_overtaken 
          ? `Overtook ${row.rivals_overtaken} rival${row.rivals_overtaken > 1 ? 's' : ''}`
          : 'Overtook a rival',
      };
    default:
      return {
        type: 'tier_entry',
        headline: 'Achievement unlocked',
      };
  }
}

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Format time range for display
function formatTimeRange(timeRange: string): string {
  switch (timeRange) {
    case 'all_time': return 'All-time';
    case 'this_year': return 'This year';
    case 'this_month': return 'This month';
    default: return timeRange;
  }
}

export function useLeaderboardMilestones(userId: string | null) {
  return useQuery({
    queryKey: ['leaderboard-milestones', userId],
    enabled: !!userId,
    queryFn: async (): Promise<RankMilestone[]> => {
      // Use specific columns instead of select('*')
      const { data, error } = await supabase
        .from('leaderboard_milestones')
        .select(`
          id,
          user_id,
          milestone_type,
          rank_scope,
          time_range,
          rank_value,
          rank_delta,
          rivals_overtaken,
          percentile,
          season_key,
          created_at
        `)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data as MilestoneRow[]).map((row) => {
        const display = getMilestoneDisplay(row);
        return {
          id: row.id,
          type: display.type,
          headline: display.headline,
          context: formatTimeRange(row.time_range),
          timestamp: formatRelativeTime(row.created_at),
          value: row.rank_value,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Build dedupe key for milestone
function buildDedupeKey(
  userId: string,
  milestoneType: string,
  rankScope: string,
  timeRange: string,
  seasonKey: string,
  rankValue: number,
  percentile?: number | null
): string {
  return `u:${userId}|t:${milestoneType}|s:${rankScope}|r:${timeRange}|season:${seasonKey}|v:${rankValue}|p:${percentile || 0}`;
}

// Get current season key (YYYY-MM)
function getCurrentSeasonKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface InsertMilestoneParams {
  milestoneType: 'new_personal_best' | 'entered_rank_tier' | 'fast_climber' | 'top_percentile' | 'overtook_rivals';
  rankScope: 'global' | 'gbi' | 'europe' | 'usa' | 'friends' | 'nearby';
  timeRange: 'all_time' | 'this_year' | 'this_month';
  rankValue: number;
  rankDelta?: number;
  rivalsOvertaken?: number;
  percentile?: number;
}

export function useInsertMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      milestoneType, 
      rankScope, 
      timeRange, 
      rankValue,
      rankDelta,
      rivalsOvertaken,
      percentile,
    }: InsertMilestoneParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Always set season_key for time-based milestones (critical for recaps)
      const seasonKey = getCurrentSeasonKey();
      const dedupeKey = buildDedupeKey(
        user.id,
        milestoneType,
        rankScope,
        timeRange,
        seasonKey,
        rankValue,
        percentile
      );

      // Use RPC for secure insertion (bypasses disabled client INSERT policy)
      const milestonePayload = [{
        milestone_type: milestoneType,
        rank_scope: rankScope,
        time_range: timeRange,
        rank_value: rankValue,
        rank_delta: rankDelta ?? null,
        rivals_overtaken: rivalsOvertaken ?? null,
        percentile: percentile ?? null,
        season_key: seasonKey,
        dedupe_key: dedupeKey,
      }];

      const { data, error } = await supabase.rpc('insert_leaderboard_milestones', {
        milestones: milestonePayload,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard-milestones'] });
    },
  });
}
