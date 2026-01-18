/**
 * useGolfUniverseData - Unified data hook for The Golf Universe
 * Connects to SportRadar feeds and normalizes for display
 * 
 * Refinements:
 * - Multi-tour support (pga, lpga, liv, dpworld, majors, team)
 * - Lens reweighting (not just filtering)
 * - Improved hero selection logic
 * - Richer storyline generation (4-6 structured storylines)
 * - Momentum calculation from available stats
 */

import { useMemo } from 'react';
import { useTourSeason, useTourTournaments, useTourPlayerStatistics, useTourHubDataStatus } from '../../../hooks/useTourHubData';
import { useLiveEvents, useUpcomingEvents, useAllEvents } from '../../../hooks/useTourEvents';
import { useWorldRankings } from '../../../hooks/useWorldRankings';
import type { 
  GolfEvent, 
  RankedPlayer, 
  Storyline, 
  GlobalPulseItem,
  TourLens 
} from '../types';

/**
 * Tour detection from tournament data
 * 
 * Detection Strategy (ordered by reliability):
 * 1. Tour ID / organization field (when available from API)
 * 2. Tournament name keywords (current approach)
 * 3. Competition category
 * 
 * SportRadar fields used:
 * - name: tournament name
 * - (future) tour_id, organization_id when available
 * 
 * Current fallback: 'pga' - ensures lens switching works with existing data
 */
function detectTour(tournament: any): GolfEvent['tour'] {
  const name = tournament.name?.toLowerCase() || '';
  const tourId = tournament.tour_id?.toLowerCase() || '';
  const org = tournament.organization?.toLowerCase() || '';
  
  // Priority 1: Direct tour ID (when available)
  if (tourId.includes('lpga') || org.includes('lpga')) return 'lpga';
  if (tourId.includes('liv') || org.includes('liv')) return 'liv';
  if (tourId.includes('dpwt') || tourId.includes('european') || org.includes('dp world')) return 'dpworld';
  
  // Priority 2: LIV Golf detection (distinctive naming)
  if (name.includes('liv golf') || name.includes('liv ')) {
    return 'liv';
  }
  
  // Priority 3: LPGA detection
  if (
    name.includes('lpga') || 
    name.includes("women's") || 
    name.includes('womens') ||
    name.includes('ana inspiration') ||
    name.includes('chevron championship') ||
    name.includes('evian championship')
  ) {
    return 'lpga';
  }
  
  // Priority 4: DP World Tour detection
  if (
    name.includes('dp world') || 
    name.includes('european tour') ||
    name.includes('bmw pga') ||
    name.includes('scottish open') || // Co-sanctioned but DP World
    name.includes('irish open') ||
    name.includes('dubai desert classic') ||
    name.includes('abu dhabi') ||
    name.includes('omega european masters')
  ) {
    return 'dpworld';
  }
  
  // Priority 5: Team events (cross-tour)
  if (
    name.includes('ryder cup') || 
    name.includes('solheim cup') || 
    name.includes('presidents cup') || 
    name.includes('olympic') ||
    name.includes('world cup of golf')
  ) {
    return 'team';
  }
  
  // Default to PGA (majority of SportRadar data is PGA Tour)
  return 'pga';
}

