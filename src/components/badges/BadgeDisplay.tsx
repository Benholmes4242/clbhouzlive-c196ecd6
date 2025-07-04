import React from 'react';
import { Badge as BadgeType } from '@/types/badges';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BadgeDisplayProps {
  badge: BadgeType;
  isEarned?: boolean;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  isEarned = false,
  progress = 0,
  showProgress = false,
  size = 'md',
  className
}) => {
  const getTierColor = (tier: BadgeType['tier']) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-600 text-white border-amber-700';
      case 'silver': return 'bg-gray-400 text-white border-gray-500';
      case 'gold': return 'bg-yellow-500 text-white border-yellow-600';
      case 'platinum': return 'bg-purple-600 text-white border-purple-700';
      case 'diamond': return 'bg-blue-600 text-white border-blue-700';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  const progressPercentage = Math.min((progress / badge.criteria_value) * 100, 100);

  return (
    <div className={cn("relative group", className)}>
      <Badge
        variant="secondary"
        className={cn(
          "flex items-center gap-2 font-medium border-2 transition-all duration-200",
          getTierColor(badge.tier),
          sizeClasses[size],
          !isEarned && "opacity-50 grayscale",
          "hover:scale-105 cursor-pointer"
        )}
      >
        <span className="text-lg">{badge.emoji}</span>
        <span>{badge.display_name}</span>
      </Badge>

      {showProgress && (
        <div className="mt-2 w-full">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{progress}/{badge.criteria_value}</span>
            {!isEarned && <span>{Math.round(progressPercentage)}%</span>}
            {isEarned && <span className="text-green-600 font-medium">✓ Earned!</span>}
          </div>
          {!isEarned && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          <div className="font-medium">{badge.display_name}</div>
          <div className="text-gray-300">{badge.description}</div>
          {showProgress && !isEarned && (
            <div className="text-gray-400 mt-1">
              Progress: {progress}/{badge.criteria_value}
            </div>
          )}
        </div>
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black absolute top-full left-1/2 transform -translate-x-1/2" />
      </div>
    </div>
  );
};

export default BadgeDisplay;