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
        <div
          className="sticky top-0 z-20 pb-2 pt-1 -mx-4 px-4"
          style={{
            background: '#F8FAFC',
            borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          }}
        >
          <TabsList className="bg-transparent border-0 px-0 py-0 gap-1 w-full flex">
            {tabs.map((tab) => {
              const isActive = tab.id === view;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "relative flex-1 py-1.5 px-2 text-sm whitespace-nowrap min-h-[44px] transition-colors duration-200 active:scale-[0.98] bg-transparent border-0 shadow-none after:hidden data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                    isActive ? "font-extrabold" : "font-medium"
                  )}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isActive ? '#0F172A' : '#94A3B8',
                    letterSpacing: isActive ? '-0.01em' : 0,
                  }}
                >
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="championship" className="mt-0">
          <ChampionshipLeaderboardView />
        </TabsContent>

        <TabsContent value="courses" className="mt-3 -mx-4">
          <CoursesLeaderboardView />
        </TabsContent>

        <TabsContent value="exploration" className="mt-0 -mx-4">
          <ExplorationTab />
        </TabsContent>

        <TabsContent value="handicap" className="mt-0 -mx-4">
          <HandicapTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Top100LeaderboardPanel;
