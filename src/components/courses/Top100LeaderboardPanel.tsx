import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayersLeaderboardView } from '@/components/leaderboard/PlayersLeaderboardView';
import { CoursesLeaderboardView } from '@/components/leaderboard/CoursesLeaderboardView';

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
    <div className="w-full pb-6">
      {/* Tabs - sticky once scrolled */}
      <Tabs value={view} onValueChange={handleViewChange} className="w-full">
        <div className="sticky top-0 z-20 bg-[var(--bg-page)]/95 backdrop-blur-sm pb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="players" className="mt-0">
          <PlayersLeaderboardView />
        </TabsContent>

        <TabsContent value="courses" className="mt-4 px-4">
          <CoursesLeaderboardView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Top100LeaderboardPanel;
