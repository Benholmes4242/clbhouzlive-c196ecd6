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
  
  // Calculate progress percentage
  const progressPercentage = Math.min((progress / threshold) * 100, 100);
  
  // Debug logging
  console.log('Achievement ID:', achievement.id, 'Is 20-club?', achievement.id === '20-club');

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300",
        isEarned
          ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200"
          : "bg-card border-border hover:border-border/80"
      )}
    >
      {/* Top Row: Icon, Content, and Progress Number */}
      <div className="flex gap-3">
        {/* Badge Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full text-lg transition-all duration-300",
            isEarned
              ? "bg-gradient-to-r from-orange-400 to-yellow-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {achievement.id === '20-club' ? (
            <MedalIcon size="sm" />
          ) : (
            <span>{emoji}</span>
          )}
        </div>

        {/* Badge Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
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
                    "text-xs mt-1",
                    isEarned ? "text-orange-700" : "text-muted-foreground"
                  )}
                >
                  {requirement}
                </p>
              </div>
            </div>
            {isEarned && achievement.id !== '20-club' && (
              <div className="flex items-center justify-center ml-2">
                <span className="text-xs font-medium text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                  ✓ Earned!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Number */}
        <div className="flex items-center">
          <div
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-semibold border",
              isEarned
                ? "bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-orange-300"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {Math.min(progress, threshold)}/{threshold}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className={cn(
            "font-medium",
            isEarned ? "text-orange-800" : "text-muted-foreground"
          )}>
            Progress: {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={cn(
              "h-2.5 rounded-full transition-all duration-500 ease-out",
              isEarned 
                ? "bg-gradient-to-r from-orange-400 to-yellow-400" 
                : "bg-gradient-to-r from-blue-400 to-blue-500"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Top100AchievementCard;