import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyTop100Progress } from '@/hooks/useMyTop100Progress';
import { useUserTop100Progress } from '@/hooks/useUserTop100Progress';
import { Card } from '@/components/ui/card';
import { Top100FriendsStrip } from './Top100FriendsStrip';

const Top100ClubCallout: React.FC = () => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const { data: progress } = useMyTop100Progress();
  const { data: listProgress } = useUserTop100Progress(session?.user?.id);

  const handleClick = () => {
    if (session) {
      navigate('/top100?tab=my-progress');
    } else {
      navigate('/auth?redirect=/top100?tab=my-progress');
    }
  };

  // Filter to only lists where user has played at least one course
  const startedLists = (listProgress || []).filter(list => list.played > 0);
  
  const coursesPlayed = startedLists.reduce((sum, list) => sum + list.played, 0);
  const totalCoursesInStartedLists = startedLists.reduce((sum, list) => sum + list.total, 0);
  const listsStarted = startedLists.length;
  
  // Calculate progress percentage based on started lists only
  const progressPercent = totalCoursesInStartedLists > 0
    ? Math.min((coursesPlayed / totalCoursesInStartedLists) * 100, 100)
    : 0;

  return (
    <section 
      onClick={handleClick}
      className="px-4 pt-4 pb-6 cursor-pointer"
    >
      <div className="flex flex-col items-center text-center">
        {/* Title with inline trophy icon */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-accent/10 to-primary-accent/5">
            <Trophy className="h-4 w-4 text-primary-accent" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Top 100 Club
          </h3>
        </div>

        {/* Tagline */}
        <p className="text-xs text-muted-foreground mb-3">
          Track your pilgrimage through the world&apos;s Top 100 courses.
        </p>

        {/* Progress line */}
        {session ? (
          <>
            {listsStarted > 0 ? (
              <>
                <p className="mt-2 text-xs font-medium text-foreground mb-3">
                  You&apos;ve played {coursesPlayed} course{coursesPlayed === 1 ? '' : 's'} {listsStarted === 1 ? 'in' : 'across'} {listsStarted} Top 100 list{listsStarted === 1 ? '' : 's'}.
                </p>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted mb-3">
                  <div
                    className="h-full bg-primary-accent transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground mb-3">
                You haven&apos;t started your Top 100 journey yet. Play your first Top 100 course to begin.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground mb-3">
            Sign in to track your progress and see where you rank on the global leaderboard.
          </p>
        )}

        {/* CTA button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="mt-3 mb-3 inline-flex w-full items-center justify-center rounded-full border border-slate-500/70 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm active:scale-[0.99] transition hover:bg-slate-50"
        >
          {session ? 'Open your Top 100 Journey' : 'Sign in to join the Top 100 Club'}
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </button>

        {/* Friends on Top 100 Journey */}
        <Top100FriendsStrip />
      </div>
    </section>
  );
};

export default Top100ClubCallout;
