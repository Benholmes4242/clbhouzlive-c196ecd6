import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyTop100Progress } from '@/hooks/useMyTop100Progress';

const Top100ClubCallout: React.FC = () => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const { data: progress } = useMyTop100Progress();

  const handleClick = () => {
    if (session) {
      navigate('/top100?tab=my-progress');
    } else {
      navigate('/auth?redirect=/top100?tab=my-progress');
    }
  };

  const coursesCount = progress?.total_played_top100 ?? 0;
  const regionsCount = progress?.regions_count ?? 0;
  
  // Calculate progress percentage (out of 100)
  const progressPercent = Math.min((coursesCount / 100) * 100, 100);

  return (
    <section 
      onClick={handleClick}
      className="mt-3 rounded-3xl border border-border/25 bg-card shadow-sm hover:-translate-y-[1px] hover:shadow-md transition-all cursor-pointer"
    >
      <div className="px-5 py-5">
        {/* Top: icon */}
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-accent/15 to-primary-accent/5">
            <Trophy className="h-5 w-5 text-primary-accent" />
          </div>
        </div>

        {/* Title + description */}
        <div className="mt-3 text-center">
          <h2 className="text-base font-semibold text-foreground">
            Top 100 Club
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your pilgrimage through the world&apos;s Top 100 courses.
          </p>
        </div>

        {/* Stats line or sign-in prompt */}
        {session ? (
          <>
            <p className="mt-3 text-center text-sm font-medium text-foreground">
              You&apos;ve played {coursesCount} Top 100 course{coursesCount === 1 ? '' : 's'} across {regionsCount} region{regionsCount === 1 ? '' : 's'}.
            </p>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-primary-accent transition-[width] duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>100 courses</span>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Sign in to track your progress and see where you rank on the global leaderboard.
          </p>
        )}

        {/* CTA button */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-accent/50 active:scale-[0.98] transition-all duration-150"
          >
            {session ? 'Open your Top 100 Journey' : 'Sign in to join the Top 100 Club'}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Top100ClubCallout;
