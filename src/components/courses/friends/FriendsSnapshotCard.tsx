import React, { useEffect, useState } from 'react';

interface FriendsSnapshotCardProps {
  timeframe: string;
  totalCourses: number;
  totalRegions: number;
  averageRating: number | null;
  totalRounds: number;
  userPlayedCount?: number;
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
    <div className="rounded-xl overflow-hidden">
      {/* Stats Grid - 2×2 with dividers and premium hierarchy */}
      <div className="relative bg-gradient-to-br from-primary/[0.04] to-primary/[0.02] px-4 py-5">
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

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-slate-500">
          From your friends in {getTimeLabel()}
        </p>

        {/* You vs Friends - inside as footer row with divider */}
        {totalCourses > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200/60">
            <p className="text-sm text-center text-slate-600">
              You've played <span className="font-bold text-foreground">{animatedUserPlayed}</span> of the <span className="font-bold text-foreground">{animatedCourses}</span> courses your friends played
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsSnapshotCard;
