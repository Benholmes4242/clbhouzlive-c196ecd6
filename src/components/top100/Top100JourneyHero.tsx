import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Top100JourneyHeroProps {
  completedCourses: number;
  totalCourses?: number;
  listCount: number;
  className?: string;
}

/**
 * Calculate stage label based on completed courses
 */
function getStageLabel(completed: number): string {
  if (completed >= 100) return 'Grand Slam';
  if (completed >= 50) return '50 Club';
  if (completed >= 20) return '20 Club';
  if (completed >= 10) return 'Explorer';
  if (completed >= 5) return 'Rookie';
  return 'Getting Started';
}

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Circular progress ring with animated fill
 */
const ProgressRing: React.FC<ProgressRingProps> = ({
  completed,
  total,
  size = 80,
  strokeWidth = 8,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(animatedProgress / total, 1);
  const strokeDashoffset = circumference - progress * circumference;
  const percentage = Math.round(progress * 100);

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(completed);
    }, 100);
    return () => clearTimeout(timer);
  }, [completed]);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="outstandingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.9)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0.9)" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress arc - Outstanding gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#outstandingGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
};

/**
 * Top100JourneyHero - Premium hero module for Top 100 journey entry point
 */
export const Top100JourneyHero: React.FC<Top100JourneyHeroProps> = ({
  completedCourses,
  totalCourses = 100,
  listCount,
  className,
}) => {
  const navigate = useNavigate();
  const stageLabel = getStageLabel(completedCourses);
  const isComplete = completedCourses >= totalCourses;
  const isZeroProgress = completedCourses === 0;

  const handleClick = () => {
    navigate('/top100?tab=my-progress');
  };

  return (
    <motion.section
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'relative w-full p-4',
          'rounded-2xl',
          'bg-card/92 backdrop-blur-sm',
          'border border-border/50',
          'text-left',
          'cursor-pointer',
          'hover:bg-card/95',
          'active:scale-[0.99]',
          'transition-all duration-200'
        )}
        aria-label="View your Top 100 Journey"
      >
        {/* Progress Ring - Top Right */}
        <div className="absolute top-4 right-4">
          <ProgressRing
            completed={completedCourses}
            total={totalCourses}
            size={72}
            strokeWidth={7}
          />
        </div>

        {/* Text content */}
        <div className="pr-20">
          {/* Title */}
          <h2
            className="text-[22px] font-bold text-foreground mb-2"
            style={{ letterSpacing: '-0.3px' }}
          >
            Your Top 100 Journey
          </h2>

          {/* Progress Headline - Outstanding gradient on number */}
          <div className="flex items-baseline gap-2 mb-3">
            <span 
              className="text-3xl font-bold"
              style={{ 
                background: 'linear-gradient(to right, rgba(245, 158, 11, 0.9), rgba(251, 191, 36, 0.9))', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}
            >
              {completedCourses}
            </span>
            <span className="text-sm text-muted-foreground">
              courses completed
            </span>
          </div>

          {/* CTA Button */}
          <span
            className={cn(
              'inline-flex items-center gap-0.5',
              'px-4 py-2.5',
              'text-sm font-medium',
              'bg-muted text-foreground',
              'rounded-lg',
              'hover:bg-muted/80',
              'active:scale-[0.97]',
              'transition-all duration-150',
              'whitespace-nowrap'
            )}
          >
            {isZeroProgress ? 'Start your Top 100 Journey' : 'View your Top 100 Journey'}
            <ChevronRight size={14} />
          </span>
        </div>
      </button>
    </motion.section>
  );
};

export default Top100JourneyHero;
