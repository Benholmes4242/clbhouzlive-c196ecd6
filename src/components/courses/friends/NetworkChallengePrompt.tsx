import React from 'react';
import { Flag, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface NetworkChallengePromptProps {
  userPlayedCount: number;
  totalCourses: number;
  onSeeCoursesClick?: () => void;
}

const NetworkChallengePrompt: React.FC<NetworkChallengePromptProps> = ({
  userPlayedCount,
  totalCourses,
  onSeeCoursesClick,
}) => {
  if (totalCourses === 0) return null;

  const remaining = totalCourses - userPlayedCount;
  const allPlayed = remaining <= 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      onClick={onSeeCoursesClick}
      className="w-full flex items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-all active:scale-[0.98]"
      style={{
        background: allPlayed ? 'rgba(82, 183, 136, 0.06)' : 'rgba(82, 183, 136, 0.06)',
        border: '1px solid rgba(82, 183, 136, 0.12)',
      }}
    >
      <Flag className="w-5 h-5 shrink-0" style={{ color: '#40916C' }} />
      <span className="flex-1 text-sm text-foreground">
        You've played{' '}
        <span
          className="font-bold"
          style={{ color: userPlayedCount === 0 ? '#E76F51' : '#40916C' }}
        >
          {userPlayedCount}
        </span>
        {' '}of{' '}
        <span className="font-bold text-foreground">{totalCourses}</span>
        {' '}courses your friends explored
      </span>
      <span className="flex items-center gap-0.5 text-sm font-semibold shrink-0" style={{ color: '#40916C' }}>
        See courses
        <ChevronRight className="w-4 h-4" />
      </span>
    </motion.button>
  );
};

export default NetworkChallengePrompt;
