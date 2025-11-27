import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyTop100Progress } from '@/hooks/useMyTop100Progress';
import { Card } from '@/components/ui/card';

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
    <section className="mb-4">
      <Card 
        onClick={handleClick}
        className="cursor-pointer border border-border/60 bg-card shadow-lg shadow-black/5 hover:-translate-y-[1px] hover:shadow-xl transition-all"
      >
        <div className="flex flex-col items-center px-5 py-3.5 text-center">
          {/* Title with inline trophy icon */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-accent/10 to-primary-accent/5">
              <Trophy className="h-3.5 w-3.5 text-primary-accent" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Top 100 Club
            </h3>
          </div>

          {/* Tagline */}
          <p className="text-xs text-muted-foreground">
            Track your pilgrimage through the world&apos;s Top 100 courses.
          </p>

          {/* Progress line */}
          {session ? (
            <>
              <p className="mt-2 text-xs font-medium text-foreground">
                You&apos;ve played {coursesCount} course{coursesCount === 1 ? '' : 's'} across {regionsCount} Top 100 list{regionsCount === 1 ? '' : 's'}.
              </p>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary-accent transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
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
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-slate-500/70 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm active:scale-[0.99] transition hover:bg-slate-50"
          >
            {session ? 'Open your Top 100 Journey' : 'Sign in to join the Top 100 Club'}
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </button>
        </div>
      </Card>
    </section>
  );
};

export default Top100ClubCallout;
