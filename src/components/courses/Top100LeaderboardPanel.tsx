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
      {/* Closest Goal Strip - modern status banner */}
      {showGoalsBanner && (
        <div className="w-full">
          {/* Goal Strip */}
          <div className="w-full bg-emerald-50/60 border-y border-emerald-100/80 px-4 py-2.5 flex items-center gap-3">
            {/* Left: Target icon */}
            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-3 w-3 text-emerald-600" />
            </div>
            
            {/* Middle: Label + main line */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/80">
                Closest goal
              </span>
              <p className="text-sm font-medium text-slate-800 leading-tight">
                {nextMilestone.remaining} course{nextMilestone.remaining === 1 ? '' : 's'} to {nextMilestone.tierName}
              </p>
            </div>
            
            {/* Right: Mini progress indicator */}
            <div className="flex-shrink-0 w-12 h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${Math.min(100, ((totalPlayed / (totalPlayed + nextMilestone.remaining)) * 100))}%` }}
              />
            </div>
          </div>
          
          {/* CTA underneath as ghost button */}
          <div className="flex justify-center pt-3 pb-1">
            <button
              type="button"
              onClick={handleShowCoursesClick}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 active:scale-[0.98] transition-all"
            >
              Show courses that count
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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
