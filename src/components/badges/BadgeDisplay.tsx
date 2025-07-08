import React from 'react';
import { Badge as BadgeType } from '@/types/badges';
import { cn } from '@/lib/utils';
import { Trophy, Target, Star, Users, Award, Check } from 'lucide-react';

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
  const getBadgeIcon = (badgeName: string) => {
    // Map badge names to appropriate icons
    if (badgeName.toLowerCase().includes('rookie') || badgeName.toLowerCase().includes('top')) {
      return Trophy;
    }
    if (badgeName.toLowerCase().includes('fairway') || badgeName.toLowerCase().includes('fifty')) {
      return Target;
    }
    if (badgeName.toLowerCase().includes('collector') || badgeName.toLowerCase().includes('course')) {
      return Award;
    }
    if (badgeName.toLowerCase().includes('hunter') || badgeName.toLowerCase().includes('300')) {
      return Users;
    }
    if (badgeName.toLowerCase().includes('explorer') || badgeName.toLowerCase().includes('elite')) {
      return Star;
    }
    return Trophy; // Default icon
  };

  const getBadgeGradient = (tier: BadgeType['tier'], category: string, isEarned: boolean) => {
    if (!isEarned) {
      return 'bg-gray-100 border-gray-200 text-gray-400';
    }

    // Vibrant gradients for earned badges based on category and tier
    if (category === 'top_100_courses') {
      switch (tier) {
        case 'bronze': return 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-lg shadow-orange-200';
        case 'silver': return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-200';
        case 'gold': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-200';
        case 'platinum': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200';
        case 'diamond': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200';
      }
    }

    // Different gradients for activity/engagement badges
    switch (tier) {
      case 'bronze': return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200';
      case 'silver': return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-200';
      case 'gold': return 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-200';
      case 'platinum': return 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-200';
      case 'diamond': return 'bg-gradient-to-r from-slate-600 to-gray-700 text-white shadow-lg shadow-slate-200';
    }

    return 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-lg shadow-orange-200';
  };

  return (
    <div className="relative group">
      {/* Main Badge Container - Updated to match Top100AchievementCard */}
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
          {badge.emoji}
        </div>

        {/* Badge Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3
                className={cn(
                  "font-semibold text-base leading-tight",
                  isEarned ? "text-orange-900" : "text-foreground"
                )}
              >
                {badge.display_name}
              </h3>
              <p
                className={cn(
                  "text-xs",
                  isEarned ? "text-orange-700" : "text-muted-foreground"
                )}
              >
                {badge.description}
              </p>
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
        {showProgress && (
          <div className="flex items-center">
            <div
              className={cn(
                "px-2.5 py-1.5 rounded-full text-xs font-semibold border",
                isEarned
                  ? "bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-orange-300"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              {Math.min(progress, badge.criteria_value)}/{badge.criteria_value}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 scale-95 group-hover:scale-100">
        <div className="bg-black/90 backdrop-blur-sm text-white text-xs rounded-xl px-4 py-3 whitespace-nowrap shadow-2xl border border-white/10">
          <div className="font-semibold text-white">{badge.display_name}</div>
          <div className="text-gray-300 mt-1">{badge.description}</div>
          {showProgress && (
            <div className="mt-2 pt-2 border-t border-white/20">
              {isEarned ? (
                <div className="text-green-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Badge Earned!
                </div>
              ) : (
                <div className="text-gray-400">
                  <div>Progress: {progress}/{badge.criteria_value}</div>
                  <div className="text-xs mt-1">
                    {badge.criteria_value - progress} more needed
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90 absolute top-full left-1/2 transform -translate-x-1/2" />
      </div>
    </div>
  );
};

export default BadgeDisplay;