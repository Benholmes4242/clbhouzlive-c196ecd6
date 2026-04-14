import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Top100JourneyHeroProps {
  completedCourses: number;
  totalCoursesInStartedLists: number;
  listCount: number;
  className?: string;
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
        {/* Gradient definition — amber-500/amber-400, consistent with accent-amber */}
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
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F7931E"
          strokeOpacity={0.9}
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
  totalCoursesInStartedLists,
  listCount,
  className,
}) => {
  const navigate = useNavigate();
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
          'text-left',
          'cursor-pointer',
          'active:scale-[0.99]',
          'transition-transform duration-200'
        )}
        style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
        aria-label="View your Top 100 Journey"
      >
        {/* Progress Ring - Top Right */}
        <div className="absolute top-4 right-4">
          <ProgressRing
            completed={completedCourses}
            total={totalCoursesInStartedLists || 1}
            size={72}
            strokeWidth={7}
          />
        </div>

        {/* Text content */}
        <div className="pr-20">
          {/* Eyebrow + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Progress</span>
          </div>
          <h2
            style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 8px' }}
          >
            Your Top 100 Journey
          </h2>

          {/* Progress Headline — accent-amber number */}
          <div className="flex items-baseline gap-2 mb-3">
            <span 
              style={{ fontSize: 28, fontWeight: 900, color: '#F7931E', lineHeight: 1 }}
            >
              {completedCourses}
            </span>
            <span className="text-sm text-muted-foreground">
              {completedCourses === 1 ? 'course' : 'courses'} in {listCount} {listCount === 1 ? 'list' : 'lists'}
            </span>
          </div>

          {/* CTA Button */}
          <span
            className={cn(
              'inline-flex items-center gap-0.5',
              'px-4 py-2.5',
              'text-sm font-medium',
              'rounded-lg',
              'active:scale-[0.97]',
              'transition-transform duration-150',
              'whitespace-nowrap'
            )}
            style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', color: '#0F172A' }}
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
