import React from 'react';
import { Calendar } from 'lucide-react';
import { BEN_HANDICAP_MOCK } from '@/lib/mockHandicapData';
import HandicapHeroStrip from './HandicapHeroStrip';
import HandicapStatGrid from './HandicapStatGrid';
import HandicapJourneyChart from './HandicapJourneyChart';
import CourseImpactCard from './CourseImpactCard';
import FriendsHandicapCard from './FriendsHandicapCard';
import HandicapMilestonesCard from './HandicapMilestonesCard';
import RecentRoundsFeed from './RecentRoundsFeed';

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
    <div className="space-y-6 pb-24">
      {/* A. Hero Strip */}
      <HandicapHeroStrip
        currentIndex={data.currentIndex}
        lastUpdated={data.lastUpdated}
        yearDelta={-2.3}
      />

      {/* B. Stat Grid */}
      <HandicapStatGrid
        currentIndex={data.currentIndex}
        bestIndex={data.bestIndex}
        threeRoundAverage={data.threeRoundAverage}
        roundsCounted={data.roundsCounted}
      />

      {/* C. Handicap Journey Chart */}
      <HandicapJourneyChart timeline={data.timeline} />

      {/* D. Course Impact */}
      <CourseImpactCard
        toughest={data.toughestCourses}
        best={data.bestCourses}
      />

      {/* E. Friends & Rivals */}
      <FriendsHandicapCard friends={data.friends} />

      {/* F. Milestones */}
      <HandicapMilestonesCard milestones={data.milestones} />

      {/* G. Recent Rounds */}
      <section className="bg-muted border border-border rounded-sq-md p-4">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Calendar className="h-5 w-5 text-primary-accent" />
            Recent Rounds
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your latest golf rounds and performance
          </p>
        </div>
        <RecentRoundsFeed rounds={mockRoundsData} isLoading={false} />
      </section>
    </div>
  );
};

export default HandicapDemoExperience;
