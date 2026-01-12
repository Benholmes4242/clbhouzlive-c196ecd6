/**
 * OverviewTabFeed - Cinematic image-led Tour Feed
 * World-class UI with improved section spacing and rhythm
 */

import {
  HeroFeature,
  WorldRankingsSection,
  FeatureStrip,
  PlayersFeed,
  LeadersPhotoCards,
  CoursesPhotoGrid,
  DataUnlocking,
} from '../overview-feed';
import { useTourOverviewData } from '../../hooks/useTourOverviewData';
import { useCourseImageResolver } from '../../hooks/useCourseImageResolver';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

export function OverviewTabFeed() {
  const {
    featuredTournament,
    snapshotStats,
    topPlayersData,
    seasonLeaders,
    featuredCourses,
    unlockingSoonItems,
    isLoading,
  } = useTourOverviewData();

  // Build venue list for course image resolution
  const venues = useMemo(() => {
    const list = [];
    if (featuredTournament?.tournament) {
      const t = featuredTournament.tournament;
      list.push({
        venueName: t.venue_name || '',
        venueCourseName: t.venue_course_name,
        city: t.venue_city,
        country: t.venue_country,
      });
    }
    featuredCourses.forEach(c => {
      list.push({
        venueName: c.name,
        city: c.location?.split(',')[0]?.trim(),
        country: 'USA',
      });
    });
    return list.filter(v => v.venueName);
  }, [featuredTournament, featuredCourses]);

  const { data: courseImages } = useCourseImageResolver(venues);

  // Get hero image
  const heroImageUrl = featuredTournament?.tournament.venue_name
    ? courseImages?.get(featuredTournament.tournament.venue_name)?.imageUrl
    : null;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-[60vh] max-h-[480px] bg-muted rounded-2xl -mx-4" />
        <div className="h-28 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-muted rounded-xl" />
          <div className="h-40 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">

      {/* 1. Hero Feature - Full bleed, cinematic */}
      {featuredTournament && (
        <HeroFeature
          tournament={featuredTournament.tournament}
          type={featuredTournament.type}
          courseImageUrl={heroImageUrl}
        />
      )}

      {/* 
        Strategic vertical spacing between sections:
        - Larger gaps (16 = 64px) between major sections
        - Section headers float slightly above content (built into components)
        - Intentional negative space for premium feel
      */}
      <div className="mt-16 space-y-16">
        {/* 2. World Rankings - Prestige treatment */}
        <WorldRankingsSection />

        {/* 3. Season Headlines (formerly Snapshot) */}
        <FeatureStrip
          topPlayers={seasonLeaders}
        />

        {/* 4. Top Players - Intelligent tabs */}
        <PlayersFeed
          players={topPlayersData.players}
          maxEvents={topPlayersData.maxEvents}
          maxCuts={topPlayersData.maxCuts}
        />

        {/* 5. Season Leaders - Highlight gallery */}
        <LeadersPhotoCards leaders={seasonLeaders} />

        {/* 6. Tour Venues - Aspirational gallery */}
        <CoursesPhotoGrid 
          courses={featuredCourses} 
          courseImages={courseImages}
        />

        {/* 7. Coming Soon - Intentional tease */}
        {unlockingSoonItems.length > 0 && (
          <DataUnlocking items={unlockingSoonItems} />
        )}
      </div>
    </div>
  );
}
