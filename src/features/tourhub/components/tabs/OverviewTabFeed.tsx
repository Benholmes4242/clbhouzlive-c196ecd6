/**
 * OverviewTabFeed - Cinematic image-led Tour Feed
 * LIV/PGA broadcast-style with full-bleed hero + photo cards
 */

import {
  HeroFeature,
  FeatureStrip,
  PlayersFeed,
  LeadersPhotoCards,
  CoursesPhotoGrid,
  DataUnlocking,
} from '../overview-feed';
import { useTourOverviewData } from '../../hooks/useTourOverviewData';
import { useCourseImageResolver } from '../../hooks/useCourseImageResolver';
import { useMemo } from 'react';

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
      <div className="space-y-6 animate-pulse">
        <div className="h-[320px] bg-muted rounded-2xl -mx-4" />
        <div className="h-24 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* 1. Hero Feature - Full bleed */}
      {featuredTournament && (
        <HeroFeature
          tournament={featuredTournament.tournament}
          type={featuredTournament.type}
          courseImageUrl={heroImageUrl}
        />
      )}

      {/* 2. Season Snapshot Strip */}
      <FeatureStrip
        topPlayers={seasonLeaders}
        courseImages={courseImages}
      />

      {/* 3. Top Players - Photo-led feed */}
      <PlayersFeed
        players={topPlayersData.players}
        maxEvents={topPlayersData.maxEvents}
        maxCuts={topPlayersData.maxCuts}
      />

      {/* 4. Season Leaders - Photo cards */}
      <LeadersPhotoCards leaders={seasonLeaders} />

      {/* 5. Featured Courses - Photo grid */}
      <CoursesPhotoGrid 
        courses={featuredCourses} 
        courseImages={courseImages}
      />

      {/* 6. Data Unlocking - quiet at bottom */}
      {unlockingSoonItems.length > 0 && (
        <DataUnlocking items={unlockingSoonItems} />
      )}
    </div>
  );
}
