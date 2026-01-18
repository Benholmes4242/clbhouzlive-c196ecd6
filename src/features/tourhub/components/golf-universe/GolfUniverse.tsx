/**
 * GolfUniverse - The world's most advanced single-page overview of professional golf
 * Spanning PGA Tour, LPGA, LIV Golf, DP World Tour, Majors, Ryder Cup & Olympics
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GlobalPulse,
  HeroEventPortal,
  LiveNowModule,
  MomentumOrbit,
  PlayerStack,
  StorylinesRail,
  TourLensSelector,
  VenueAtlas,
  DataFutures,
  MyGolfLayer,
} from './components';
import { useGolfUniverseData, useTourLens, useUserFollows } from './hooks';
import { useTourOverviewData } from '../../hooks/useTourOverviewData';
import { useCourseImageResolver } from '../../hooks/useCourseImageResolver';

export function GolfUniverse() {
  // Tour Lens state
  const { activeLens, setActiveLens, isTransitioning } = useTourLens();
  
  // Core data
  const {
    heroEvent,
    events,
    rankedPlayers,
    pulseItems,
    storylines,
    dataUnlocks,
    isLoading,
  } = useGolfUniverseData(activeLens);

  // Additional data for venues
  const { featuredCourses } = useTourOverviewData();
  
  // Course images
  const venues = useMemo(() => 
    featuredCourses.map(c => ({
      venueName: c.name,
      city: c.location?.split(',')[0]?.trim(),
      country: 'USA',
    })),
    [featuredCourses]
  );
  const { data: courseImages } = useCourseImageResolver(venues);

  // User follows
  const {
    follows,
    togglePlayerFollow,
    isFollowingEvent,
    followEvent,
    unfollowEvent,
    unfollowPlayer,
    unfollowTour,
  } = useUserFollows();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse pt-4">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-[60vh] max-h-[480px] bg-slate-100 rounded-2xl" />
        <div className="h-[320px] bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div 
      className="pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={activeLens}
    >
      {/* 1. Global Pulse - Sticky mini strip */}
      <GlobalPulse items={pulseItems} />

      {/* Tour Lens Selector */}
      <div className="mt-4 mb-2">
        <TourLensSelector
          activeLens={activeLens}
          onSelect={setActiveLens}
          isTransitioning={isTransitioning}
        />
      </div>

      {/* 2. Hero Event Portal */}
      {heroEvent && (
        <HeroEventPortal
          event={heroEvent}
          isFollowing={isFollowingEvent(heroEvent.id)}
          onFollow={() => {
            if (isFollowingEvent(heroEvent.id)) {
              unfollowEvent(heroEvent.id);
            } else {
              followEvent(heroEvent.id);
            }
          }}
        />
      )}

      {/* 3. Live Now Module (conditional) */}
      <LiveNowModule events={events} />

      {/* 4. My Golf Layer (personalization) */}
      <MyGolfLayer
        follows={follows}
        players={rankedPlayers}
        events={events}
        onRemovePlayer={unfollowPlayer}
        onRemoveTour={unfollowTour}
        onRemoveEvent={unfollowEvent}
      />

      {/* 5. World Rankings - Momentum Orbit */}
      <MomentumOrbit
        players={rankedPlayers}
        onPlayerClick={(player) => togglePlayerFollow(player.id)}
      />

      {/* 6. Weekly Storylines */}
      <StorylinesRail storylines={storylines} />

      {/* 7. Player Stack */}
      <PlayerStack players={rankedPlayers} limit={10} />

      {/* 8. Venue Atlas */}
      <VenueAtlas courses={featuredCourses} courseImages={courseImages} />

      {/* 9. Data Futures (locked indicators) */}
      <DataFutures items={dataUnlocks} />
    </motion.div>
  );
}
