import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChampionshipLeaderboardView } from '@/components/championship';
import { CoursesLeaderboardView } from '@/components/leaderboard/CoursesLeaderboardView';
import { ExplorationTab, HandicapTab } from '@/components/leaderboards';

type LeaderboardView = 'championship' | 'courses' | 'exploration' | 'handicap';

const Top100LeaderboardPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Wire view from URL - default to championship (was 'players')
  const getInitialView = (): LeaderboardView => {
    const param = searchParams.get('view');
    if (param === 'courses' || param === 'championship' || param === 'exploration' || param === 'handicap') {
      return param;
    }
    // Legacy support: 'players' maps to 'championship'
    if (param === 'players') return 'championship';
    return 'championship';
  };

  const [view, setView] = useState<LeaderboardView>(getInitialView);

  const handleViewChange = (next: string) => {
    const nextView = next as LeaderboardView;
    setView(nextView);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', nextView);
    setSearchParams(nextParams, { replace: true });
  };

  const tabTriggerClass = "flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-all duration-150 flex items-center justify-center data-[state=active]:m-0.5 data-[state=active]:bg-white data-[state=active]:text-[#1e293b] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#e2e8f0] data-[state=inactive]:text-[#64748b] data-[state=inactive]:hover:text-[#1e293b] data-[state=inactive]:hover:bg-white/50 data-[state=inactive]:bg-transparent data-[state=inactive]:border-0 data-[state=inactive]:shadow-none";

  return (
    <div className="w-full pb-6">
      <Tabs value={view} onValueChange={handleViewChange} className="w-full">
        <div className="pb-2 px-4">
          <TabsList className="flex p-1 rounded-xl overflow-hidden bg-[#e2e8f0]">
            <TabsTrigger value="championship" className={tabTriggerClass}>
              Championship
            </TabsTrigger>
            <TabsTrigger value="courses" className={tabTriggerClass}>
              Courses
            </TabsTrigger>
            <TabsTrigger value="exploration" className={tabTriggerClass}>
              Explore
            </TabsTrigger>
            <TabsTrigger value="handicap" className={tabTriggerClass}>
              Handicap
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="championship" className="mt-0">
          <ChampionshipLeaderboardView />
        </TabsContent>

        <TabsContent value="courses" className="mt-0">
          <CoursesLeaderboardView />
        </TabsContent>

        <TabsContent value="exploration" className="mt-0 px-4">
          <ExplorationTab />
        </TabsContent>

        <TabsContent value="handicap" className="mt-0 px-4">
          <HandicapTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Top100LeaderboardPanel;
