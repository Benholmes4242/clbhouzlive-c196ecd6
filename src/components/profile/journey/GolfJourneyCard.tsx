import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { COURSE_MILESTONES, getNextMilestone, getMilestoneName } from '@/config/milestones';

interface Top100Progress {
  listId: string;
  listName: string;
  played: number;
  total: number;
}

interface GolfJourneyCardProps {
  coursesPlayed: number;
  countries: string[];
  top100Progress: Top100Progress[];
  className?: string;
}

const GolfJourneyCard: React.FC<GolfJourneyCardProps> = ({
  coursesPlayed,
  countries,
  top100Progress,
  className
}) => {
  const [animatedCount, setAnimatedCount] = useState(0);
  const hasAnimatedCount = useRef(false);
  const hasAnimatedBars = useRef(false);
  const nextMilestone = getNextMilestone(coursesPlayed);
  const unlockedMilestones = COURSE_MILESTONES.filter(m => m <= coursesPlayed);

  // Count-up animation (once per mount, uses ref to survive re-renders)
  useEffect(() => {
    if (hasAnimatedCount.current || coursesPlayed === 0) {
      setAnimatedCount(coursesPlayed);
      return;
    }

    const duration = 450;
    const steps = 30;
    const increment = coursesPlayed / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= coursesPlayed) {
        setAnimatedCount(coursesPlayed);
        hasAnimatedCount.current = true;
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [coursesPlayed]);

  // Mark bars as animated after first render
  useEffect(() => {
    if (!hasAnimatedBars.current) {
      hasAnimatedBars.current = true;
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: 0.05 }}
      className={cn(
        'rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5',
        'shadow-sm',
        className
      )}
    >
      <h3 className="text-base font-semibold text-foreground mb-5">Your Golf Journey</h3>

      {/* 1. Courses Played - Primary KPI */}
      <div className="mb-6">
        <div className="text-4xl font-bold text-foreground tabular-nums">
          {animatedCount}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Courses played</p>
      </div>

      {/* 2. Countries */}
      {countries.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Countries</p>
          <div className="flex flex-wrap gap-2">
            {countries.map(country => (
              <motion.span
                key={country}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full',
                  'bg-muted/50 text-foreground/90',
                  'border border-border/30'
                )}
              >
                {country}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Top 100 Progress */}
      {top100Progress.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Top 100 Progress</p>
          <div className="space-y-3">
            {top100Progress.map(list => {
              const percentage = (list.played / list.total) * 100;
              return (
                <div key={list.listId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground/90">{list.listName}</span>
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {list.played} / {list.total}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={hasAnimatedBars.current ? false : { width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={hasAnimatedBars.current ? { duration: 0 } : { duration: 0.4, delay: 0.1 }}
                      className="h-full bg-primary/70 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Milestones */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Milestones</p>
        
        {/* Milestone badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {COURSE_MILESTONES.slice(0, 7).map(milestone => {
            const isUnlocked = unlockedMilestones.includes(milestone);
            return (
              <span
                key={milestone}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full transition-all',
                  isUnlocked
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10'
                    : 'bg-muted/30 text-muted-foreground/50 border border-border/20'
                )}
              >
                {milestone === 1 ? '1st' : milestone}
              </span>
            );
          })}
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-1.5">Next milestone</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {getMilestoneName(nextMilestone)}
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {coursesPlayed} / {nextMilestone}
              </span>
            </div>
            <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                initial={hasAnimatedBars.current ? false : { width: 0 }}
                animate={{ width: `${(coursesPlayed / nextMilestone) * 100}%` }}
                transition={hasAnimatedBars.current ? { duration: 0 } : { duration: 0.35, delay: 0.15 }}
                className="h-full bg-primary/60 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GolfJourneyCard;
