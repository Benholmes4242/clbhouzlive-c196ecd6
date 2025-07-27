import React from 'react';
import { cn } from '@/lib/utils';
import MedalIcon from '@/components/ui/medal-icon';

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
        "flex items-center gap-3 p-3 rounded-full border transition-all duration-300",
        isEarned
          ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200"
          : "bg-card border-border hover:border-border/80"
      )}
    >
      {/* Badge Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-lg transition-all duration-300 self-start mt-0.5",
            isEarned
              ? "bg-gradient-to-r from-orange-400 to-yellow-400"
              : "bg-muted text-muted-foreground"
          )}
        >
        {achievement.id === '20-club' ? (
          <MedalIcon size="sm" />
        ) : (
          emoji
        )}
      </div>

      {/* Badge Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <div>
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
            </div>
          </div>
          {isEarned && (
            <div className="flex items-center justify-center ml-2">
              <span className="text-xs font-medium text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                ✓ Earned!
              </span>
            </div>
          )}
        </div>
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