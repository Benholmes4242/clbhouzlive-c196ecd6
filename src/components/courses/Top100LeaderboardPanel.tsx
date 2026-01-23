import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChampionshipLeaderboardView } from '@/components/championship';
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
        <div className="pb-2 px-4">
          <TabsList className="flex p-1 rounded-xl overflow-hidden bg-[#e2e8f0]">
            <TabsTrigger 
              value="players"
              className="flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-150 data-[state=active]:m-1 data-[state=active]:bg-white data-[state=active]:text-[#1e293b] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#e2e8f0] data-[state=inactive]:text-[#64748b] data-[state=inactive]:hover:text-[#1e293b] data-[state=inactive]:hover:bg-white/50 data-[state=inactive]:bg-transparent data-[state=inactive]:border-0 data-[state=inactive]:shadow-none"
            >
              Players
            </TabsTrigger>
            <TabsTrigger 
              value="courses"
              className="flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-150 data-[state=active]:m-1 data-[state=active]:bg-white data-[state=active]:text-[#1e293b] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#e2e8f0] data-[state=inactive]:text-[#64748b] data-[state=inactive]:hover:text-[#1e293b] data-[state=inactive]:hover:bg-white/50 data-[state=inactive]:bg-transparent data-[state=inactive]:border-0 data-[state=inactive]:shadow-none"
            >
              Courses
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="players" className="mt-0">
          <ChampionshipLeaderboardView />
        </TabsContent>

        <TabsContent value="courses" className="mt-0">
          <CoursesLeaderboardView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Top100LeaderboardPanel;
