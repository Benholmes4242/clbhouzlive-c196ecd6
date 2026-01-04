import React from 'react';
import { AnimatedProgressRing, AnimatedNumber } from '@/components/ui/motion';

interface Top100ProgressProps {
  completedCount: number;
  totalCount?: number;
  className?: string;
}

const Top100Progress: React.FC<Top100ProgressProps> = ({
  completedCount,
  totalCount = 100,
  className = ''
}) => {
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Progress Ring - now using AnimatedProgressRing */}
      <AnimatedProgressRing
        completed={completedCount}
        total={totalCount}
        size={140}
        strokeWidth={12}
        showGlow={true}
      />
      
      {/* Progress Text */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-white">
          Top 100 Progress
        </h3>
        <p className="text-white/70 text-sm">
          <AnimatedNumber value={completedCount} minCh={1} /> of {totalCount} courses completed
        </p>
        <div className="text-xs text-white/50">
          <AnimatedNumber value={percentage} minCh={1} delay={0.1} /> % complete
        </div>
      </div>
    </div>
  );
};

export default Top100Progress;