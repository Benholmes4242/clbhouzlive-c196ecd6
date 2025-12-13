import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface FriendsSnapshotCardProps {
  timeframe: string;
  totalCourses: number;
  totalRegions: number;
  averageRating: number | null;
  totalRounds: number;
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
}) => {
  const animatedCourses = useAnimatedCount(totalCourses);
  const animatedRegions = useAnimatedCount(totalRegions);
  const animatedRounds = useAnimatedCount(totalRounds);

  const getTimeLabel = () => {
    switch (timeframe) {
      case '7d': return '7 days';
      case '30d': return '30 days';
      case '90d': return '90 days';
      case '12m': return '12 months';
      case 'all': return 'all time';
      default: return timeframe;
    }
  };

  const getContextLabel = () => {
    if (timeframe === 'all') {
      return "Based on all-time friends' activity";
    }
    return `Based on friends' activity in the last ${getTimeLabel()}`;
  };

  return (
    <section className="pt-3 pb-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          <Users className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Friends Courses</h3>
          <p className="text-sm text-muted-foreground">See where your friends have been playing</p>
        </div>
      </div>

      {/* Stats Grid - 2×2 centered with soft background anchor */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.04] to-primary/[0.02] px-4 py-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/60">
              Courses played
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {animatedCourses}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/60">
              Regions
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {animatedRegions}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/60">
              Avg rating
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {averageRating ? averageRating.toFixed(1) : "—"}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/60">
              Rounds logged
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {animatedRounds}
            </div>
          </div>
        </div>

        {/* Context sub-caption */}
        <p className="mt-4 text-center text-[11px] text-muted-foreground/50">
          {getContextLabel()}
        </p>
      </div>
    </section>
  );
};

export default FriendsSnapshotCard;
