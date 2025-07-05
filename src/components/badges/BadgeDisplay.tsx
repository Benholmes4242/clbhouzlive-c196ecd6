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

  const progressPercentage = Math.min((progress / badge.criteria_value) * 100, 100);
  const IconComponent = getBadgeIcon(badge.name);
  const circumference = 2 * Math.PI * 16; // radius of 16
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className={cn("relative group", className)}>
      {/* Main Badge Container */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-full border-2 transition-all duration-300 cursor-pointer min-w-[180px]",
          getBadgeGradient(badge.tier, badge.category, isEarned),
          !isEarned && "opacity-60",
          "hover:scale-105 hover:shadow-xl"
        )}
      >
        {/* Icon with Circular Progress Ring */}
        <div className="relative flex-shrink-0">
          {showProgress && !isEarned && (
            <svg className="absolute -inset-1 w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.2"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            </svg>
          )}
          <div className={cn(
            "w-6 h-6 flex items-center justify-center rounded-full",
            isEarned ? "bg-white/20" : "bg-gray-300"
          )}>
            <IconComponent className={cn(
              "w-4 h-4",
              isEarned ? "text-white" : "text-gray-500"
            )} />
          </div>
        </div>

        {/* Badge Text */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">
            {badge.display_name}
          </div>
          {isEarned && (
            <div className="flex items-center gap-1 text-xs opacity-90">
              <Check className="w-3 h-3" />
              Earned!
            </div>
          )}
        </div>

        {/* Progress Display */}
        {showProgress && (
          <div className="text-right text-xs font-medium">
            <div>{isEarned ? badge.criteria_value : progress}/{badge.criteria_value}</div>
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

      {/* Pulse Animation for Earned Badges */}
      {isEarned && (
        <div className="absolute inset-0 rounded-full animate-pulse bg-white/10 pointer-events-none" />
      )}
    </div>
  );
};

export default BadgeDisplay;