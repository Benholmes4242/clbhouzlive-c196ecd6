import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { Button } from '@/components/ui/button';
import { Top100FriendsStrip } from './Top100FriendsStrip';
import { EliteGameCard, EliteCardTier } from '@/components/achievements/EliteGameCard';
import { getTop100Club } from '@/lib/top100Club';

/**
 * Top100ClubCallout - Part of Global Achievement & Milestone System
 * Uses unified EliteGameCard with colors from globalAchievementMilestoneSystem.ts
 */
const Top100ClubCallout: React.FC = () => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const { data: progress } = useTop100ProgressForUser(session?.user?.id);

  const handleClick = () => {
    if (session) {
      navigate('/top100?tab=my-progress');
    } else {
      navigate('/auth?redirect=/top100?tab=my-progress');
    }
  };

  // Filter to only lists where user has played at least one course
  const startedLists = (progress?.lists || []).filter(list => list.played > 0);
  
  const coursesPlayed = startedLists.reduce((sum, list) => sum + list.played, 0);
  const totalCoursesInStartedLists = startedLists.reduce((sum, list) => sum + list.total, 0);
  const listsStarted = startedLists.length;
  
  // Calculate progress percentage based on started lists only
  const progressPercent = totalCoursesInStartedLists > 0
    ? Math.min((coursesPlayed / totalCoursesInStartedLists) * 100, 100)
    : 0;

  // Achievement badge data
  const hasAchievement = coursesPlayed >= 5;
  const club = getTop100Club(coursesPlayed);
  const achievementTier = club.threshold?.toString() as EliteCardTier || '5';

  return (
    <section 
      onClick={handleClick}
      className="px-4 pt-5 pb-7 cursor-pointer"
    >
      <div className="flex flex-col items-center text-center">
        {/* Title with inline trophy icon */}
        <div className="flex items-center gap-0 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-accent/10">
            <Trophy className="h-5 w-5 text-primary-accent" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Top 100 Club
          </h2>
        </div>

        {/* Tagline */}
        <p className="mt-1 mb-3 max-w-[22rem] text-sm text-slate-600">
          Track your pilgrimage through the world&apos;s Top 100 courses.
        </p>

        {/* Progress line */}
        {session ? (
          <>
            {listsStarted > 0 ? (
              <>
                {/* Achievement Badge - using unified EliteGameCard */}
                {hasAchievement && (
                  <div className="mb-4 w-full max-w-xs">
                    <EliteGameCard
                      tier={achievementTier}
                      earned={true}
                      currentProgress={coursesPlayed}
                      title={club.tierName || 'Top 100 Club'}
                      compact
                    />
                  </div>
                )}

                {/* Progress text - only show if no badge yet */}
                {!hasAchievement && (
                  <p className="mb-2 text-sm font-medium text-slate-900">
                    You&apos;ve rated {coursesPlayed} course{coursesPlayed === 1 ? '' : 's'} {listsStarted === 1 ? 'in' : 'across'} {listsStarted} Top 100 list{listsStarted === 1 ? '' : 's'}.
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-1 mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-primary-accent transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-600 mb-3">
                You haven&apos;t started your Top 100 journey yet. Play your first Top 100 course to begin.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-600 mb-3">
            Sign in to track your progress and see where you rank on the global leaderboard.
          </p>
        )}

        {/* CTA button */}
        <Button
          variant="primary"
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="mt-1 mb-3"
        >
          {session ? 'Open your Top 100 Journey' : 'Sign in to join the Top 100 Club'}
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Friends on Top 100 Journey */}
        <Top100FriendsStrip />
      </div>
    </section>
  );
};

export default Top100ClubCallout;
