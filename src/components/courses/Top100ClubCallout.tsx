import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyTop100Progress } from '@/hooks/useMyTop100Progress';
import { Button } from '@/components/ui/button';

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

  return (
    <section className="mb-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm sm:px-5 sm:py-4">
        {/* Title + icon */}
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-accent/10">
            <Trophy className="h-5 w-5 text-primary-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Top 100 Club
            </h3>
            <p className="text-xs text-muted-foreground">
              Elite pilgrimage mode for the whales and hardcore nuts chasing the
              world&apos;s Top 100.
            </p>
          </div>
        </div>

        {/* Copy differs for signed-in vs logged-out */}
        {session ? (
          <p className="text-xs text-muted-foreground">
            You&apos;ve played{' '}
            <span className="font-semibold text-foreground">
              {coursesCount}
            </span>{' '}
            Top 100 course{coursesCount === 1 ? '' : 's'}
            {coursesCount > 0 && (
              <>
                {' '}
                across{' '}
                <span className="font-semibold text-foreground">
                  {regionsCount}
                </span>{' '}
                region{regionsCount === 1 ? '' : 's'}.
              </>
            )}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Track which Top 100 courses you&apos;ve conquered and see where you
            rank on the global leaderboard.
          </p>
        )}

        {/* CTA */}
        <div>
          <Button 
            size="sm" 
            className="w-full bg-[color:var(--surface-slate)] hover:bg-[color:var(--surface-slate)]/90 text-white" 
            onClick={handleClick}
          >
            {session
              ? 'Open your Top 100 Journey'
              : 'Sign in to join the Top 100 Club'}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Top100ClubCallout;
