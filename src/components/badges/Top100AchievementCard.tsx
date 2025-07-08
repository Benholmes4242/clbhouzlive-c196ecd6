import React from 'react';
import { cn } from '@/lib/utils';

interface Top100Achievement {
  id: string;
  emoji: string;
  title: string;
  requirement: string;
  threshold: number;
  isEarned: boolean;
  progress: number;
  isSpecial?: boolean;
}

interface Top100AchievementCardProps {
  achievement: Top100Achievement;
}

const Top100AchievementCard: React.FC<Top100AchievementCardProps> = ({ achievement }) => {
  const { emoji, title, requirement, threshold, isEarned, progress, isSpecial } = achievement;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
        isEarned
          ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 shadow-md shadow-orange-100"
          : "bg-card border-border hover:border-border/80"
      )}
    >
      {/* Badge Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-lg transition-all duration-300",
          isEarned
            ? "bg-gradient-to-r from-orange-400 to-yellow-400 shadow-md shadow-orange-200"
            : "bg-muted text-muted-foreground"
        )}
      >
        {emoji}
      </div>

      {/* Badge Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-semibold text-base leading-tight",
            isEarned ? "text-orange-900" : "text-foreground"
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "text-xs",
            isEarned ? "text-orange-700" : "text-muted-foreground"
          )}
        >
          {requirement}
        </p>
        {isEarned && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs font-medium text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
              ✓ Earned!
            </span>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center">
        <div
          className={cn(
            "px-2.5 py-1.5 rounded-full text-xs font-semibold border",
            isEarned
              ? "bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-orange-300"
              : "bg-muted text-muted-foreground border-border"
          )}
        >
          {Math.min(progress, threshold)}/{threshold}
        </div>
      </div>
    </div>
  );
};

export default Top100AchievementCard;