import React from 'react';

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
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-100"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-700 ease-in-out ${
            showAnimation ? 'animate-in' : ''
          }`}
          style={{
            filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.4)) drop-shadow(0 0 16px rgba(34, 197, 94, 0.2))'
          }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-sm font-bold text-foreground">
          {completed}/{total}
        </div>
        <div className="text-xs text-muted-foreground">
          {bottomText}
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;