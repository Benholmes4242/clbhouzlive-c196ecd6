import React from 'react';
import { Trophy } from 'lucide-react';

interface LevelUpCardProps {
  levelName: string;
  totalXP: number;
  levelColor: string;
}

export const LevelUpCard: React.FC<LevelUpCardProps> = ({
  levelName,
  totalXP,
  levelColor,
}) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 mb-3">
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: `conic-gradient(${levelColor} 0deg, ${levelColor} 360deg)`,
            boxShadow: `0 0 15px ${levelColor}30`,
          }}
        >
          <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
            <Trophy className="w-6 h-6" style={{ color: levelColor }} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Level Up
          </div>
          <div className="text-lg font-bold" style={{ color: levelColor }}>
            {levelName}
          </div>
          <div className="text-sm text-muted-foreground">
            {totalXP.toLocaleString()} Total XP
          </div>
        </div>
      </div>
    </div>
  );
};
