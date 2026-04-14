// CharacterRing — SVG circle progress for caption character count
// Uses --primary for default, --warning token for warning, --destructive for over

import React from 'react';
import { POST_LIMITS } from '../constants';

interface CharacterRingProps {
  count: number;
  maxCount?: number;
  size?: number;
}

export function CharacterRing({ count, maxCount = POST_LIMITS.MAX_CAPTION_LENGTH, size = 32 }: CharacterRingProps) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(count / maxCount, 1.2);
  const offset = circumference - ratio * circumference;
  const isOver = count > maxCount;
  const isWarning = count > maxCount * 0.8 && !isOver;
  const remaining = maxCount - count;

  let strokeColor = 'hsl(var(--primary))';
  if (isWarning) strokeColor = 'hsl(var(--warning))';
  if (isOver) strokeColor = 'hsl(var(--destructive))';

  const showCount = count > maxCount * 0.85;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={`-rotate-90 ${isOver ? 'animate-pulse' : ''}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(15,23,42,0.12)" strokeWidth={2.5} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={strokeColor} strokeWidth={2.5}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-150"
        />
      </svg>
      {showCount && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[9px] font-bold ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>{remaining}</span>
        </div>
      )}
    </div>
  );
}
