/**
 * useGolfUniverseData - Unified data hook for The Golf Universe
 * Connects to SportRadar feeds and normalizes for display
 */

import { useMemo } from 'react';
import { useTourSeason, useTourTournaments, useTourPlayerStatistics, useTourHubDataStatus } from '../../../hooks/useTourHubData';
import { useLiveEvents, useUpcomingEvents } from '../../../hooks/useTourEvents';
import { useWorldRankings } from '../../../hooks/useWorldRankings';
import type { 
  GolfEvent, 
  RankedPlayer, 
  Storyline, 
  GlobalPulseItem,
  TourLens 
} from '../types';

// Importance score calculation
function calculateImportance(tournament: any): number {
  let score = 50; // Base score
  
  // Major indicators (name-based detection)
  const majorKeywords = ['Masters', 'U.S. Open', 'Open Championship', 'PGA Championship', 'Players'];
  if (majorKeywords.some(k => tournament.name?.includes(k))) {
    score += 40;
  }
  
  // Purse indicator
  if (tournament.purse) {
    if (tournament.purse >= 20000000) score += 20;
    else if (tournament.purse >= 10000000) score += 10;
    else if (tournament.purse >= 5000000) score += 5;
  }
  
  // Status boost for live
  if (tournament.status === 'inprogress') score += 15;
  
  return Math.min(score, 100);
}

// Detect if tournament is a major
function isMajor(name: string): boolean {
  const majorKeywords = ['Masters Tournament', 'U.S. Open', 'The Open Championship', 'PGA Championship'];
  return majorKeywords.some(k => name?.includes(k));
}

