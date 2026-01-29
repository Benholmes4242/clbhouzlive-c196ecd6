/**
 * CinematicOverview - Main Overview/Home page with light theme
 * Page uses light background with dark cards for cinematic elements
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CinematicHero } from './CinematicHero';
import { WorldRankShowcase } from './WorldRankShowcase';
import { ThisWeekSection } from './ThisWeekSection';
import { SeasonDashboard } from './SeasonDashboard';
import { CinematicHeroSkeleton, WorldRankShowcaseSkeleton, ThisWeekSkeleton, SeasonDashboardSkeleton } from './CinematicSkeleton';
import { useTourSeason, useTourTournaments, useTourLeaderboard } from '../../hooks/useTourHubData';
import { useLiveEvents, useUpcomingEvents } from '../../hooks/useTourEvents';
import { useCourseImageResolver } from '../../hooks/useCourseImageResolver';
import { pageVariants, sectionVariants } from './animations';

function CinematicOverviewSkeleton() {
  return (
    <motion.div 
      className="min-h-screen bg-[#F8FAFC]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CinematicHeroSkeleton />
      <WorldRankShowcaseSkeleton />
      <ThisWeekSkeleton />
      <SeasonDashboardSkeleton />
    </motion.div>
  );
}

export function CinematicOverview() {
  const { data: season, isLoading: seasonLoading } = useTourSeason();
  const { data: tournaments, isLoading: tournamentsLoading } = useTourTournaments(season?.id);
  const { data: liveEvents } = useLiveEvents();
  const { data: upcomingEvents } = useUpcomingEvents(5);

  // Determine hero tournament (live > upcoming > most recent)
  const heroTournament = useMemo(() => {
    // Priority 1: Live event
    if (liveEvents && liveEvents.length > 0) {
      return liveEvents[0];
    }
    
    // Priority 2: Most imminent upcoming
    if (upcomingEvents && upcomingEvents.length > 0) {
      return upcomingEvents[0];
    }
    
    // Priority 3: First tournament from the list
    if (tournaments && tournaments.length > 0) {
      // Sort by start_date descending to get most recent
      const sorted = [...tournaments].sort((a, b) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      // Find first live or upcoming
      const upcoming = sorted.find(t => 
        t.status === 'inprogress' || 
        t.status === 'scheduled' || 
        t.status === 'upcoming'
      );
      return upcoming || sorted[0];
    }
    
    return null;
  }, [liveEvents, upcomingEvents, tournaments]);

  // Get leaderboard for hero tournament if live
  const { data: leaderboard } = useTourLeaderboard(
    heroTournament?.status === 'inprogress' ? heroTournament.id : ''
  );

  // Resolve course images
  const venues = useMemo(() => {
    if (!heroTournament) return [];
    const t = heroTournament as any;
    return [{
      venueName: t.venue_name || '',
      venueCourseName: t.venue_course_name || t.course_name,
      city: t.venue_city || t.location?.split(',')[0]?.trim(),
      country: t.venue_country || t.location?.split(',').pop()?.trim(),
    }];
  }, [heroTournament]);

  const { data: courseImages } = useCourseImageResolver(venues);

  const isLoading = seasonLoading || tournamentsLoading;

  if (isLoading) {
    return <CinematicOverviewSkeleton />;
  }

  // Transform hero tournament for CinematicHero
  const heroProps = heroTournament ? (() => {
    const t = heroTournament as any;
    return {
      id: t.id,
      name: t.name,
      status: t.status,
      venueName: t.venue_name,
      venueCity: t.venue_city || t.location?.split(',')[0]?.trim() || null,
      venueCountry: t.venue_country || t.location?.split(',').pop()?.trim() || null,
      courseName: t.venue_course_name || t.course_name,
      purse: t.purse,
      startDate: t.start_date,
      endDate: t.end_date,
    };
  })() : null;

  // Transform leaderboard for mini display
  const leaders = leaderboard?.slice(0, 5).map((entry: any) => ({
    playerId: entry.player_id,
    playerName: entry.player?.full_name || 'Unknown',
    position: entry.position,
    score: entry.score_to_par !== null 
      ? (entry.score_to_par === 0 ? 'E' : entry.score_to_par > 0 ? `+${entry.score_to_par}` : `${entry.score_to_par}`)
      : '--',
    today: entry.today_to_par !== null
      ? (entry.today_to_par === 0 ? 'E' : entry.today_to_par > 0 ? `+${entry.today_to_par}` : `${entry.today_to_par}`)
      : undefined,
    thru: entry.thru?.toString(),
  })) || [];

  const heroImageUrl = heroTournament?.venue_name 
    ? courseImages?.get(heroTournament.venue_name)?.imageUrl 
    : null;

  return (
    <motion.div
      className="min-h-screen bg-[#F8FAFC]"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* 1. Cinematic Hero - Uses dark styling internally */}
      {heroProps && (
        <CinematicHero
          tournament={heroProps}
          leaders={leaders}
          courseImageUrl={heroImageUrl}
        />
      )}

      {/* 2. World Rankings Showcase */}
      <motion.div variants={sectionVariants}>
        <WorldRankShowcase />
      </motion.div>

      {/* 3. This Week in Golf */}
      <motion.div variants={sectionVariants}>
        <ThisWeekSection />
      </motion.div>

      {/* 4. Season Dashboard */}
      <motion.div variants={sectionVariants}>
        <SeasonDashboard />
      </motion.div>
    </motion.div>
  );
}
