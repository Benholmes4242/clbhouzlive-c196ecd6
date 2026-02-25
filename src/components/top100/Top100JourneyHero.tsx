import React from 'react';
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

export const Top100JourneyHero: React.FC<Top100JourneyHeroProps> = ({
  completedCourses,
  listCount,
  className,
}) => {
  const navigate = useNavigate();
  const isZeroProgress = completedCourses === 0;

  return (
    <motion.section
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <button
        type="button"
        onClick={() => navigate('/top100?tab=my-progress')}
        className={cn(
          'w-full p-4',
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
        <h2
          className="text-[22px] font-bold text-foreground mb-2"
          style={{ letterSpacing: '-0.3px' }}
        >
          Your Top 100 Journey
        </h2>

        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl font-bold"
            style={{
              background: 'linear-gradient(to right, rgba(245, 158, 11, 0.9), rgba(251, 191, 36, 0.9))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {completedCourses}
          </span>
          <span className="text-sm text-muted-foreground">
            courses completed
          </span>
        </div>

        {listCount > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Across {listCount} Top 100 {listCount === 1 ? 'list' : 'lists'}
          </p>
        )}

        <span
          className={cn(
            'inline-flex items-center gap-0.5 mt-3',
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
      </button>
    </motion.section>
  );
};

export default Top100JourneyHero;
