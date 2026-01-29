/**
 * CinematicOverview - Apple-grade Tour Hub Overview page
 * Full-bleed cinematic hero with dark theme sections
 * Per Apple-grade redesign spec
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CinematicHero, 
  WorldRankShowcase, 
  ThisWeekSection, 
  SeasonDashboard 
} from './overview-cinematic';
import { useTourOverviewData } from '../hooks/useTourOverviewData';
import { useTourTournaments, useTourSeason } from '../hooks/useTourHubData';
import { useCourseImageResolver } from '../hooks/useCourseImageResolver';

// Loading skeleton
function CinematicOverviewSkeleton() {
  return (
    <div className="min-h-screen bg-[hsl(var(--th-bg-canvas))]">
      {/* Hero skeleton */}
      <div 
        className="animate-pulse bg-slate-800/50 -mx-4"
        style={{ height: '85vh', maxHeight: '700px' }}
      />
      
      {/* World rankings skeleton */}
      <div className="py-10 px-4 space-y-4">
        <div className="h-4 w-48 bg-slate-700/50 rounded" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-[200px] h-[280px] bg-slate-800/50 rounded-[20px]" />
          ))}
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="py-10 px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CinematicOverview() {
  const { data: season } = useTourSeason();
  const { data: tournaments } = useTourTournaments(season?.id);
  
  const {
    featuredTournament,
    snapshotStats,
    seasonLeaders,
    isLoading,
  } = useTourOverviewData();

  // Build venue list for hero image
  const venues = useMemo(() => {
    if (!featuredTournament?.tournament) return [];
    const t = featuredTournament.tournament;
    return [{
      venueName: t.venue_name || '',
      venueCourseName: t.venue_course_name,
      city: t.venue_city,
      country: t.venue_country,
    }].filter(v => v.venueName);
  }, [featuredTournament]);

  const { data: courseImages } = useCourseImageResolver(venues);

  // Get hero image
  const heroImageUrl = featuredTournament?.tournament.venue_name
    ? courseImages?.get(featuredTournament.tournament.venue_name)?.imageUrl
    : null;

  if (isLoading) {
    return <CinematicOverviewSkeleton />;
  }

  return (
    <motion.div 
      className="min-h-screen bg-[hsl(var(--th-bg-canvas))]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 1. Cinematic Hero - Full viewport immersive */}
      {featuredTournament && (
        <CinematicHero
          tournament={featuredTournament.tournament}
          type={featuredTournament.type}
          courseImageUrl={heroImageUrl}
          // Would add leaderboard data here when available
        />
      )}

      {/* Dark themed sections below hero */}
      <div className="bg-[hsl(var(--th-bg-canvas))]">
        {/* 2. World Rankings Showcase */}
        <WorldRankShowcase />

        {/* 3. This Week in Golf */}
        {tournaments && tournaments.length > 0 && (
          <ThisWeekSection tournaments={tournaments} />
        )}

        {/* 4. Season Dashboard */}
        <SeasonDashboard 
          stats={snapshotStats}
          leaders={seasonLeaders}
          seasonName={season?.name || '2025 PGA TOUR'}
        />
      </div>
    </motion.div>
  );
}
