import React from 'react';
import { ChevronRight } from 'lucide-react';
import { BEN_HANDICAP_MOCK, BEN_NEXT_ROUND_PREDICTION } from '@/lib/mockHandicapData';
import HandicapHeroStrip from './HandicapHeroStrip';
import HandicapStatGrid from './HandicapStatGrid';
import { HandicapJourneyCard } from './HandicapJourneyCard';
import { HandicapCourseImpactCard } from './HandicapCourseImpactCard';
import { HandicapNextRoundPredictionCard } from './HandicapNextRoundPredictionCard';
import FriendsHandicapCard from './FriendsHandicapCard';
import HandicapMilestonesCard from './HandicapMilestonesCard';
import RecentRoundsFeed from './RecentRoundsFeed';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

// Mock rounds for recent rounds section
const mockRoundsData = [
  {
    id: '1',
    date: '2026-01-10',
    courseName: 'Sundridge Park',
    score: 76, par: 72, differential: 4.0,
    handicapAfter: 4.0, handicapBefore: 4.0,
    moodRating: 'good' as const, weather: 'Overcast', tees: 'Members'
  },
  {
    id: '2',
    date: '2025-12-20',
    courseName: 'Royal Troon',
    score: 78, par: 72, differential: 5.8,
    handicapAfter: 4.0, handicapBefore: 4.1,
    moodRating: 'okay' as const, weather: 'Breezy', tees: 'Championship'
  },
  {
    id: '3',
    date: '2025-11-15',
    courseName: 'St Andrews Old Course',
    score: 75, par: 72, differential: 3.2,
    handicapAfter: 4.1, handicapBefore: 4.2,
    moodRating: 'great' as const, weather: 'Calm', tees: 'Championship'
  },
  {
    id: '4',
    date: '2025-10-05',
    courseName: 'Walton Heath Old',
    score: 77, par: 72, differential: 4.8,
    handicapAfter: 4.2, handicapBefore: 4.3,
    moodRating: 'good' as const, weather: 'Sunny', tees: 'Members'
  },
  {
    id: '5',
    date: '2025-09-12',
    courseName: 'Royal St Georges',
    score: 79, par: 70, differential: 6.2,
    handicapAfter: 4.3, handicapBefore: 4.4,
    moodRating: 'good' as const, weather: 'Windy', tees: 'Back'
  },
];

const HandicapDemoExperience: React.FC = () => {
  const data = BEN_HANDICAP_MOCK;

  return (
    <div className="max-w-[480px] mx-auto pb-24 space-y-6">
      {/* A. Hero Strip - white card on grey background */}
      <div className="bg-background border border-border rounded-sq-lg shadow-sm p-5">
        <HandicapHeroStrip
          currentIndex={data.currentIndex}
          lastUpdated={data.lastUpdated}
          yearDelta={-2.3}
        />
      </div>

      {/* B. Stat Grid - 2x2 */}
      <HandicapStatGrid
        currentIndex={data.currentIndex}
        bestIndex={data.bestIndex}
        threeRoundAverage={data.threeRoundAverage}
        roundsCounted={data.roundsCounted}
      />

      {/* C. Handicap Journey Chart */}
      <HandicapJourneyCard timeline={data.timeline} />

      {/* D. Course Impact */}
      <HandicapCourseImpactCard rounds={data.rounds} />

      {/* E. Next Round Prediction */}
      <HandicapNextRoundPredictionCard prediction={BEN_NEXT_ROUND_PREDICTION} />

      {/* F. Friends & Rivals */}
      <FriendsHandicapCard friends={data.friends} />

      {/* G. Milestones */}
      <HandicapMilestonesCard milestones={data.milestones} />

      {/* H. Recent Rounds */}
      <section className="bg-background border border-border rounded-sq-lg shadow-sm overflow-hidden">
        <div className="p-5 pb-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Recent Rounds
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your latest golf rounds and performance
          </p>
        </div>
        <div className="p-4">
          <RecentRoundsFeed rounds={mockRoundsData} isLoading={false} />
        </div>
        {/* View all CTA */}
        <div className="border-t border-border px-5 py-3">
          <button className="w-full flex items-center justify-center gap-0.5 text-[0.8125rem] font-medium text-muted-foreground active:scale-95 transition-transform">
            View all rounds
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>
        </div>
      </section>

      {/* Scroll to top FAB */}
      <ScrollToTopGlass />
    </div>
  );
};

export default HandicapDemoExperience;
