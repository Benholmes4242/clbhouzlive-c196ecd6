import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Top100PlayersLeaderboardView } from '@/components/top100/Top100PlayersLeaderboardView';
import { Top100CoursesLeaderboardView } from '@/components/top100/Top100CoursesLeaderboardView';

const Top100LeaderboardPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Wire view from URL
  const initialView =
    searchParams.get('view') === 'courses' || searchParams.get('view') === 'players'
      ? (searchParams.get('view') as 'players' | 'courses')
      : 'players';

  const [view, setView] = useState<'players' | 'courses'>(initialView);

  const handleViewChange = (next: string) => {
    const nextView = next as 'players' | 'courses';
    setView(nextView);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', nextView);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-foreground">Top 100 Club – Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          See how you rank against the best golfers chasing the Top 100
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={view} onValueChange={handleViewChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-6">
          <Top100PlayersLeaderboardView />
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <Top100CoursesLeaderboardView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Top100LeaderboardPanel;
