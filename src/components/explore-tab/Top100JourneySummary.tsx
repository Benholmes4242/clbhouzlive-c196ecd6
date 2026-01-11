import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, ArrowRight } from 'lucide-react';
import { useUserTop100Intent } from '@/hooks/useUserTop100Intent';
import { motion } from 'framer-motion';

interface Top100JourneySummaryProps {
  className?: string;
  onStartJourney?: () => void;
  onContinueJourney?: () => void;
}

/**
 * Top100JourneySummary - Polished journey card with progress visualization
 * 
 * Features:
 * - Gradient icon with shadow
 * - Progress bar (when user has progress)
 * - Decorative background pattern
 * - Engaging copy
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
  const progressPercent = Math.min((totalPlayed / 100) * 100, 100);

  // Animate progress only once on first load
  useEffect(() => {
    if (!isLoading && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasAnimated]);

  if (isLoading) {
    return (
      <div className={cn("mx-4 mt-6", className)}>
        <div className="h-[180px] rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
      className={cn("mx-4 mt-6", className)}
    >
      <div className="relative p-5 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 dark:from-orange-950/30" />
        
        {/* Content */}
        <div className="relative">
          {/* Header row with icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Your Top 100 Journey
              </p>
              <h3 className="text-lg font-bold text-foreground">
                {hasProgress ? `${totalPlayed} of 100 played` : 'Begin your journey'}
              </h3>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {hasProgress 
              ? 'Every round is a step forward. Keep tracking your journey.'
              : 'Every round is a step forward. Track the courses you have played and discover ones waiting for you.'
            }
          </p>
          
          {/* Progress bar (if user has progress) */}
          {hasProgress && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progress</span>
                <span className="font-semibold text-foreground">{totalPlayed}/100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: hasAnimated ? `${progressPercent}%` : '0%' }}
                />
              </div>
            </div>
          )}
          
          {/* CTA */}
          <button
            onClick={hasProgress ? onContinueJourney : onStartJourney}
            className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold text-sm transition-colors group"
          >
            <span>{hasProgress ? 'Continue your journey' : 'Start your journey'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Top100JourneySummary;
