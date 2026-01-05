/**
 * JourneySummaryCard - Premium hero card for Course Journey stats
 * 
 * Replaces fragmented pills with a single, elegant overview of a golfer's journey.
 * Shows: Courses Played, Countries, Avg Rating, Next Milestone progress
 * 
 * Polished per design brief:
 * - Tighter spacing between progress bar and "X to go" label
 * - Subtle glow/emphasis when ≤3 courses from milestone
 */
import React from 'react';
import { MapPin, Globe, Star, Trophy, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/motion';
import { AnimatedProgressBar } from '@/components/ui/motion/AnimatedProgressBar';

interface JourneySummaryCardProps {
  coursesPlayed: number;
  countriesPlayed: number;
  avgRating: number | null;
  isOwnProfile: boolean;
  className?: string;
}

const MILESTONES = [
  { target: 10, name: '10 Club' },
  { target: 25, name: '25 Club' },
  { target: 50, name: '50 Club' },
  { target: 100, name: '100 Club' },
  { target: 150, name: '150 Club' },
  { target: 200, name: '200 Club' },
  { target: 250, name: '250 Club' },
  { target: 300, name: '300 Club' },
  { target: 400, name: '400 Club' },
  { target: 500, name: '500 Club' },
];

export const JourneySummaryCard: React.FC<JourneySummaryCardProps> = ({
  coursesPlayed,
  countriesPlayed,
  avgRating,
  isOwnProfile,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Calculate next milestone
  const nextMilestone = MILESTONES.find(m => m.target > coursesPlayed) || MILESTONES[MILESTONES.length - 1];
  const previousMilestone = MILESTONES.filter(m => m.target <= coursesPlayed).pop();
  const coursesToNextMilestone = Math.max(0, nextMilestone.target - coursesPlayed);
  
  // Calculate progress from previous milestone (or 0) to next milestone
  const progressBase = previousMilestone?.target || 0;
  const progressRange = nextMilestone.target - progressBase;
  const progressValue = coursesPlayed - progressBase;
  const progressPercent = Math.min((progressValue / progressRange) * 100, 100);

  // Close to milestone - within 3 courses
  const isCloseToMilestone = coursesToNextMilestone <= 3 && coursesToNextMilestone > 0;

  // Empty state
  if (coursesPlayed === 0) {
    return (
      <div className={cn(
        "relative overflow-hidden bg-gradient-to-br from-muted/30 via-background to-muted/20",
        "border border-border/40 rounded-xl p-6",
        className
      )}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {isOwnProfile ? 'Start your course journey' : 'No courses played yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isOwnProfile 
                ? 'Play and rate your first course to unlock your journey stats.'
                : 'This golfer hasn\'t logged any courses yet.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-5",
        "bg-gradient-to-br from-amber-50/80 via-background to-stone-50/50 dark:from-amber-950/20 dark:via-background dark:to-stone-950/20",
        "border border-border/40 shadow-sm",
        className
      )}
    >
      {/* Subtle texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          maskImage: 'linear-gradient(to right, black 40%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 80%)',
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          {isOwnProfile ? 'Your Course Journey' : 'Course Journey'}
        </h3>

        {/* Main stat - Courses Played with AnimatedNumber */}
        <div className="flex items-baseline gap-2 mb-5">
          <AnimatedNumber 
            value={coursesPlayed}
            className="text-4xl font-bold text-foreground tracking-tight"
          />
          <span className="text-base text-muted-foreground">
            Courses Played
          </span>
        </div>

        {/* Secondary stats row */}
        <div className="flex gap-6 mb-5">
          {/* Countries */}
          {countriesPlayed > 0 && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                <AnimatedNumber 
                  value={countriesPlayed} 
                  className="font-semibold"
                />
                <span className="text-muted-foreground ml-1">
                  {countriesPlayed === 1 ? 'country' : 'countries'}
                </span>
              </span>
            </div>
          )}

          {/* Average Rating */}
          {avgRating !== null && avgRating > 0 && (
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-foreground">
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground ml-1">avg rating</span>
              </span>
            </div>
          )}
        </div>

        {/* Milestone progress - tighter spacing */}
        <div className={cn(
          "backdrop-blur-sm rounded-lg p-3.5 border border-border/30",
          isCloseToMilestone 
            ? "bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/30" 
            : "bg-background/60"
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {isCloseToMilestone ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </motion.div>
              ) : (
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                Next milestone
              </span>
            </div>
            <span className={cn(
              "text-xs font-semibold",
              isCloseToMilestone ? "text-amber-600 dark:text-amber-400" : "text-amber-600 dark:text-amber-400"
            )}>
              {nextMilestone.name}
            </span>
          </div>

          {/* Progress bar */}
          <AnimatedProgressBar
            percentage={progressPercent}
            height="h-2"
            bgColor={isCloseToMilestone ? "bg-amber-200/50 dark:bg-amber-800/30" : "bg-muted/50"}
            fillColor={isCloseToMilestone 
              ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 animate-pulse" 
              : "bg-gradient-to-r from-amber-400 to-amber-500"
            }
            delay={0.1}
          />

          {/* Progress label - tighter spacing (mt-1 instead of mt-1.5) */}
          <div className="flex justify-end mt-1">
            <span className={cn(
              "text-xs",
              isCloseToMilestone 
                ? "text-amber-600 dark:text-amber-400 font-medium" 
                : "text-muted-foreground"
            )}>
              {coursesToNextMilestone} to go
              {isCloseToMilestone && " 🔥"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
