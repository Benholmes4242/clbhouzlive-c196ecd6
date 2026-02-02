// src/features/tourhub/components/overview-v3/SeasonLeaderboards/SkillProgressBar.tsx

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SKILL_BAR_COLORS } from './constants';

interface SkillProgressBarProps {
  level: number;
  progress: number;
  variant?: 'large' | 'small' | 'list';
}

export const SkillProgressBar = memo(function SkillProgressBar({
  level,
  progress,
  variant = 'large',
}: SkillProgressBarProps) {
  const totalSegments = 10;

  const styles = {
    large: {
      container: 'h-2 gap-1',
      segment: 'h-full rounded-full',
    },
    small: {
      container: 'h-1.5 gap-0.5',
      segment: 'h-full rounded-full',
    },
    list: {
      container: 'h-2 gap-0.5',
      segment: 'h-full rounded-sm',
    },
  };

  const currentStyles = styles[variant];

  const getSegmentColor = (index: number, isFilled: boolean) => {
    if (!isFilled) {
      return variant === 'list' ? 'bg-gray-200' : 'bg-white/20';
    }
    return SKILL_BAR_COLORS[index] || 'bg-orange-500';
  };

  return (
    <div className={`flex w-full ${currentStyles.container}`}>
      {Array.from({ length: totalSegments }).map((_, index) => {
        const isFilled = index < level;

        return (
          <motion.div
            key={index}
            className={`flex-1 ${currentStyles.segment} ${getSegmentColor(index, isFilled)}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              delay: index * 0.03,
              duration: 0.2,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: 'left' }}
          />
        );
      })}
    </div>
  );
});
