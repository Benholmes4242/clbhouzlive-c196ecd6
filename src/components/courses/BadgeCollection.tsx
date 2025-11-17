import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AchievementBadge, { BadgeData } from './AchievementBadge';

interface BadgeCollectionProps {
  completedCount: number;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const BADGE_MILESTONES = [
  {
    id: 'bronze-explorer',
    name: 'Bronze Explorer',
    description: 'Completed your first 10 courses from the prestigious Top 100 list.',
    tier: 'bronze' as const,
    requiredCount: 10,
  },
  {
    id: 'silver-adventurer', 
    name: 'Silver Adventurer',
    description: 'Reached 25 courses - you\'re becoming a true golf connoisseur!',
    tier: 'silver' as const,
    requiredCount: 25,
  },
  {
    id: 'gold-champion',
    name: 'Gold Champion', 
    description: 'Incredible! 50 courses completed. You\'ve experienced some of the world\'s finest golf.',
    tier: 'gold' as const,
    requiredCount: 50,
  },
  {
    id: 'platinum-legend',
    name: 'Platinum Legend',
    description: 'Elite status achieved! 75+ courses puts you among the most dedicated golf enthusiasts.',
    tier: 'platinum' as const,
    requiredCount: 75,
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
  const badges: BadgeData[] = useMemo(() => {
    return BADGE_MILESTONES.map((milestone) => ({
      ...milestone,
      isUnlocked: completedCount >= milestone.requiredCount,
      earnedAt: completedCount >= milestone.requiredCount 
        ? new Date() // In real app, this would come from user data
        : undefined,
    }));
  }, [completedCount]);

  const unlockedBadges = badges.filter(badge => badge.isUnlocked);
  const nextBadge = badges.find(badge => !badge.isUnlocked);

  if (collapsible && !isExpanded) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-semibold text-foreground">
              Achievements
            </h4>
            <div className="text-sm text-muted-foreground">
              {unlockedBadges.length}/{badges.length} unlocked
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Compact view - show only unlocked badges */}
        <div className="flex items-center gap-2">
          {unlockedBadges.slice(0, 4).map((badge) => (
            <AchievementBadge
              key={badge.id}
              badge={badge}
              size="sm"
              showLabel={false}
            />
          ))}
          {unlockedBadges.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Complete 10 courses to earn your first badge!
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
          <h4 className="text-lg font-semibold text-foreground">
            Achievement Badges
          </h4>
          <div className="text-sm text-muted-foreground">
            {unlockedBadges.length}/{badges.length} unlocked
          </div>
        </div>
        
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress message */}
      {nextBadge && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
          <p className="text-sm text-foreground/80">
            <span className="font-medium">{nextBadge.requiredCount - completedCount} more courses</span> 
            {' '}to unlock <span className="font-medium text-foreground">{nextBadge.name}</span>
          </p>
        </div>
      )}
      
      {/* Badge Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((badge) => (
          <AchievementBadge
            key={badge.id}
            badge={badge}
            size="md"
            showLabel={true}
          />
        ))}
      </div>
      
      {/* All badges unlocked message */}
      {unlockedBadges.length === badges.length && completedCount >= 75 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-4 text-center">
          <h5 className="font-bold text-foreground mb-1">🏆 Legendary Status Achieved!</h5>
          <p className="text-sm text-foreground/80">
            You've unlocked all achievement badges. You're among the elite golf course explorers!
          </p>
        </div>
      )}
    </div>
  );
};

export default BadgeCollection;