// Importance score calculation (enhanced)
function calculateImportance(tournament: any): number {
  let score = 50;
  const name = tournament.name || '';
  
  // Major indicators
  const majorKeywords = ['Masters', 'U.S. Open', 'Open Championship', 'PGA Championship', 'Players Championship'];
  if (majorKeywords.some(k => name.includes(k))) {
    score += 40;
  }
  
  // Signature events
  const signatureKeywords = ['Genesis', 'Arnold Palmer', 'Memorial', 'WGC', 'FedEx', 'Tour Championship'];
  if (signatureKeywords.some(k => name.includes(k))) {
    score += 20;
  }
  
  // Team events (high importance)
  if (name.includes('Ryder Cup') || name.includes('Presidents Cup')) {
    score += 35;
  }
  
  // Purse indicator
  if (tournament.purse) {
    if (tournament.purse >= 20000000) score += 20;
    else if (tournament.purse >= 15000000) score += 15;
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

// Detect if tournament is a team event
function isTeamEvent(name: string): boolean {
  const teamKeywords = ['Ryder Cup', 'Solheim Cup', 'Presidents Cup', 'Olympics'];
  return teamKeywords.some(k => name?.includes(k));
}

/**
 * Calculate momentum from available stats
 * 
 * INTEGRITY NOTE: This is derived momentum, not historical rank change.
 * We DO NOT have historical rank snapshots, so we cannot show true rank deltas.
 * This momentum indicator is based on recent performance signals only.
 */
function calculateMomentum(player: any): 'rising' | 'stable' | 'falling' {
  // Use available signals to determine momentum
  const wins = player.stats?.wins || 0;
  const top10s = player.top10s || 0;
  const eventsPlayed = player.eventsPlayed || 1;
  
  // Calculate performance ratio
  const performanceRatio = (wins * 3 + top10s) / eventsPlayed;
  
  // Determine momentum based on ratio
  if (performanceRatio >= 0.5) return 'rising';
  if (performanceRatio >= 0.2) return 'stable';
  return 'falling';
}

export function useGolfUniverseData(lens: TourLens = 'global') {
  const { data: season, isLoading: seasonLoading } = useTourSeason();
  const { data: tournaments, isLoading: tournamentsLoading } = useTourTournaments(season?.id);
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { data: liveEvents } = useLiveEvents();
  const { data: upcomingEvents } = useUpcomingEvents(10);
  const { rankedOnly } = useWorldRankings();
  const { data: dataStatus } = useTourHubDataStatus();

  // Transform tournaments to GolfEvents with proper tour detection
  const events = useMemo((): GolfEvent[] => {
    if (!tournaments) return [];
    
    return tournaments.map(t => ({
      id: t.id,
      name: t.name,
      tour: detectTour(t),
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
      isTeamEvent: isTeamEvent(t.name),
    }));
  }, [tournaments]);

  // Lens reweighting - not just filtering, but prioritizing
  const filteredEvents = useMemo(() => {
    let result = [...events];
    
    switch (lens) {
      case 'global':
        // Blend all tours by importance - no filtering
        result.sort((a, b) => b.importanceScore - a.importanceScore);
        break;
        
      case 'majors':
        // Only majors across all tours
        result = result.filter(e => e.isMajor);
        break;
        
      case 'team':
        // Team events (Ryder/Solheim/Olympics)
        result = result.filter(e => e.isTeamEvent);
        break;
        
      case 'pga':
      case 'lpga':
      case 'liv':
      case 'dpworld':
        // Prioritize selected tour but include majors when relevant
        result = result.filter(e => e.tour === lens || e.isMajor);
        // Boost events matching the lens
        result.sort((a, b) => {
          const aBoost = a.tour === lens ? 20 : 0;
          const bBoost = b.tour === lens ? 20 : 0;
          return (b.importanceScore + bBoost) - (a.importanceScore + aBoost);
        });
        break;
    }
    
    return result;
  }, [events, lens]);

  // Hero event selection - Premium logic
  const heroEvent = useMemo((): GolfEvent | null => {
    if (filteredEvents.length === 0) return null;
    
    const now = new Date();
    
    // Priority 1: Live event (matching lens preference)
    const liveMatching = filteredEvents.find(e => e.isLive && (lens === 'global' || e.tour === lens));
    if (liveMatching) return liveMatching;
    
    // Priority 2: Any live event
    const anyLive = filteredEvents.find(e => e.isLive);
    if (anyLive) return anyLive;
    
    // Priority 3: High-importance upcoming (within 14 days)
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const upcomingHighImportance = filteredEvents
      .filter(e => 
        (e.status === 'scheduled' || e.status === 'upcoming') &&
        new Date(e.startDate) <= twoWeeksLater
      )
      .sort((a, b) => b.importanceScore - a.importanceScore)[0];
    if (upcomingHighImportance) return upcomingHighImportance;
    
    // Priority 4: Most important future event
    const futureEvent = filteredEvents
      .filter(e => e.status === 'scheduled' || e.status === 'upcoming')
      .sort((a, b) => b.importanceScore - a.importanceScore)[0];
    if (futureEvent) return futureEvent;
    
    // Priority 5: Last completed (recap mode)
    const completed = filteredEvents
      .filter(e => e.status === 'complete' || e.status === 'closed')
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
    if (completed) return completed;
    
    // Fallback: highest importance
    return filteredEvents[0];
  }, [filteredEvents, lens]);

  // Transform to RankedPlayers with calculated momentum
  // INTEGRITY: We do NOT fabricate rankChange or previousRank
  // Without historical rank snapshots, we can only show current rank + derived momentum
  const rankedPlayers = useMemo((): RankedPlayer[] => {
    return rankedOnly.map(p => {
      const momentum = calculateMomentum(p);
      
      return {
        id: p.playerId,
        name: p.playerName,
        firstName: p.player?.first_name || null,
        lastName: p.player?.last_name || null,
        country: p.country,
        countryCode: p.countryCode,
        photoUrl: p.photoUrl,
        worldRank: p.worldRank,
        // DO NOT fabricate these - set to null/0 until we have historical data
        previousRank: null,
        rankChange: 0,
        momentum, // This is derived from performance, not rank history
        earnings: p.earnings,
        eventsPlayed: p.eventsPlayed,
        wins: p.stats?.wins || null,
        top10s: p.top10s,
        scoringAvg: p.scoringAvg,
        fedexRank: p.fedexRank,
        recentFinishes: [],
      };
    });
  }, [rankedOnly]);

  // Global Pulse items with deep-link support
  const pulseItems = useMemo((): GlobalPulseItem[] => {
    const items: GlobalPulseItem[] = [];
    
    // Add live events (highest priority)
    if (liveEvents) {
      liveEvents.forEach((e: any) => {
        items.push({
          id: `live-${e.id}`,
          type: 'live',
          headline: e.name,
          subtext: 'In Progress',
          tour: detectTour(e),
          eventId: e.id,
          timestamp: new Date().toISOString(),
          priority: 100,
          deepLink: `/tourhub/tournament/${e.id}`,
        });
      });
    }
    
    // Add "breaking" for World #1 (stub for now)
    if (rankedPlayers[0]) {
      items.push({
        id: 'world-no-1-pulse',
        type: 'breaking',
        headline: `${rankedPlayers[0].name} leads World Rankings`,
        subtext: `#${rankedPlayers[0].worldRank}`,
        tour: 'global',
        timestamp: new Date().toISOString(),
        priority: 80,
        deepLink: `/tourhub/player/${rankedPlayers[0].id}`,
      });
    }
    
    // Add upcoming tee times
    if (upcomingEvents) {
      upcomingEvents.slice(0, 3).forEach((e: any) => {
        const startDate = new Date(e.start_date);
        const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        items.push({
          id: `upcoming-${e.id}`,
          type: 'tee-time',
          headline: e.name,
          subtext: daysUntil <= 1 ? 'Tomorrow' : 
                   daysUntil <= 7 ? `${daysUntil} days` :
                   startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          tour: detectTour(e),
          eventId: e.id,
          timestamp: e.start_date,
          priority: 50 + (7 - Math.min(daysUntil, 7)) * 5, // Closer = higher priority
          deepLink: `/tourhub/tournament/${e.id}`,
        });
      });
    }
    
    return items.sort((a, b) => b.priority - a.priority);
  }, [liveEvents, upcomingEvents, rankedPlayers]);

  // Generate 4-6 structured storylines
  const storylines = useMemo((): Storyline[] => {
    const stories: Storyline[] = [];
    const completedEvents = filteredEvents.filter(e => e.status === 'complete' || e.status === 'closed');
    const upcomingHighImportance = filteredEvents
      .filter(e => e.status === 'scheduled' || e.status === 'upcoming')
      .sort((a, b) => b.importanceScore - a.importanceScore);
    
    // 1. World #1 storyline
    if (rankedPlayers[0]) {
      const player = rankedPlayers[0];
      stories.push({
        id: 'world-no-1',
        title: `${player.name}: World No.1`,
        summary: player.wins && player.wins > 0 
          ? `With ${player.wins} win${player.wins > 1 ? 's' : ''} this season, ${player.name.split(' ')[0]} continues to dominate the Official World Golf Ranking.`
          : `${player.name} holds the top spot in the Official World Golf Ranking heading into this week.`,
        type: 'insight',
        tour: 'global',
        playerIds: [player.id],
        timestamp: new Date().toISOString(),
        importance: 95,
      });
    }
    
    // 2. Live event focus (if any)
    const liveEvent = filteredEvents.find(e => e.isLive);
    if (liveEvent) {
      stories.push({
        id: `live-${liveEvent.id}`,
        title: `LIVE: ${liveEvent.name}`,
        summary: `The ${liveEvent.name} is underway at ${liveEvent.courseName || liveEvent.venueName || 'the course'}. Follow all the action.`,
        type: 'breaking',
        tour: liveEvent.tour,
        eventId: liveEvent.id,
        timestamp: new Date().toISOString(),
        importance: 100,
      });
    }
    
    // 3. Latest completed recap
    if (completedEvents.length > 0) {
      const recent = completedEvents[completedEvents.length - 1];
      stories.push({
        id: `recap-${recent.id}`,
        title: `${recent.name}: Final Recap`,
        summary: recent.isMajor 
          ? `Another chapter written in major championship history. See how it all unfolded.`
          : `The ${recent.name} has concluded. Check out the final leaderboard and key moments.`,
        type: 'recap',
        tour: recent.tour,
        eventId: recent.id,
        timestamp: recent.endDate,
        importance: 85,
      });
    }
    
    // 4. Next high-importance event preview
    if (upcomingHighImportance.length > 0) {
      const next = upcomingHighImportance[0];
      const daysUntil = Math.ceil(
        (new Date(next.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      stories.push({
        id: `preview-${next.id}`,
        title: `Preview: ${next.name}`,
        summary: next.isMajor
          ? `One of golf's four majors awaits. The ${next.name} begins ${daysUntil <= 1 ? 'tomorrow' : `in ${daysUntil} days`}.`
          : `${next.name} is coming up ${daysUntil <= 1 ? 'tomorrow' : `in ${daysUntil} days`} at ${next.courseName || next.venueName || 'a premier venue'}.`,
        type: 'trending',
        tour: next.tour,
        eventId: next.id,
        timestamp: new Date().toISOString(),
        importance: 80,
      });
    }
    
    // 5. Tour-specific storyline when lens != global
    if (lens !== 'global') {
      const tourName = {
        pga: 'PGA Tour',
        lpga: 'LPGA Tour',
        liv: 'LIV Golf',
        dpworld: 'DP World Tour',
        majors: 'The Majors',
        team: 'Team Events',
      }[lens];
      
      const tourEvents = events.filter(e => e.tour === lens);
      const tourLive = tourEvents.filter(e => e.isLive).length;
      const tourUpcoming = tourEvents.filter(e => e.status === 'scheduled' || e.status === 'upcoming').length;
      
      stories.push({
        id: `tour-focus-${lens}`,
        title: `${tourName} Focus`,
        summary: tourLive > 0
          ? `${tourLive} event${tourLive > 1 ? 's' : ''} live on the ${tourName}. ${tourUpcoming} more coming up.`
          : `${tourUpcoming} events coming up on the ${tourName} schedule.`,
        type: 'insight',
        tour: lens,
        timestamp: new Date().toISOString(),
        importance: 75,
      });
    }
    
    // 6. Rising star (player with best momentum)
    const risingPlayers = rankedPlayers.filter(p => p.momentum === 'rising').slice(0, 1);
    if (risingPlayers.length > 0 && risingPlayers[0].worldRank && risingPlayers[0].worldRank > 1) {
      const rising = risingPlayers[0];
      stories.push({
        id: `rising-${rising.id}`,
        title: `On the Rise: ${rising.name}`,
        summary: `${rising.name} is trending upward in the world rankings after a strong recent stretch of performances.`,
        type: 'trending',
        tour: 'global',
        playerIds: [rising.id],
        timestamp: new Date().toISOString(),
        importance: 70,
      });
    }
    
    return stories.sort((a, b) => b.importance - a.importance).slice(0, 6);
  }, [rankedPlayers, filteredEvents, events, lens]);

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
    heroEvent,
    events: filteredEvents,
    allEvents: events,
    rankedPlayers,
    pulseItems,
    storylines,
    dataUnlocks,
    stats,
    season,
    isLoading: seasonLoading || tournamentsLoading || statsLoading,
  };
}
