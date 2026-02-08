import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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

  // Tab configuration with two-line labels and new order
  const tabs = [
    { id: 'championship' as const, line1: 'Top 100', line2: 'Leaders' },
    { id: 'exploration' as const, line1: 'Global', line2: 'Golfers' },
    { id: 'courses' as const, line1: 'Leading', line2: 'Courses' },
    { id: 'handicap' as const, line1: 'Handicap', line2: 'Leaders' },
  ];

  return (
    <div className="w-full pb-6">
      <Tabs value={view} onValueChange={handleViewChange} className="w-full">
        <div className="px-3">
          {/* Two-line tab labels with Apple-style polish */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleViewChange(tab.id)}
                className={cn(
                  'flex-1 py-2 px-2 rounded-lg text-center transition-all duration-200 active:scale-[0.97]',
                  view === tab.id
                    ? 'bg-card shadow-sm border border-border'
                    : 'text-muted-foreground hover:bg-card/50'
                )}
              >
                <span className={cn(
                  'block text-[11px] font-semibold leading-tight',
                  view === tab.id ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {tab.line1}
                </span>
                <span className={cn(
                  'block text-[11px] font-medium leading-tight',
                  view === tab.id ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {tab.line2}
                </span>
              </button>
            ))}
          </div>
        </div>

        <TabsContent value="championship" className="mt-0">
          <ChampionshipLeaderboardView />
        </TabsContent>

        <TabsContent value="courses" className="mt-0">
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
