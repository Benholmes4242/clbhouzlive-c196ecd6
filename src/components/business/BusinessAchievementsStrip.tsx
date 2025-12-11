import React from 'react';
import { Users, Star, MessageSquare, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessAchievementsStripProps {
  followersCount: number;
  postsCount: number;
  className?: string;
}

// Business achievement definitions
const BUSINESS_ACHIEVEMENTS = [
  { id: 'followers_100', label: '100 Followers', threshold: 100, icon: Users, color: 'bg-blue-500/10 text-blue-600' },
  { id: 'followers_500', label: '500 Followers', threshold: 500, icon: Users, color: 'bg-blue-500/10 text-blue-600' },
  { id: 'followers_1000', label: '1K Followers', threshold: 1000, icon: Users, color: 'bg-indigo-500/10 text-indigo-600' },
  { id: 'followers_5000', label: '5K Followers', threshold: 5000, icon: TrendingUp, color: 'bg-purple-500/10 text-purple-600' },
  { id: 'first_post', label: 'First Post', threshold: 1, icon: MessageSquare, color: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'posts_10', label: '10 Posts', threshold: 10, icon: MessageSquare, color: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'posts_50', label: '50 Posts', threshold: 50, icon: MessageSquare, color: 'bg-teal-500/10 text-teal-600' },
];

export function BusinessAchievementsStrip({ 
  followersCount, 
  postsCount,
  className 
}: BusinessAchievementsStripProps) {
  // Determine which achievements are unlocked
  const unlockedAchievements = BUSINESS_ACHIEVEMENTS.filter(achievement => {
    if (achievement.id.startsWith('followers_')) {
      return followersCount >= achievement.threshold;
    }
    if (achievement.id === 'first_post') {
      return postsCount >= 1;
    }
    if (achievement.id.startsWith('posts_')) {
      return postsCount >= achievement.threshold;
    }
    return false;
  });

  // If no achievements, don't render
  if (unlockedAchievements.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 px-4 overflow-x-auto scrollbar-hide py-1">
        {unlockedAchievements.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <div
              key={achievement.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
                achievement.color
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {achievement.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
