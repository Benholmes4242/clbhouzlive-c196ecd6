/**
 * JourneySummaryCard - Premium hero card for Course Legacy stats
 * 
 * Shows: Courses Played (primary), Countries, Average Rating
 * Updated to Hub design system with consistent styling
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Globe, Star } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/motion';

interface JourneySummaryCardProps {
  coursesPlayed: number;
  countriesPlayed: number;
  avgRating: number | null;
  isOwnProfile: boolean;
  displayName?: string;
  className?: string;
}

export const JourneySummaryCard: React.FC<JourneySummaryCardProps> = ({
  coursesPlayed,
  countriesPlayed,
  avgRating,
  isOwnProfile,
  displayName,
  className,
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  // Empty state
  if (coursesPlayed === 0) {
    return (
      <div className={cn(
        "bg-card rounded-2xl border border-border p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
        className
      )}>
        <div className="flex flex-col items-center justify-center text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6 text-muted-foreground" />
          </div>
          
          {/* Title */}
          <h3 className="text-base font-semibold text-foreground mb-1">
            {isOwnProfile ? "Start Building Your Legacy" : "No Courses Played Yet"}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            {isOwnProfile 
              ? "Play and rate courses to track your golf journey"
              : "This golfer hasn't logged any courses yet."}
          </p>
          
          {/* CTA */}
          {isOwnProfile && (
            <button
              onClick={() => navigate('/courses')}
              className="px-5 py-2 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-colors min-h-[44px] active:scale-[0.98]"
            >
              Find Courses
            </button>
          )}
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
        "p-6",
        className
      )}>

      {/* Header */}
      <div className="text-center mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: '#AEAEB2' }}>
          {isOwnProfile ? "Your Course Legacy" : `${displayName || "Their"}'s Course Legacy`}
        </p>
      </div>
      
      {/* Main stat */}
      <div className="text-center mb-6">
        <AnimatedNumber 
          value={coursesPlayed}
          className="text-5xl font-bold text-foreground tracking-tight"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Courses Played
        </p>
      </div>
      
      {/* Secondary stats row */}
      <div className="flex justify-center gap-8">
        {/* Countries */}
        {countriesPlayed > 0 && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center">
              <Globe className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <AnimatedNumber 
                value={countriesPlayed} 
                className="text-lg font-semibold text-foreground leading-tight"
              />
              <p className="text-xs text-muted-foreground">
                {countriesPlayed === 1 ? 'country' : 'countries'}
              </p>
            </div>
          </div>
        )}

        {/* Average Rating */}
        {avgRating !== null && avgRating > 0 && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/60 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground leading-tight">
                {avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};