/**
 * OverviewTabV2 - Cinematic Tour Hub Overview
 * Magazine-like, content-led experience using the new components
 */

import {
  TourHeroCinematic,
  FeaturedMomentCard,
  SeasonSnapshotCinematic,
  TopPlayersFeed,
  SeasonLeadersAward,
  FeaturedCoursesDestination,
  StorylineInsightStrip,
  HistoryCarousel,
  DataUnlockingPremium,
} from '../overview-v2';
import { useTourOverviewData } from '../../hooks/useTourOverviewData';

export function OverviewTabV2() {
  const {
    season,
    seasonStatus,
    featuredTournament,
    snapshotStats,
    topPlayersData,
    seasonLeaders,
    featuredCourses,
    storylineInsights,
    unlockingSoonItems,
    historyMoments,
    isLoading,
  } = useTourOverviewData();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
        <div className="h-40 bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-muted rounded-2xl" />
          <div className="h-48 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Tour Hero */}
      <TourHeroCinematic
        tourName={season?.tour_name || 'PGA Tour'}
        year={season?.year || new Date().getFullYear()}
        status={seasonStatus as 'live' | 'active' | 'upcoming' | 'completed'}
      />

      {/* 2. Featured Moment (Tournament Spotlight) */}
      {featuredTournament && (
        <FeaturedMomentCard
          tournament={featuredTournament.tournament}
          type={featuredTournament.type}
        />
      )}

      {/* 3. Season Snapshot */}
      <SeasonSnapshotCinematic stats={snapshotStats} />

      {/* 4. Storyline Insight Strip (optional) */}
      {storylineInsights.length > 0 && (
        <StorylineInsightStrip insights={storylineInsights} />
      )}

      {/* 5. Two Column Layout - Players & Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPlayersFeed
          players={topPlayersData.players}
          maxEvents={topPlayersData.maxEvents}
          maxCuts={topPlayersData.maxCuts}
        />
        <SeasonLeadersAward leaders={seasonLeaders} />
      </div>

      {/* 6. Featured Courses */}
      <FeaturedCoursesDestination courses={featuredCourses} />

      {/* 7. This Week in Golf History (optional) */}
      {historyMoments.length > 0 && (
        <HistoryCarousel moments={historyMoments} />
      )}

      {/* 8. Data Unlocking Soon */}
      {unlockingSoonItems.length > 0 && (
        <DataUnlockingPremium items={unlockingSoonItems} />
      )}
    </div>
  );
}
