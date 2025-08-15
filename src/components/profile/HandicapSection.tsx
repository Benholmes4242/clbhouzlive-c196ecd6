import React, { useMemo, useState } from 'react';
import { TrendingUp, Calendar, Share2 } from 'lucide-react';
import HandicapSummaryStats from './handicap/HandicapSummaryStats';
import HandicapProgressChart from './handicap/HandicapProgressChart';
import RecentRoundsFeed from './handicap/RecentRoundsFeed';
import ConnectHandicapPrompt from './handicap/ConnectHandicapPrompt';
import ShareHandicap from './handicap/ShareHandicap';

interface HandicapSectionProps {
  userId: string;
  profile: any;
}

// Mock data for development - in production this would come from the database
const mockRoundsData = [
  {
    id: '1',
    date: '2024-01-15',
    courseName: 'St Andrews Old Course',
    score: 78,
    par: 72,
    differential: 6.2,
    handicapAfter: 4.1,
    handicapBefore: 4.0,
    moodRating: 'good' as const,
    weather: 'Sunny, light wind',
    tees: 'Championship'
  },
  {
    id: '2', 
    date: '2024-01-08',
    courseName: 'Royal Birkdale',
    score: 82,
    par: 70,
    differential: 8.1,
    handicapAfter: 4.0,
    handicapBefore: 3.8,
    moodRating: 'okay' as const,
    weather: 'Overcast, moderate wind',
    tees: 'Medal'
  },
  {
    id: '3',
    date: '2024-01-01',
    courseName: 'Wentworth East',
    score: 75,
    par: 72,
    differential: 4.3,
    handicapAfter: 3.8,
    handicapBefore: 3.9,
    moodRating: 'great' as const,
    weather: 'Perfect conditions',
    tees: 'Medal'
  },
  {
    id: '4',
    date: '2023-12-28',
    courseName: 'Sunningdale Old',
    score: 79,
    par: 70,
    differential: 7.2,
    handicapAfter: 3.9,
    handicapBefore: 3.7,
    moodRating: 'good' as const,
    weather: 'Cold, crisp morning',
    tees: 'Medal'
  },
  {
    id: '5',
    date: '2023-12-20',
    courseName: 'Royal St George\'s',
    score: 76,
    par: 70,
    differential: 5.8,
    handicapAfter: 3.7,
    handicapBefore: 3.6,
    moodRating: 'great' as const,
    weather: 'Windy coastal conditions',
    tees: 'Championship'
  }
];

const HandicapSection: React.FC<HandicapSectionProps> = ({ userId, profile }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const currentHandicap = profile?.eg_handicap_index || null;
  const isConnected = profile?.eg_app_connected || false;
  
  // Calculate summary stats from rounds data
  const summaryStats = useMemo(() => {
    if (!mockRoundsData.length) {
      return {
        bestHandicap: null,
        threeRoundAverage: null,
        totalRounds: 0
      };
    }
    
    const handicaps = mockRoundsData.map(round => round.handicapAfter);
    const recentThree = handicaps.slice(0, 3);
    
    return {
      bestHandicap: Math.min(...handicaps),
      threeRoundAverage: recentThree.length > 0 
        ? recentThree.reduce((sum, h) => sum + h, 0) / recentThree.length 
        : null,
      totalRounds: mockRoundsData.length
    };
  }, []);
  
  // Convert rounds data to chart format
  const chartData = useMemo(() => {
    return mockRoundsData
      .slice()
      .reverse()
      .map((round, index) => ({
        date: new Date(round.date).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short' 
        }),
        handicap: round.handicapAfter,
        round: index + 1,
        courseName: round.courseName
      }));
  }, []);

  // Calculate recent trend
  const recentTrend = useMemo(() => {
    if (mockRoundsData.length < 2) return 'stable';
    const recent = mockRoundsData[0].handicapAfter;
    const previous = mockRoundsData[1].handicapAfter;
    const difference = recent - previous;
    
    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'up' : 'down';
  }, []);

  const handleConnectEnglandGolf = () => {
    // TODO: Implement England Golf connection
    console.log('Connect to England Golf');
  };

  const handleManualEntry = () => {
    // TODO: Implement manual round entry
    console.log('Manual round entry');
  };

  const handleShare = (method: 'instagram' | 'whatsapp' | 'download') => {
    // TODO: Implement sharing functionality
    console.log('Share handicap via:', method);
  };

  // Show connect prompt if no handicap data
  if (!currentHandicap && !isConnected) {
    return (
      <div className="space-y-6">
        <ConnectHandicapPrompt
          onConnectClick={handleConnectEnglandGolf}
          onManualEntryClick={handleManualEntry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-0">
      {/* Summary Stats */}
      <HandicapSummaryStats
        currentHandicap={currentHandicap}
        bestHandicap={summaryStats.bestHandicap}
        threeRoundAverage={summaryStats.threeRoundAverage}
        totalRounds={summaryStats.totalRounds}
        isLoading={isLoading}
      />

      {/* Progress Chart */}
      <div className="bg-muted border border-border rounded-lg p-6">
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Handicap Progress
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track your handicap changes over recent rounds
          </p>
        </div>
        <HandicapProgressChart 
          data={chartData}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Rounds */}
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
        <RecentRoundsFeed 
          rounds={mockRoundsData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default HandicapSection;