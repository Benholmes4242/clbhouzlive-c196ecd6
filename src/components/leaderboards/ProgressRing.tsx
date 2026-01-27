import React from 'react';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  daysLeft: number;
  color?: string;
}

/**
 * ProgressRing - Circular progress indicator with days countdown in center
 * 
 * Features:
 * - SVG-based ring with animated progress
 * - Days remaining displayed in center
 * - Uses season theme color from database
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({ 
  progress, 
  size = 56, 
  strokeWidth = 4, 
  daysLeft,
  color = '#F59E0B'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Days remaining in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-700">{daysLeft}</span>
      </div>
    </div>
  );
};

export default ProgressRing;
