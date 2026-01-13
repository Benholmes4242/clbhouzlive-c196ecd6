/**
 * useCollegeStatus - Determines "alive" status for college rivalry gamification
 * 
 * Status types:
 * - 🔥 hotStreak: Top 3 mover this week
 * - 🛡️ defendingChamp: Rank #1 on earnings
 * - ⚡ risingFast: Jumped 5+ positions this week
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeasonId, useCollegeSeasonStats } from './useCollegeStats';

export type CollegeStatusType = 'hotStreak' | 'defendingChamp' | 'risingFast' | null;

export interface CollegeStatus {
  type: CollegeStatusType;
  emoji: string;
  label: string;
}

export interface CollegeMomentum {
  rankChange: number | null;
  earningsDelta: number;
  isRising: boolean;
}

const STATUS_CONFIG: Record<Exclude<CollegeStatusType, null>, { emoji: string; label: string }> = {
  hotStreak: { emoji: '🔥', label: 'Hot Streak' },
  defendingChamp: { emoji: '🛡️', label: 'Defending' },
  risingFast: { emoji: '⚡', label: 'Rising' },
};

/**
 * Fetches top movers for status determination
 */
export function useTopMovers() {
  const seasonId = useCurrentSeasonId();
  
  return useQuery({
    queryKey: ['college-top-movers-status', seasonId],
    queryFn: async () => {
      if (!seasonId) return { topMovers: new Set<string>(), moverData: new Map() };
      
      // Get latest week
      const { data: latestWeek } = await supabase
        .from('college_weekly_movers')
        .select('week_start')
        .eq('season_id', seasonId)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();
      
      if (!latestWeek?.week_start) return { topMovers: new Set<string>(), moverData: new Map() };
      
      // Get top 3 movers by earnings delta
      const { data: movers } = await supabase
        .from('college_weekly_movers')
        .select('normalized_name, earnings_delta, earnings_rank_change')
        .eq('season_id', seasonId)
        .eq('week_start', latestWeek.week_start)
        .gt('earnings_delta', 0)
        .order('earnings_delta', { ascending: false })
        .limit(10);
      
      const topMovers = new Set((movers || []).slice(0, 3).map(m => m.normalized_name));
      const moverData = new Map((movers || []).map(m => [m.normalized_name, {
        earningsDelta: m.earnings_delta,
        rankChange: m.earnings_rank_change,
      }]));
      
      return { topMovers, moverData };
    },
    enabled: !!seasonId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get status for a specific college
 */
export function useCollegeStatus(normalizedName: string | undefined): CollegeStatus | null {
  const { data: allStats } = useCollegeSeasonStats();
  const { data: moverInfo } = useTopMovers();
  
  return useMemo(() => {
    if (!normalizedName || !allStats) return null;
    
    // Check if #1 in earnings (defending champ)
    const sortedByEarnings = [...allStats].sort((a, b) => b.earnings_total - a.earnings_total);
    if (sortedByEarnings[0]?.normalized_name === normalizedName) {
      return { type: 'defendingChamp', ...STATUS_CONFIG.defendingChamp };
    }
    
    // Check if top 3 mover (hot streak)
    if (moverInfo?.topMovers?.has(normalizedName)) {
      return { type: 'hotStreak', ...STATUS_CONFIG.hotStreak };
    }
    
    // Check if rose 5+ positions (rising fast)
    const momentum = moverInfo?.moverData?.get(normalizedName);
    if (momentum?.rankChange && momentum.rankChange >= 5) {
      return { type: 'risingFast', ...STATUS_CONFIG.risingFast };
    }
    
    return null;
  }, [normalizedName, allStats, moverInfo]);
}

/**
 * Hook to get momentum data for a college (for momentum ring)
 */
export function useCollegeMomentum(normalizedName: string | undefined): CollegeMomentum {
  const { data: moverInfo } = useTopMovers();
  
  return useMemo(() => {
    if (!normalizedName || !moverInfo?.moverData) {
      return { rankChange: null, earningsDelta: 0, isRising: false };
    }
    
    const data = moverInfo.moverData.get(normalizedName);
    if (!data) {
      return { rankChange: null, earningsDelta: 0, isRising: false };
    }
    
    return {
      rankChange: data.rankChange,
      earningsDelta: data.earningsDelta,
      isRising: data.earningsDelta > 0 || (data.rankChange !== null && data.rankChange > 0),
    };
  }, [normalizedName, moverInfo]);
}

/**
 * Bulk hook to get status for multiple colleges at once
 */
export function useCollegeStatusMap(): Map<string, CollegeStatus> {
  const { data: allStats } = useCollegeSeasonStats();
  const { data: moverInfo } = useTopMovers();
  
  return useMemo(() => {
    const statusMap = new Map<string, CollegeStatus>();
    
    if (!allStats) return statusMap;
    
    // Find #1 by earnings
    const sortedByEarnings = [...allStats].sort((a, b) => b.earnings_total - a.earnings_total);
    const champName = sortedByEarnings[0]?.normalized_name;
    
    if (champName) {
      statusMap.set(champName, { type: 'defendingChamp', ...STATUS_CONFIG.defendingChamp });
    }
    
    // Add top movers (hot streak) - only if not already champ
    moverInfo?.topMovers?.forEach(name => {
      if (!statusMap.has(name)) {
        statusMap.set(name, { type: 'hotStreak', ...STATUS_CONFIG.hotStreak });
      }
    });
    
    // Add rising fast (5+ positions) - only if not already has status
    moverInfo?.moverData?.forEach((data, name) => {
      if (!statusMap.has(name) && data.rankChange && data.rankChange >= 5) {
        statusMap.set(name, { type: 'risingFast', ...STATUS_CONFIG.risingFast });
      }
    });
    
    return statusMap;
  }, [allStats, moverInfo]);
}

/**
 * Hook to get head-to-head comparison between two colleges
 */
export function useCollegeHeadToHead(
  collegeA: string | undefined,
  collegeB: string | undefined
) {
  const { data: allStats } = useCollegeSeasonStats();
  
  return useMemo(() => {
    if (!collegeA || !collegeB || !allStats) {
      return null;
    }
    
    const statsA = allStats.find(s => s.normalized_name === collegeA);
    const statsB = allStats.find(s => s.normalized_name === collegeB);
    
    if (!statsA || !statsB) return null;
    
    // Count wins by category
    let winsA = 0;
    let winsB = 0;
    
    if (statsA.earnings_total > statsB.earnings_total) winsA++;
    else if (statsB.earnings_total > statsA.earnings_total) winsB++;
    
    if (statsA.wins_total > statsB.wins_total) winsA++;
    else if (statsB.wins_total > statsA.wins_total) winsB++;
    
    if (statsA.cuts_total > statsB.cuts_total) winsA++;
    else if (statsB.cuts_total > statsA.cuts_total) winsB++;
    
    if (statsA.top10_total > statsB.top10_total) winsA++;
    else if (statsB.top10_total > statsA.top10_total) winsB++;
    
    // Calculate earnings difference
    const earningsDiff = statsA.earnings_total - statsB.earnings_total;
    
    return {
      winsA,
      winsB,
      earningsDiff,
      winner: winsA > winsB ? 'A' : winsB > winsA ? 'B' : 'tie',
    };
  }, [collegeA, collegeB, allStats]);
}
