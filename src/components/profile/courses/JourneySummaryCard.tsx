/**
 * JourneySummaryCard - Premium hero card for Course Journey stats
 * 
 * Shows: Courses Played (primary), Countries, Average Rating
 * No milestone logic - milestones only apply to Top 100 section
 */
import React from 'react';
import { MapPin, Globe, Star } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/motion';

interface JourneySummaryCardProps {
  coursesPlayed: number;
  countriesPlayed: number;
  avgRating: number | null;
  isOwnProfile: boolean;
  className?: string;
}

export const JourneySummaryCard: React.FC<JourneySummaryCardProps> = ({
  coursesPlayed,
  countriesPlayed,
  avgRating,
  isOwnProfile,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();

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
        "relative overflow-hidden rounded-xl p-6",
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

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Header */}
        <h3 className="text-sm font-medium text-muted-foreground mb-5">
          {isOwnProfile ? 'Your Course Journey' : 'Course Journey'}
        </h3>

        {/* Main stat - Courses Played with AnimatedNumber */}
        <div className="flex flex-col items-center mb-6">
          <AnimatedNumber 
            value={coursesPlayed}
            className="text-5xl font-bold text-foreground tracking-tight"
          />
          <span className="text-base text-muted-foreground mt-1">
            Courses Played
          </span>
        </div>

        {/* Secondary stats row - centred */}
        <div className="flex justify-center gap-8">
          {/* Countries */}
          {countriesPlayed > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center">
                <Globe className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-start">
                <AnimatedNumber 
                  value={countriesPlayed} 
                  className="text-lg font-semibold text-foreground leading-tight"
                />
                <span className="text-xs text-muted-foreground">
                  {countriesPlayed === 1 ? 'country' : 'countries'}
                </span>
              </div>
            </div>
          )}

          {/* Average Rating */}
          {avgRating !== null && avgRating > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100/60 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-lg font-semibold text-foreground leading-tight">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">avg rating</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
