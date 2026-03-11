// CharacterRing — SVG circle progress for caption character count
// Amber 0-80%, orange 80-100%, destructive 100%+

import React from 'react';
import { POST_LIMITS } from '../constants';

interface CharacterRingProps {
  count: number;
  maxCount?: number;
  size?: number;
}

export function CharacterRing({
  count,
  maxCount = POST_LIMITS.MAX_CAPTION_LENGTH,
  size = 32,
}: CharacterRingProps) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(count / maxCount, 1.2); // cap visual at 120%
  const offset = circumference - ratio * circumference;
  const isOver = count > maxCount;
  const isWarning = count > maxCount * 0.8 && !isOver;
  const remaining = maxCount - count;

  let strokeColor = 'hsl(var(--primary))'; // amber
  if (isWarning) strokeColor = 'hsl(24, 95%, 53%)'; // orange
  if (isOver) strokeColor = 'hsl(var(--destructive))';

  // Only show count when near or over limit
  const showCount = count > maxCount * 0.85;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={2.5}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.5}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-150"
        />
      </svg>
      {showCount && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-[9px] font-bold ${
              isOver ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {remaining}
          </span>
        </div>
      )}
    </div>
  );
}