export function useGolfUniverseData(lens: TourLens = 'global') {
  const { data: season, isLoading: seasonLoading } = useTourSeason();
  const { data: tournaments, isLoading: tournamentsLoading } = useTourTournaments(season?.id);
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { data: liveEvents } = useLiveEvents();
  const { data: upcomingEvents } = useUpcomingEvents(10);
  const { data: worldRankings, rankedOnly } = useWorldRankings();
  const { data: dataStatus } = useTourHubDataStatus();

  // Transform tournaments to GolfEvents
  const events = useMemo((): GolfEvent[] => {
    if (!tournaments) return [];
    
    return tournaments.map(t => ({
      id: t.id,
      name: t.name,
      tour: 'pga', // Will expand with multi-tour support
      status: t.status as GolfEvent['status'],
      startDate: t.start_date,
      endDate: t.end_date,
      venueName: t.venue_name,
      venueCity: t.venue_city,
      venueCountry: t.venue_country,
      courseName: t.venue_course_name,
      purse: t.purse,
      currency: t.currency,
      defendingChampion: t.defending_champion,
      importanceScore: calculateImportance(t),
      isLive: t.status === 'inprogress',
      isMajor: isMajor(t.name),
    }));
  }, [tournaments]);

  // Filter events by lens
  const filteredEvents = useMemo(() => {
    if (lens === 'global') return events;
    if (lens === 'majors') return events.filter(e => e.isMajor);
    return events.filter(e => e.tour === lens);
  }, [events, lens]);

  // Hero event selection
  const heroEvent = useMemo((): GolfEvent | null => {
    // Priority: live > importance > upcoming
    const live = filteredEvents.find(e => e.isLive);
    if (live) return live;
    
    // Sort by importance for non-live
    const sorted = [...filteredEvents].sort((a, b) => b.importanceScore - a.importanceScore);
    const upcoming = sorted.find(e => e.status === 'scheduled' || e.status === 'upcoming');
    if (upcoming) return upcoming;
    
    return sorted[0] || null;
  }, [filteredEvents]);

  // Transform to RankedPlayers with momentum
  const rankedPlayers = useMemo((): RankedPlayer[] => {
    return rankedOnly.map(p => ({
      id: p.playerId,
      name: p.playerName,
      firstName: p.player?.first_name || null,
      lastName: p.player?.last_name || null,
      country: p.country,
      countryCode: p.countryCode,
      photoUrl: p.photoUrl,
      worldRank: p.worldRank,
      previousRank: null, // Would need historical data
      rankChange: 0,
      momentum: 'stable' as const,
      earnings: p.earnings,
      eventsPlayed: p.eventsPlayed,
      wins: p.stats?.wins || null,
      top10s: p.top10s,
      scoringAvg: p.scoringAvg,
      fedexRank: p.fedexRank,
      recentFinishes: [],
    }));
  }, [rankedOnly]);

  // Global Pulse items
  const pulseItems = useMemo((): GlobalPulseItem[] => {
    const items: GlobalPulseItem[] = [];
    
    // Add live events
    if (liveEvents) {
      liveEvents.forEach((e: any) => {
        items.push({
          id: `live-${e.id}`,
          type: 'live',
          headline: e.name,
          subtext: 'In Progress',
          tour: 'pga',
          eventId: e.id,
          timestamp: new Date().toISOString(),
          priority: 100,
        });
      });
    }
    
    // Add upcoming tee times
    if (upcomingEvents) {
      upcomingEvents.slice(0, 3).forEach((e: any) => {
        items.push({
          id: `upcoming-${e.id}`,
          type: 'tee-time',
          headline: e.name,
          subtext: new Date(e.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          tour: 'pga',
          eventId: e.id,
          timestamp: e.start_date,
          priority: 50,
        });
      });
    }
    
    return items.sort((a, b) => b.priority - a.priority);
  }, [liveEvents, upcomingEvents]);

  // Generate storylines from data
  const storylines = useMemo((): Storyline[] => {
    const stories: Storyline[] = [];
    
    // World #1 storyline
    if (rankedPlayers[0]) {
      stories.push({
        id: 'world-no-1',
        title: `${rankedPlayers[0].name} holds World No.1`,
        summary: `The world's top-ranked golfer continues their reign at the top of the Official World Golf Ranking.`,
        type: 'insight',
        tour: 'global',
        playerIds: [rankedPlayers[0].id],
        timestamp: new Date().toISOString(),
        importance: 90,
      });
    }
    
    // Recent winner storyline
    const completedEvents = filteredEvents.filter(e => e.status === 'complete' || e.status === 'closed');
    if (completedEvents.length > 0) {
      const recent = completedEvents[completedEvents.length - 1];
      stories.push({
        id: `recent-${recent.id}`,
        title: `${recent.name} Recap`,
        summary: `The latest tour stop has concluded. See the full leaderboard and highlights.`,
        type: 'recap',
        tour: recent.tour,
        eventId: recent.id,
        timestamp: recent.endDate,
        importance: 70,
      });
    }
    
    return stories.sort((a, b) => b.importance - a.importance);
  }, [rankedPlayers, filteredEvents]);

  // Data unlock status
  const dataUnlocks = useMemo(() => [
    { key: 'leaderboards', label: 'Live Leaderboards', locked: (dataStatus?.leaderboards || 0) === 0 },
    { key: 'tee-times', label: 'Tee Times', locked: (dataStatus?.teeTimes || 0) === 0 },
    { key: 'hole-stats', label: 'Hole Statistics', locked: (dataStatus?.holeStats || 0) === 0 },
    { key: 'fedex', label: 'FedEx Standings', locked: true, comingSoon: true },
  ], [dataStatus]);

  // Stats summary
  const stats = useMemo(() => ({
    totalEvents: events.length,
    liveEvents: events.filter(e => e.isLive).length,
    upcomingEvents: events.filter(e => e.status === 'scheduled' || e.status === 'upcoming').length,
    completedEvents: events.filter(e => e.status === 'complete' || e.status === 'closed').length,
    totalPlayers: rankedPlayers.length,
    majorEvents: events.filter(e => e.isMajor).length,
  }), [events, rankedPlayers]);

  return {
    // Core data
    heroEvent,
    events: filteredEvents,
    rankedPlayers,
    pulseItems,
    storylines,
    dataUnlocks,
    stats,
    season,
    
    // Loading states
    isLoading: seasonLoading || tournamentsLoading || statsLoading,
  };
}
