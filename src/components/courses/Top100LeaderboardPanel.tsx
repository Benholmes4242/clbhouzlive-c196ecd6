import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ChampionshipLeaderboardView } from '@/components/championship';
import { CoursesLeaderboardView } from '@/components/leaderboard/CoursesLeaderboardView';
import { ExplorationTab, HandicapTab } from '@/components/leaderboards';

type LeaderboardView = 'championship' | 'courses' | 'exploration' | 'handicap';

const Top100LeaderboardPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialView = (): LeaderboardView => {
    const param = searchParams.get('view');
    if (param === 'courses' || param === 'championship' || param === 'exploration' || param === 'handicap') {
      return param;
    }
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

  const tabs = [
    { id: 'championship' as const, label: 'Top 100' },
    { id: 'exploration' as const, label: 'Global' },
    { id: 'courses' as const, label: 'Courses' },
    { id: 'handicap' as const, label: 'Handicap' },
  ];

  return (
    <div className="w-full pb-6">
      <Tabs value={view} onValueChange={handleViewChange} className="w-full">
        <div className="px-3">
          <TabsList className="bg-transparent border-0 px-0 py-0 gap-0 w-full flex justify-center">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none min-h-[44px] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out active:scale-[0.98] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="championship" className="mt-0">
          <ChampionshipLeaderboardView />
        </TabsContent>

        <TabsContent value="courses" className="mt-3">
          <CoursesLeaderboardView />
        </TabsContent>

        <TabsContent value="exploration" className="mt-0">
          <ExplorationTab />
        </TabsContent>

        <TabsContent value="handicap" className="mt-0">
          <HandicapTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Top100LeaderboardPanel;
