import React from 'react';
import { cn } from '@/lib/utils';

interface SeasonHeroHeaderProps {
  seasonName: string;
  seasonTagline: string;
  seasonIcon: string;
  daysRemaining: number;
  totalDays: number;
  seasonColor: string;
}

export const SeasonHeroHeader: React.FC<SeasonHeroHeaderProps> = ({
  seasonName,
  seasonTagline,
  seasonIcon,
  daysRemaining,
  totalDays,
  seasonColor,
}) => {
  const progressPercent = ((totalDays - daysRemaining) / totalDays) * 100;
  
  return (
    <div 
      className="relative overflow-hidden rounded-sq-lg p-6 mb-4"
      style={{
        background: `linear-gradient(135deg, ${seasonColor}15 0%, ${seasonColor}30 100%)`,
      }}
    >
      {/* Background pattern - subtle golf motif */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 text-8xl">{seasonIcon}</div>
      </div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Season Icon with glow */}
          <div 
            className="w-16 h-16 rounded-sq-lg flex items-center justify-center text-3xl shadow-lg"
            style={{ 
              backgroundColor: `${seasonColor}20`,
              boxShadow: `0 8px 32px ${seasonColor}30`,
            }}
          >
            {seasonIcon}
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-foreground">{seasonName}</h1>
            <p className="text-sm text-muted-foreground italic">{seasonTagline}</p>
          </div>
        </div>
        
        {/* Countdown Ring */}
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-muted/20"
            />
            {/* Progress ring */}
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke={seasonColor}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercent / 100)}`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold">{daysRemaining}</span>
            <span className="text-[10px] text-muted-foreground">days left</span>
          </div>
        </div>
      </div>
    </div>
  );
};
