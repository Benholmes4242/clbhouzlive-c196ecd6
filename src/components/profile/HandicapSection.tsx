import React, { useMemo, useState } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import HandicapSummaryStats from './handicap/HandicapSummaryStats';
import HandicapProgressChart from './handicap/HandicapProgressChart';
import RecentRoundsFeed from './handicap/RecentRoundsFeed';
import ConnectHandicapPrompt from './handicap/ConnectHandicapPrompt';

// NEW
import StoriesRow from './handicap/StoriesRow';
import XpToast from './handicap/XpToast';
import AnalyticsTabs from './handicap/AnalyticsTabs';
import FriendsLeaderboard from './handicap/FriendsLeaderboard';
import AchievementsSpotlight from './handicap/AchievementsSpotlight';
import PredictiveInsight from './handicap/PredictiveInsight';

// ----- props -----
interface HandicapSectionProps {
  userId: string;
  profile: any;
}

// ----- dev mock (keep for now; swap to DB later) -----
const mockRoundsData = [
  {
    id: '1',
    date: '2024-01-15',
    courseName: 'St Andrews Old Course',
    score: 78, par: 72, differential: 6.2,
    handicapAfter: 4.1, handicapBefore: 4.0,
    moodRating: 'good' as const, weather: 'Sunny, light wind', tees: 'Championship'
  },
  {
    id: '2',
    date: '2024-01-08',
    courseName: 'Royal Birkdale',
    score: 82, par: 72, differential: 8.1,
    handicapAfter: 4.0, handicapBefore: 3.9,
    moodRating: 'okay' as const, weather: 'Breezy', tees: 'Back'
  },
  {
    id: '3',
    date: '2024-01-01',
    courseName: 'Wentworth East',
    score: 75, par: 72, differential: 4.3,
    handicapAfter: 3.8, handicapBefore: 3.9,
    moodRating: 'good' as const, weather: 'Overcast', tees: 'Back'
  },
  {
    id: '4',
    date: '2023-12-28',
    courseName: 'Sunningdale Old',
    score: 79, par: 70, differential: 7.2,
    handicapAfter: 3.9, handicapBefore: 3.7,
    moodRating: 'good' as const, weather: 'Calm', tees: 'Members'
  },
  {
    id: '5',
    date: '2023-12-20',
    courseName: "Royal St George's",
    score: 76, par: 70, differential: 5.8,
    handicapAfter: 3.7, handicapBefore: 3.8,
    moodRating: 'good' as const, weather: 'Calm', tees: 'Members'
  },
];

