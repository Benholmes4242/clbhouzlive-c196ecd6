import React from 'react';

interface CircularProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showAnimation?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  completed,
  total,
  size = 120,
  strokeWidth = 8,
  className = '',
  showAnimation = true
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
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-20"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4ade80"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-700 ease-in-out ${
            showAnimation ? 'animate-in' : ''
          }`}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(74, 222, 128, 0.3))'
          }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-sm font-bold text-foreground">
          {completed}/{total}
        </div>
        <div className="text-xs text-muted-foreground">
          completed
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;