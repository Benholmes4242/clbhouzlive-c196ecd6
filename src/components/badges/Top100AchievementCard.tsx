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
        "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
        isEarned
          ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 shadow-lg shadow-orange-100"
          : "bg-card border-border hover:border-border/80"
      )}
    >
      {/* Badge Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full text-2xl transition-all duration-300",
          isEarned
            ? "bg-gradient-to-r from-orange-400 to-yellow-400 shadow-lg shadow-orange-200"
            : "bg-muted text-muted-foreground"
        )}
      >
        {emoji}
      </div>

      {/* Badge Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-bold text-lg leading-tight",
            isEarned ? "text-orange-900" : "text-foreground"
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "text-sm mt-1",
            isEarned ? "text-orange-700" : "text-muted-foreground"
          )}
        >
          {requirement}
        </p>
        {isEarned && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs font-medium text-orange-800 bg-orange-100 px-2 py-1 rounded-full">
              ✓ Earned!
            </span>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center">
        <div
          className={cn(
            "px-3 py-2 rounded-full text-sm font-bold border",
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