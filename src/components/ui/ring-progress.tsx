import React from 'react';

interface RingProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  color: string;
  trackColor?: string;
  glowOpacity?: number;
  ariaLabel?: string;
  className?: string;
}

export const RingProgress = ({
  size = 64,
  strokeWidth = 6,
  progress,
  color,
  trackColor = '#E6E9EF',
  glowOpacity = 0.35,
  ariaLabel,
  className = ''
}: RingProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Start at 12 o'clock (quarter circumference offset)
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (circumference * Math.max(0, Math.min(1, progress)));
  
  const filterId = `glow-${Math.random().toString(36).substr(2, 9)}`;
  const blurStdDev = strokeWidth * 0.5; // Tight halo

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`transform -rotate-90 ${className}`}
      role="img"
      aria-label={ariaLabel || `Progress: ${Math.round(progress * 100)}%`}
    >
      <defs>
        {/* Glow filter */}
        <filter
          id={filterId}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          filterUnits="objectBoundingBox"
        >
          <feGaussianBlur stdDeviation={blurStdDev} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values={`
              0 0 0 0 ${parseInt(color.slice(1, 3), 16) / 255}
              0 0 0 0 ${parseInt(color.slice(3, 5), 16) / 255}
              0 0 0 0 ${parseInt(color.slice(5, 7), 16) / 255}
              0 0 0 ${glowOpacity} 0
            `}
          />
        </filter>
      </defs>
      
      {/* Track circle (background) */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      
      {/* Glow circle (halo) - only shows where progress exists */}
      {progress > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter={`url(#${filterId})`}
        />
      )}
      
      {/* Progress circle (crisp stroke on top) */}
      {progress > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      )}
    </svg>
  );
};