/**
 * CircularProgress - Uses AnimatedProgressRing for premium motion
 */
import React from 'react';
import { AnimatedProgressRing } from './motion';

interface CircularProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showAnimation?: boolean;
  bottomText?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  completed,
  total,
  size = 120,
  strokeWidth = 8,
  className = '',
  showAnimation = true,
  bottomText = 'completed'
}) => {
  return (
    <AnimatedProgressRing
      completed={completed}
      total={total}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      bottomText={bottomText}
      showGlow={showAnimation}
    />
  );
};

export default CircularProgress;