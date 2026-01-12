/**
 * OverviewTabFeed - Cinematic image-led Tour Feed
 * LIV/PGA broadcast-style with full-bleed hero + photo cards
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
    <div className="pb-8">
      {/* 1. Hero Feature - Full bleed (white background) */}
      <div className="bg-white -mx-4 px-4 py-6 sm:-mx-6 sm:px-6">
        {featuredTournament && (
          <HeroFeature
            tournament={featuredTournament.tournament}
            type={featuredTournament.type}
            courseImageUrl={heroImageUrl}
          />
        )}
      </div>

      {/* 2. World Rankings - slate-50 background */}
      <div className="bg-slate-50 -mx-4 px-4 py-6 sm:-mx-6 sm:px-6">
        <WorldRankingsSection />
      </div>

      {/* 3. Season Snapshot Strip - white background */}
      <div className="bg-white -mx-4 px-4 py-6 sm:-mx-6 sm:px-6">
        <FeatureStrip topPlayers={seasonLeaders} />
      </div>

      {/* 4. Top Players - slate-50 background */}
      <div className="bg-slate-50 -mx-4 px-4 py-6 sm:-mx-6 sm:px-6">
        <PlayersFeed
          players={topPlayersData.players}
          maxEvents={topPlayersData.maxEvents}
          maxCuts={topPlayersData.maxCuts}
        />
      </div>

      {/* 5. Season Leaders - white background */}
      <div className="bg-white -mx-4 px-4 py-6 sm:-mx-6 sm:px-6">
        <LeadersPhotoCards leaders={seasonLeaders} />
      </div>

      {/* 6. Tour Venues - slate-50 background */}
      <div className="bg-slate-50 -mx-4 px-4 py-6 sm:-mx-6 sm:px-6">
        <CoursesPhotoGrid 
          courses={featuredCourses} 
          courseImages={courseImages}
        />
      </div>

      {/* 7. Coming Soon - white background */}
      {unlockingSoonItems.length > 0 && (
        <div className="bg-white -mx-4 px-4 py-6 sm:-mx-6 sm:px-6">
          <DataUnlocking items={unlockingSoonItems} />
        </div>
      )}
    </div>
  );
}
