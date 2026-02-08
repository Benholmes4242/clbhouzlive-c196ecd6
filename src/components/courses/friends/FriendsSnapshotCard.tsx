import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

interface StatCellProps {
  label: string;
  value: string | number;
  hasRightDivider?: boolean;
  index: number;
}

const StatCell: React.FC<StatCellProps> = ({ label, value, hasRightDivider, index }) => (
  <motion.div 
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay: index * 0.05 }}
    className="text-center relative group cursor-default"
  >
    {/* Hover effect */}
    <div className="absolute inset-0 -m-2 rounded-lg bg-muted/0 group-hover:bg-muted/50 transition-colors duration-200" />
    <div className="relative">
      <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/75">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
    </div>
    {/* Vertical divider */}
    {hasRightDivider && (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border/60" />
    )}
  </motion.div>
);

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
      case 'all': return 'all time (recent activity)';
      default: return timeframe;
    }
  };

  const playedColor = userPlayedCount === 0 ? 'text-amber-500' : 'text-foreground';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden border border-border/60 shadow-sm"
    >
      {/* Stats Grid - 2×2 with dividers and premium hierarchy */}
      <div className="relative bg-gradient-to-br from-primary/[0.04] to-primary/[0.02] px-4 py-5">
        <div className="grid grid-cols-2 gap-y-4">
          {/* Row 1 */}
          <StatCell 
            label="Courses played" 
            value={animatedCourses} 
            hasRightDivider 
            index={0}
          />
          <StatCell 
            label="Regions" 
            value={animatedRegions} 
            index={1}
          />

          {/* Horizontal divider - centered */}
          <div className="col-span-2 flex justify-center my-1">
            <div className="h-px w-[calc(100%-2rem)] bg-border/60" />
          </div>

          {/* Row 2 */}
          <StatCell 
            label="Avg rating" 
            value={averageRating ? averageRating.toFixed(1) : "—"} 
            hasRightDivider 
            index={2}
          />
          <StatCell 
            label="Rounds logged" 
            value={animatedRounds} 
            index={3}
          />
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          From your friends in {getTimeLabel()}
        </p>

        {/* You vs Friends - inside as footer row with divider */}
        {totalCourses > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mt-4 pt-3 border-t border-border/60"
          >
            <p className="text-sm text-center text-muted-foreground">
              You've played <span className={cn("font-bold tabular-nums", playedColor)}>{animatedUserPlayed}</span> of the <span className="font-bold text-foreground tabular-nums">{animatedCourses}</span> courses your friends played
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FriendsSnapshotCard;
