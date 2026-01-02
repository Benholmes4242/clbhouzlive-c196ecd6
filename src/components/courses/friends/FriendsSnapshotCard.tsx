import React, { useEffect, useState } from 'react';

interface FriendsSnapshotCardProps {
  timeframe: string;
  totalCourses: number;
  totalRegions: number;
  averageRating: number | null;
  totalRounds: number;
  userPlayedCount?: number; // How many of the friends' courses the user has also played
}

// Animated counter hook for premium count-up effect
const useAnimatedCount = (target: number, duration: number = 300) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      
      setCount(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [target, duration]);
  
  return count;
};

const FriendsSnapshotCard: React.FC<FriendsSnapshotCardProps> = ({
  timeframe,
  totalCourses,
  totalRegions,
  averageRating,
  totalRounds,
  userPlayedCount = 0,
}) => {
  const animatedCourses = useAnimatedCount(totalCourses);
  const animatedRegions = useAnimatedCount(totalRegions);
  const animatedRounds = useAnimatedCount(totalRounds);
  const animatedUserPlayed = useAnimatedCount(userPlayedCount);

  const getTimeLabel = () => {
    switch (timeframe) {
      case '7d': return 'the last 7 days';
      case '30d': return 'the last 30 days';
      case '90d': return 'the last 90 days';
      case '12m': return 'the last 12 months';
      case 'all': return 'all time';
      default: return timeframe;
    }
  };

  return (
    <section className="pt-2 pb-4">
      {/* Stats Grid - 2×2 with dividers and premium hierarchy */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.04] to-primary/[0.02] px-4 py-5">
        <div className="grid grid-cols-2 gap-y-4">
          {/* Row 1 */}
          <div className="text-center relative">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/75">
              Courses played
            </div>
            <div className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
              {animatedCourses}
            </div>
            {/* Vertical divider */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-slate-200/60" />
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/75">
              Regions
            </div>
            <div className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
              {animatedRegions}
            </div>
          </div>

          {/* Horizontal divider */}
          <div className="col-span-2 h-px bg-slate-200/60 my-1" />

          {/* Row 2 */}
          <div className="text-center relative">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/75">
              Avg rating
            </div>
            <div className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
              {averageRating ? averageRating.toFixed(1) : "—"}
            </div>
            {/* Vertical divider */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-slate-200/60" />
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/75">
              Rounds logged
            </div>
            <div className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
              {animatedRounds}
            </div>
          </div>
        </div>

        {/* Footer - Updated copy */}
        <p className="mt-4 text-center text-xs text-slate-500">
          From your friends in {getTimeLabel()}
        </p>
      </div>

      {/* You vs Friends - Strava-style nudge */}
      {totalCourses > 0 && (
        <div className="mt-3 text-center">
          <p className="text-sm text-slate-600">
            You've played <span className="font-bold text-foreground">{animatedUserPlayed}</span> of the <span className="font-bold text-foreground">{animatedCourses}</span> courses your friends played this month
          </p>
        </div>
      )}
    </section>
  );
};

export default FriendsSnapshotCard;
