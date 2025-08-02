import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Top100AchievementCard from '../badges/Top100AchievementCard';

interface BadgeCollectionProps {
  completedCount: number;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const BADGE_MILESTONES = [
  {
    id: '20-club',
    emoji: '🏌️',
    title: 'Green Fee Rookie',
    requirement: 'Play 20 Top 100 courses',
    threshold: 20,
  },
  {
    id: '50-club',
    emoji: '⛳',
    title: 'The Turn',
    requirement: 'Play 50 Top 100 courses',
    threshold: 50,
  },
  {
    id: '100-club',
    emoji: '🏆',
    title: 'Century Club',
    requirement: 'Play 100 Top 100 courses',
    threshold: 100,
  },
];

const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  completedCount,
  className = '',
  collapsible = true,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate badge statuses based on completed count
  const badges = useMemo(() => {
    return BADGE_MILESTONES.map((milestone) => ({
      ...milestone,
      isEarned: completedCount >= milestone.threshold,
      progress: completedCount,
      isSpecial: milestone.id === '20-club',
    }));
  }, [completedCount]);

  const unlockedBadges = badges.filter(badge => badge.isEarned);
  const nextBadge = badges.find(badge => !badge.isEarned);

  if (collapsible && !isExpanded) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-semibold text-white">
              Achievements
            </h4>
            <div className="text-sm text-white/70">
              {unlockedBadges.length}/{badges.length} unlocked
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-white/70 hover:text-white"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Compact view - show only unlocked badges */}
        <div className="flex items-center gap-2">
          {unlockedBadges.slice(0, 3).map((badge) => (
            <div key={badge.id} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center text-white text-sm font-semibold">
                {badge.emoji}
              </div>
              <span className="text-sm text-white font-medium">{badge.title}</span>
            </div>
          ))}
          {unlockedBadges.length === 0 && (
            <p className="text-sm text-white/50 italic">
              Complete 20 courses to earn your first badge!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-white">
            Achievement Badges
          </h4>
          <div className="text-sm text-white/70">
            {unlockedBadges.length}/{badges.length} unlocked
          </div>
        </div>
        
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-white/70 hover:text-white"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress message */}
      {nextBadge && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
          <p className="text-sm text-white/80">
            <span className="font-medium">{nextBadge.threshold - completedCount} more courses</span> 
            {' '}to unlock <span className="font-medium text-white">{nextBadge.title}</span>
          </p>
        </div>
      )}
      
      {/* Badge Grid */}
      <div className="space-y-3">
        {badges.map((badge) => (
          <Top100AchievementCard
            key={badge.id}
            achievement={badge}
          />
        ))}
      </div>
      
      {/* All badges unlocked message */}
      {unlockedBadges.length === badges.length && completedCount >= 75 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-4 text-center">
          <h5 className="font-bold text-white mb-1">🏆 Legendary Status Achieved!</h5>
          <p className="text-sm text-white/80">
            You've unlocked all achievement badges. You're among the elite golf course explorers!
          </p>
        </div>
      )}
    </div>
  );
};

export default BadgeCollection;