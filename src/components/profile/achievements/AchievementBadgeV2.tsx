import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Flag, Target, Award, Star, Mountain, Crown, Zap } from 'lucide-react';

export interface AchievementV2 {
  id: string;
  name: string;
  description: string;
  category: 'skill' | 'exploration';
  iconKey: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface AchievementBadgeV2Props {
  achievement: AchievementV2;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  flag: Flag,
  target: Target,
  award: Award,
  star: Star,
  mountain: Mountain,
  crown: Crown,
  zap: Zap,
};

/**
 * AchievementBadgeV2 - Profile 2.0 Achievement Badge
 * Apple Fitness-style flat design
 * Locked badges: greyed out
 */
const AchievementBadgeV2: React.FC<AchievementBadgeV2Props> = ({
  achievement,
  onClick,
  size = 'md'
}) => {
  const Icon = ICON_MAP[achievement.iconKey] || Trophy;
  
  const sizeClasses = {
    sm: 'w-20 h-24',
    md: 'w-24 h-28',
    lg: 'w-28 h-32'
  };
  
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-3",
        "rounded-sq-md transition-all duration-200",
        "active:scale-95",
        sizeClasses[size],
        achievement.isUnlocked
          ? "bg-primary/10 border border-primary/20"
          : "bg-muted/50 border border-border/30 opacity-50"
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-full p-2",
        achievement.isUnlocked
          ? "bg-primary/20 text-primary"
          : "bg-muted text-muted-foreground"
      )}>
        <Icon className={iconSizes[size]} />
      </div>
      
      <span className={cn(
        "text-xs font-medium text-center line-clamp-2 leading-tight",
        achievement.isUnlocked ? "text-foreground" : "text-muted-foreground"
      )}>
        {achievement.name}
      </span>
      
      {/* Progress indicator for locked achievements */}
      {!achievement.isUnlocked && achievement.progress !== undefined && achievement.maxProgress && (
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary/50 rounded-full transition-all"
            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
          />
        </div>
      )}
    </button>
  );
};

export default AchievementBadgeV2;
