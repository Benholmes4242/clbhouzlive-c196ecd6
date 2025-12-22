import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, ChevronRight } from 'lucide-react';
import { useUserTop100Intent } from '@/hooks/useUserTop100Intent';
import { motion } from 'framer-motion';

interface Top100JourneySummaryProps {
  className?: string;
  onStartJourney?: () => void;
  onContinueJourney?: () => void;
}

/**
 * Top100JourneySummary - Anchors Explore to a long-term goal
 * 
 * Cinematic copy spec:
 * - Title: "Your Top 100 Journey"
 * - Progress: "12 of 100 played"
 * - Micro-copy: "Every round is a step forward."
 * - CTA: "Continue your journey →"
 */
export const Top100JourneySummary: React.FC<Top100JourneySummaryProps> = ({
  className,
  onStartJourney,
  onContinueJourney,
}) => {
  const { data: intent, isLoading } = useUserTop100Intent();
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const totalPlayed = intent?.total_top100_played ?? 0;
  const hasProgress = totalPlayed > 0;
  const progressPercent = (totalPlayed / 100) * 100;

  // Animate progress ring only once on first load
  useEffect(() => {
    if (!isLoading && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasAnimated]);

  if (isLoading) {
    return (
      <div className={cn("px-5 py-6", className)}>
        <div className="bg-surface-alt/50 rounded-xl p-5 animate-pulse">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded mt-2" />
        </div>
      </div>
    );
  }

  // SVG circumference for progress ring
  const circumference = 2 * Math.PI * 16; // r=16
  const strokeDasharray = circumference;
  const strokeDashoffset = hasAnimated 
    ? circumference - (progressPercent / 100) * circumference 
    : circumference;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
      className={cn("px-5 py-6", className)}
    >
      <div className="bg-surface-alt/40 border border-border/40 rounded-xl p-5 hover:bg-surface-alt/60 transition-colors">
        {hasProgress ? (
          // User has progress
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Your Top 100 Journey</span>
                </div>
                <p className="mt-2 text-2xl font-serif text-foreground">
                  {totalPlayed} <span className="text-lg text-muted-foreground">of 100 played</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground font-light">
                  Every round is a step forward.
                </p>
              </div>
              
              {/* Progress ring with one-time animation */}
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-border"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="text-primary transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                  {totalPlayed}%
                </span>
              </div>
            </div>
            
            <button
              onClick={onContinueJourney}
              className="w-full flex items-center justify-between py-2.5 px-3 bg-background/60 rounded-lg text-sm text-foreground hover:bg-background transition-colors group"
            >
              <span>Continue your journey</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </div>
        ) : (
          // No progress yet
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Your Top 100 Journey</span>
            </div>
            
            <div>
              <h3 className="text-lg font-serif text-foreground">
                Begin your journey
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed font-light">
                Every round is a step forward. Track the courses you have played and discover ones waiting for you.
              </p>
            </div>
            
            <button
              onClick={onStartJourney}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors group"
            >
              <span>Start your journey</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Top100JourneySummary;
