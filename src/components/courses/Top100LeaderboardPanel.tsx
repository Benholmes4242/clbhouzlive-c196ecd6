import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayersLeaderboardView } from '@/components/leaderboard/PlayersLeaderboardView';
import { CoursesLeaderboardView } from '@/components/leaderboard/CoursesLeaderboardView';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const Top100LeaderboardPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSupabaseSession();

  // Get user's Top 100 progress for closest goal banner
  const { data: myProgress } = useTop100ProgressForUser(user?.id);

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

  // Compute banner model
  const nextMilestone = myProgress?.next_milestone;
  const totalPlayed = myProgress?.totalTop100Played ?? 0;
  const showGoalsBanner = !!nextMilestone && totalPlayed > 0;

  const handleShowCoursesClick = () => {
    handleViewChange('courses');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 pb-6">
      {/* Closest Goal Banner */}
      {showGoalsBanner && (
        <div className="w-full rounded-sq-md border border-border/60 bg-card/90 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Closest goal
              </span>
              <span className="text-sm font-medium">
                You're{' '}
                <span className="font-semibold">
                  {nextMilestone.remaining} course
                  {nextMilestone.remaining === 1 ? '' : 's'}
                </span>{' '}
                away from{' '}
                <span className="font-semibold">{nextMilestone.tierName}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShowCoursesClick}
            className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium bg-background hover:bg-muted/80 transition-colors"
          >
            Show courses that count
          </button>
        </div>
      )}

      {/* Tabs - sticky once scrolled */}
      <Tabs value={view} onValueChange={handleViewChange} className="w-full">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="players" className="mt-4">
          <PlayersLeaderboardView />
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          <CoursesLeaderboardView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Top100LeaderboardPanel;
