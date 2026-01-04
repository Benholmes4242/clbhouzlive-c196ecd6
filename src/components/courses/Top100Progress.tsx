import React, { useEffect, useState } from 'react';
import CircularProgress from '@/components/ui/circular-progress';

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
  const [animateCount, setAnimateCount] = useState(0);
  const [showGlow, setShowGlow] = useState(false);

  // Animate the number counting up
  useEffect(() => {
    let startTime: number;
    const duration = 1000; // 1 second animation
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * completedCount);
      
      setAnimateCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimateCount(completedCount);
        // Show glow effect briefly when animation completes
        if (completedCount > 0) {
          setShowGlow(true);
          setTimeout(() => setShowGlow(false), 600);
        }
      }
    };
    
    if (completedCount > 0) {
      requestAnimationFrame(animate);
    } else {
      setAnimateCount(0);
    }
  }, [completedCount]);

  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Progress Ring */}
      <div className={`relative transition-all duration-300 ${showGlow ? 'scale-105' : ''}`}>
        <CircularProgress
          completed={animateCount}
          total={totalCount}
          size={140}
          strokeWidth={12}
          showAnimation={true}
          className={showGlow ? 'animate-pulse' : ''}
        />
        
        {/* Subtle glow effect */}
        {showGlow && (
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-ping" />
        )}
      </div>
      
      {/* Progress Text */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-white">
          Top 100 Progress
        </h3>
        <p className="text-white/70 text-sm">
          {completedCount} of {totalCount} courses completed
        </p>
        <div className="text-xs text-white/50">
          {percentage.toFixed(1)}% complete
        </div>
      </div>
    </div>
  );
};

export default Top100Progress;