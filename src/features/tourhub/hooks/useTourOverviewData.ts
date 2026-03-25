/**
 * useTourOverviewData - Unified data hook for Tour Hub Overview
 * Returns all data needed for the cinematic Overview page
 */

import { useMemo } from 'react';
import { useTourSeason, useTourTournaments, useTourPlayerStatistics, useTourHubDataStatus } from './useTourHubData';
import type { TourTournament, TourPlayerStatistics } from './useTourHubData';
import { getTournamentDisplayState } from '@/utils/tournamentState';

export interface FeaturedTournament {
  tournament: TourTournament;
  type: 'live' | 'recent' | 'upcoming';
}

export interface SeasonSnapshotStats {
  totalEvents: number;
  eventsPlayed: number;
  eventsRemaining: number;
  playersCount: number;
  statCategories: number;
}

export interface SeasonLeader {
  category: string;
  label: string;
  player: {
    id: string;
    name: string;
    country: string | null;
    photoUrl: string | null;
  };
  value: number | string;
  formattedValue: string;
}

export interface StorylineInsight {
  key: string;
  text: string;
}

export interface FeaturedCourse {
  id: string;
  name: string;
  location: string;
  par: number | null;
  yardage: number | null;
  tournamentName: string;
  imageUrl?: string;
}

export interface HistoryMoment {
  year: number;
  title: string;
  description: string;
  category?: 'major' | 'iconic' | 'records';
}