const HandicapSection: React.FC<HandicapSectionProps> = ({ userId, profile }) => {
  const [isLoading] = useState(false);
  const currentHandicap = profile?.eg_handicap_index || null;
  const isConnected = profile?.eg_app_connected || false;

  // ----- derived stats used by summary + chart -----
  const summaryStats = useMemo(() => {
    if (!mockRoundsData.length) {
      return { bestHandicap: null, threeRoundAverage: null, totalRounds: 0 };
    }
    const handicaps = mockRoundsData.map(r => r.handicapAfter);
    const recentThree = handicaps.slice(0, 3);
    return {
      bestHandicap: Math.min(...handicaps),
      threeRoundAverage: recentThree.reduce((a, b) => a + b, 0) / recentThree.length,
      totalRounds: mockRoundsData.length
    };
  }, []);

  // chart series: newest on right
  const chartData = useMemo(() => {
    return mockRoundsData.slice().reverse().map((r, idx) => ({
      date: new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      handicap: r.handicapAfter,
      best: Math.min(...mockRoundsData.map(x => x.handicapAfter)),
      threeRoundAvg: (() => {
        const arr = mockRoundsData.slice().reverse().slice(0, idx + 1).map(x => x.handicapAfter);
        const t = arr.slice(-3);
        return t.reduce((a, b) => a + b, 0) / t.length;
      })(),
      roundsCount: idx + 1,
      meta: { courseName: r.courseName, score: r.score, diff: r.differential, dateISO: r.date }
    }));
  }, []);

  // ----- onboarding -----
  if (!currentHandicap && !isConnected) {
    return (
      <div className="space-y-6">
        <ConnectHandicapPrompt
          onConnectClick={() => console.log('Connect to England Golf')}
          onManualEntryClick={() => console.log('Manual round entry')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-0">
      {/* 1) STORIES (social at the top) */}
      <StoriesRow
        items={[
          // dev placeholders: green (improve), red (increase), grey (no change)
          { userId: 'u1', displayName: 'Michael', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', deltaIndex: -0.2, lastUpdatedISO: '2024-01-16', hasUnseen: true },
          { userId: 'u2', displayName: 'Lauren',  avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face', deltaIndex: -0.1, lastUpdatedISO: '2024-01-15', hasUnseen: true },
          { userId: 'u3', displayName: 'Rachel',  avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', deltaIndex: +0.3, lastUpdatedISO: '2024-01-14', hasUnseen: false },
          { userId: 'u4', displayName: 'Daniel',  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', deltaIndex:  0.0, lastUpdatedISO: '2024-01-13', hasUnseen: false },
        ]}
      />

      {/* 2) XP TOAST */}
      <XpToast event={{ id: 'xp1', createdAt: new Date().toISOString(), amount: 150, reason: 'Improved 3-round average' }} />

      {/* 3) SUMMARY CARDS (unchanged) */}
      <HandicapSummaryStats
        currentHandicap={currentHandicap}
        bestHandicap={summaryStats.bestHandicap}
        threeRoundAverage={summaryStats.threeRoundAverage}
        totalRounds={summaryStats.totalRounds}
        isLoading={isLoading}
      />

      {/* 4) ANALYTICS (tabs + reused chart) */}
      <div className="bg-muted border border-border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Handicap Analytics
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Toggle metrics and tap points to view round details.
          </p>
        </div>

        <AnalyticsTabs
          tabs={[
            { key: 'index', label: 'Handicap' },
            { key: 'threeRoundAvg', label: '3-Round Avg' },
            { key: 'best', label: 'Best Handicap' },
            { key: 'rounds', label: 'Rounds' },
          ]}
          renderChart={(metric) => (
            <HandicapProgressChart
              data={chartData.map(p => ({
                date: p.date,
                handicap:
                  metric === 'index' ? p.handicap :
                  metric === 'threeRoundAvg' ? p.threeRoundAvg :
                  metric === 'best' ? p.best : p.roundsCount,
                round: p.roundsCount,
                courseName: p.meta.courseName,
                meta: p.meta
              }))}
              isLoading={isLoading}
            />
          )}
        />
      </div>

      {/* 5) LEADERBOARD */}
      <FriendsLeaderboard rows={[
        { userId: 'u2', displayName: 'Lauren', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face', monthDelta: -0.6, rank: 1 },
        { userId: 'u5', displayName: 'Ryan',   avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', monthDelta: -0.5, rank: 2 },
        { userId: 'u4', displayName: 'Daniel', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', monthDelta: -0.4, rank: 3 },
      ]} />

      {/* 6) ACHIEVEMENTS */}
      <AchievementsSpotlight item={{
        id: 'pb1', title: 'New Personal Best', subtitle: `Best handicap: ${summaryStats.bestHandicap?.toFixed(1)}`, icon: 'trophy',
        earnedAt: '2024-01-15', isGlowing: true
      }}/>

      {/* 7) PREDICTION */}
      <PredictiveInsight message="If you play to your 3-round average tomorrow, your handicap could drop to" targetIndex={3.8} />

      {/* 8) RECENT ROUNDS (existing) */}
      <div className="bg-muted border border-border rounded-lg p-6">
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Rounds
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your latest golf rounds and performance
          </p>
        </div>
        <RecentRoundsFeed rounds={mockRoundsData} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default HandicapSection;