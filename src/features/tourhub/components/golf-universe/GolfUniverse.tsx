/**
 * GolfUniverse - The world's most advanced single-page overview of professional golf
 * 
 * Module order (correct architecture):
 * 1. Global Pulse (sticky)
 * 2. Tour Lens Selector
 * 3. Hero Event Portal
 * 4. Live Now (conditional)
 * 5. My Golf (conditional)
 * 6. Momentum Orbit
 * 7. Weekly Storylines
 * 8. Player Stack
 * 9. Venue Atlas
 * 10. Data Futures
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
import { useCourseImageResolver } from '../../hooks/useCourseImageResolver';

// Skeleton loading state
function GolfUniverseSkeleton() {
  return (
    <div className="space-y-6 pt-4 animate-pulse">
      {/* Pulse skeleton */}
      <div className="h-12 bg-slate-200 rounded-lg -mx-4" />
      
      {/* Lens selector skeleton */}
      <div className="flex gap-2">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-9 w-16 bg-slate-100 rounded-full" />
        ))}
      </div>
      
      {/* Hero skeleton */}
      <div className="h-[320px] bg-slate-100 rounded-2xl -mx-4" />
      
      {/* Orbit skeleton */}
      <div className="h-[260px] bg-slate-50 rounded-2xl flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-200" />
      </div>
      
      {/* Storylines skeleton */}
      <div className="flex gap-3 overflow-hidden -mx-4 px-4">
        {[1,2,3].map(i => (
          <div key={i} className="w-[260px] h-[160px] bg-slate-100 rounded-xl shrink-0" />
        ))}
      </div>
    </div>
  );
}

// Empty state when no data
function GolfUniverseEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <span className="text-3xl">🏌️</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Loading Golf Universe</h2>
      <p className="text-sm text-slate-500 text-center max-w-xs">
        Connecting to live tour data feeds. This may take a moment.
      </p>
    </div>
  );
}

export function GolfUniverse() {
  const { activeLens, setActiveLens, isTransitioning } = useTourLens();
  
  const {
    heroEvent,
    events,
    rankedPlayers,
    pulseItems,
    storylines,
    dataUnlocks,
    isLoading,
  } = useGolfUniverseData(activeLens);

  // Venues from featured courses (deprecated - using empty array as useTourOverviewData was removed)
  const venues: { venueName: string; city?: string; country?: string }[] = [];
  const { data: courseImages } = useCourseImageResolver(venues);

  const {
    follows,
    togglePlayerFollow,
    isFollowingEvent,
    followEvent,
    unfollowEvent,
    unfollowPlayer,
    unfollowTour,
    hasFollows,
  } = useUserFollows();

  if (isLoading) {
    return <GolfUniverseSkeleton />;
  }

  if (!heroEvent && events.length === 0 && rankedPlayers.length === 0) {
    return <GolfUniverseEmpty />;
  }

  return (
    <motion.div 
      className="pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={activeLens}
    >
      {/* 1. Global Pulse - full width on mobile */}
      <GlobalPulse items={pulseItems} />

      {/* 2. Tour Lens Selector - with horizontal padding */}
      <div className="mt-3 mb-2 px-4">
        <TourLensSelector
          activeLens={activeLens}
          onSelect={setActiveLens}
          isTransitioning={isTransitioning}
        />
      </div>

      {/* 3. Hero Event Portal - full width on mobile */}
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

      {/* Padded content below hero */}
      <div className="px-4">
        {/* 4. Live Now (conditional) */}
        <LiveNowModule events={events} />

        {/* 5. My Golf (conditional) */}
        {hasFollows && (
          <MyGolfLayer
            follows={follows}
            players={rankedPlayers}
            events={events}
            onRemovePlayer={unfollowPlayer}
            onRemoveTour={unfollowTour}
            onRemoveEvent={unfollowEvent}
          />
        )}

        {/* 6. Momentum Orbit */}
        <MomentumOrbit
          players={rankedPlayers}
          onPlayerClick={(player) => togglePlayerFollow(player.id)}
        />

        {/* 7. Weekly Storylines */}
        <StorylinesRail storylines={storylines} />

        {/* 8. Player Stack */}
        <PlayerStack players={rankedPlayers} limit={10} />

        {/* 9. Venue Atlas */}
        <VenueAtlas courses={[]} courseImages={courseImages} />

        {/* 10. Data Futures */}
        <DataFutures items={dataUnlocks} />
      </div>
    </motion.div>
  );
}