export function useTourOverviewData() {
  const { data: season, isLoading: seasonLoading } = useTourSeason();
  const { data: tournaments, isLoading: tournamentsLoading } = useTourTournaments(season?.id);
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { data: dataStatus } = useTourHubDataStatus();

  // Derive season status
  const seasonStatus = useMemo(() => {
    if (!tournaments || tournaments.length === 0) return 'upcoming';
    const now = new Date();
    if (tournaments.some(t => getTournamentDisplayState(t.status, t.end_date, now) === 'live')) return 'live';
    const allDone = tournaments.every(t => t.status === 'closed' || t.status === 'complete');
    if (allDone) return 'completed';
    return 'active';
  }, [tournaments]);

  // Featured tournament (spotlight) — PGA prioritised
  const featuredTournament = useMemo((): FeaturedTournament | null => {
    if (!tournaments || tournaments.length === 0) return null;
    const now = new Date();

    // Tour priority: PGA first
    const tourPriority = (t: TourTournament) => {
      const code = (t.tour_code || '').toLowerCase();
      if (code === 'pga') return 0;
      if (code === 'liv') return 1;
      if (code === 'euro' || code === 'dpw') return 2;
      return 3;
    };

    const live = [...tournaments]
      .filter(t => getTournamentDisplayState(t.status, t.end_date, now) === 'live')
      .sort((a, b) => tourPriority(a) - tourPriority(b));
    if (live.length > 0) return { tournament: live[0], type: 'live' };

    const inResultWindow = tournaments
      .filter(t => getTournamentDisplayState(t.status, t.end_date, now) === 'result')
      .sort((a, b) => {
        const pa = tourPriority(a) - tourPriority(b);
        if (pa !== 0) return pa;
        return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
      });
    if (inResultWindow.length > 0) return { tournament: inResultWindow[0], type: 'recent' };

    const upcoming = tournaments
      .filter(t => getTournamentDisplayState(t.status, t.end_date, now) === 'upcoming')
      .filter(t => t.status === 'scheduled' || t.status === 'created')
      .sort((a, b) => {
        const pa = tourPriority(a) - tourPriority(b);
        if (pa !== 0) return pa;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });
    if (upcoming.length > 0) return { tournament: upcoming[0], type: 'upcoming' };

    return null;
  }, [tournaments]);

  // Season snapshot stats
  const snapshotStats = useMemo((): SeasonSnapshotStats => {
    const totalEvents = tournaments?.length || 0;
    const eventsPlayed = tournaments?.filter(t => t.status === 'closed').length || 0;
    const eventsRemaining = totalEvents - eventsPlayed;
    const playersCount = playerStats?.length || 0;
    
    // Count stat categories from raw_data
    let statCategories = 6; // default
    if (playerStats && playerStats.length > 0) {
      const firstWithRaw = playerStats.find((p: any) => p.raw_data?.statistics);
      if (firstWithRaw) {
        const rawStats = (firstWithRaw as any).raw_data?.statistics || {};
        statCategories = Object.keys(rawStats).filter(k => rawStats[k] !== null).length;
      }
    }

    return { totalEvents, eventsPlayed, eventsRemaining, playersCount, statCategories };
  }, [tournaments, playerStats]);

  // Top players with max values for progress bars
  const topPlayersData = useMemo(() => {
    if (!playerStats) return { players: [], maxEvents: 0, maxCuts: 0 };

    const stats = playerStats as (TourPlayerStatistics & { raw_data?: any })[];
    const withPlayers = stats.filter(s => s.player);
    
    const maxEvents = Math.max(...withPlayers.map(s => s.events_played || 0));
    const maxCuts = Math.max(...withPlayers.map(s => s.cuts_made || 0));

    return {
      players: withPlayers,
      maxEvents,
      maxCuts,
    };
  }, [playerStats]);

  // Season leaders with computed stats - ORDERED: World Rank, Scoring, Cuts, Events
  const seasonLeaders = useMemo((): SeasonLeader[] => {
    if (!playerStats) return [];

    const stats = playerStats as (TourPlayerStatistics & { raw_data?: any })[];
    const leaders: SeasonLeader[] = [];

    // 1. World Rank Leader (FIRST - premium position)
    const byRank = [...stats]
      .filter(s => s.player && s.raw_data?.statistics?.world_rank)
      .sort((a, b) => (a.raw_data?.statistics?.world_rank || 9999) - (b.raw_data?.statistics?.world_rank || 9999));
    if (byRank[0]?.player) {
      const rank = byRank[0].raw_data?.statistics?.world_rank;
      leaders.push({
        category: 'world_rank',
        label: 'World No.1',
        player: { 
          id: byRank[0].player_id, 
          name: byRank[0].player.full_name, 
          country: byRank[0].player.country,
          photoUrl: byRank[0].player.photo_url || null,
        },
        value: rank,
        formattedValue: `#${rank}`,
      });
    }

    // 2. Lowest Scoring Avg
    const byScoring = [...stats]
      .filter(s => s.player && s.raw_data?.statistics?.scoring_avg)
      .sort((a, b) => (a.raw_data?.statistics?.scoring_avg || 999) - (b.raw_data?.statistics?.scoring_avg || 999));
    if (byScoring[0]?.player) {
      const avg = byScoring[0].raw_data?.statistics?.scoring_avg;
      leaders.push({
        category: 'scoring',
        label: 'Lowest Scoring Avg',
        player: { 
          id: byScoring[0].player_id, 
          name: byScoring[0].player.full_name, 
          country: byScoring[0].player.country,
          photoUrl: byScoring[0].player.photo_url || null,
        },
        value: avg,
        formattedValue: avg.toFixed(2),
      });
    }

    // 3. Most Cuts
    const byCuts = [...stats]
      .filter(s => s.player && s.cuts_made)
      .sort((a, b) => (b.cuts_made || 0) - (a.cuts_made || 0));
    if (byCuts[0]?.player) {
      leaders.push({
        category: 'cuts',
        label: 'Most Cuts Made',
        player: { 
          id: byCuts[0].player_id, 
          name: byCuts[0].player.full_name, 
          country: byCuts[0].player.country,
          photoUrl: byCuts[0].player.photo_url || null,
        },
        value: byCuts[0].cuts_made!,
        formattedValue: `${byCuts[0].cuts_made} cuts`,
      });
    }

    // 4. Most Events (LAST)
    const byEvents = [...stats]
      .filter(s => s.player && s.events_played)
      .sort((a, b) => (b.events_played || 0) - (a.events_played || 0));
    if (byEvents[0]?.player) {
      leaders.push({
        category: 'events',
        label: 'Most Events',
        player: { 
          id: byEvents[0].player_id, 
          name: byEvents[0].player.full_name, 
          country: byEvents[0].player.country,
          photoUrl: byEvents[0].player.photo_url || null,
        },
        value: byEvents[0].events_played!,
        formattedValue: `${byEvents[0].events_played} events`,
      });
    }

    return leaders;
  }, [playerStats]);

  // Featured courses
  const featuredCourses = useMemo((): FeaturedCourse[] => {
    if (!tournaments) return [];

    return tournaments
      .filter(t => t.venue_name && t.venue_par)
      .slice(0, 4)
      .map(t => ({
        id: t.id,
        name: t.venue_course_name || t.venue_name || 'Unknown Course',
        location: [t.venue_city, t.venue_country].filter(Boolean).join(', '),
        par: t.venue_par,
        yardage: t.venue_yardage,
        tournamentName: t.name,
      }));
  }, [tournaments]);

  // Storyline insights (editorial copy)
  const storylineInsights = useMemo((): StorylineInsight[] => {
    const insights: StorylineInsight[] = [];
    
    if (snapshotStats.playersCount > 0 && snapshotStats.totalEvents > 0) {
      insights.push({
        key: 'season-overview',
        text: `A season defined by consistency — ${snapshotStats.playersCount} players across ${snapshotStats.totalEvents} events.`,
      });
    }

    if (seasonLeaders.length > 0) {
      const eventsLeader = seasonLeaders.find(l => l.category === 'events');
      if (eventsLeader) {
        insights.push({
          key: 'most-active',
          text: `Most active player: ${eventsLeader.player.name} (${eventsLeader.formattedValue}).`,
        });
      }

      const scoringLeader = seasonLeaders.find(l => l.category === 'scoring');
      if (scoringLeader) {
        insights.push({
          key: 'lowest-scoring',
          text: `Lowest scoring avg: ${scoringLeader.player.name} (${scoringLeader.formattedValue}).`,
        });
      }
    }

    return insights;
  }, [snapshotStats, seasonLeaders]);

  // Unlocking soon items
  const unlockingSoonItems = useMemo(() => {
    return [
      { key: 'leaderboards', label: 'Live Leaderboards', locked: dataStatus?.leaderboards === 0 },
      { key: 'tee-times', label: 'Tee Times', locked: dataStatus?.teeTimes === 0 },
      { key: 'hole-stats', label: 'Hole Statistics', locked: dataStatus?.holeStats === 0 },
      { key: 'fedex', label: 'FedEx Rankings', locked: true },
    ].filter(item => item.locked);
  }, [dataStatus]);

  // Static history data (week-keyed, can be moved to CMS later)
  const historyMoments = useMemo((): HistoryMoment[] => {
    // Static for now - returns iconic moments
    return [
      { year: 1997, title: "Tiger's First Masters", description: "Woods wins by 12 strokes at age 21", category: 'major' },
      { year: 2000, title: "Tiger Slam Begins", description: "Historic run of 4 consecutive majors starts", category: 'iconic' },
      { year: 2019, title: "Tiger's Comeback", description: "Woods wins 5th Masters after years of injuries", category: 'major' },
    ];
  }, []);

  return {
    // Core data
    season,
    seasonStatus,
    featuredTournament,
    snapshotStats,
    topPlayersData,
    seasonLeaders,
    featuredCourses,
    
    // Optional/editorial
    storylineInsights,
    unlockingSoonItems,
    historyMoments,
    
    // Loading states
    isLoading: seasonLoading || tournamentsLoading || statsLoading,
    isPartialLoading: statsLoading,
  };
}
