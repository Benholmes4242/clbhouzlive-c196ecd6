import React, { useState } from 'react';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requiredCount: number;
  earnedAt?: Date;
  isUnlocked: boolean;
}

interface AchievementBadgeProps {
  badge: BadgeData;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
}

const getBadgeIcon = (tier: BadgeData['tier'], size: string) => {
  const iconProps = {
    className: `${
      size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'
    }`,
  };

  switch (tier) {
    case 'bronze':
      return <Medal {...iconProps} />;
    case 'silver':
      return <Award {...iconProps} />;
    case 'gold':
      return <Trophy {...iconProps} />;
    case 'platinum':
      return <Star {...iconProps} />;
    default:
      return <Medal {...iconProps} />;
  }
};

const getBadgeColors = (tier: BadgeData['tier'], isUnlocked: boolean) => {
  if (!isUnlocked) {
    return {
      bg: 'bg-muted/20',
      border: 'border-muted/30',
      icon: 'text-muted-foreground/50',
      glow: '',
    };
  }

  switch (tier) {
    case 'bronze':
      return {
        bg: 'bg-gradient-to-br from-amber-600/20 to-amber-800/20',
        border: 'border-amber-500/40',
        icon: 'text-amber-400',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      };
    case 'silver':
      return {
        bg: 'bg-gradient-to-br from-slate-400/20 to-slate-600/20',
        border: 'border-slate-400/40',
        icon: 'text-slate-300',
        glow: 'shadow-[0_0_20px_rgba(148,163,184,0.3)]',
      };
    case 'gold':
      return {
        bg: 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20',
        border: 'border-yellow-400/40',
        icon: 'text-yellow-300',
        glow: 'shadow-[0_0_20px_rgba(250,204,21,0.4)]',
      };
    case 'platinum':
      return {
        bg: 'bg-gradient-to-br from-purple-400/20 to-purple-600/20',
        border: 'border-purple-400/40',
        icon: 'text-purple-300',
        glow: 'shadow-[0_0_25px_rgba(168,85,247,0.4)]',
      };
    default:
      return {
        bg: 'bg-muted/20',
        border: 'border-muted/30',
        icon: 'text-muted-foreground',
        glow: '',
      };
  }
};

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  badge,
  size = 'md',
  showLabel = true,
  onClick,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const colors = getBadgeColors(badge.tier, badge.isUnlocked);
  
  const badgeSize = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (badge.isUnlocked) {
      setShowDetails(true);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          disabled={!badge.isUnlocked}
          className={`
            ${badgeSize[size]} 
            ${colors.bg} 
            ${colors.border} 
            ${colors.glow}
            border-2 rounded-full p-2
            transition-all duration-300 ease-in-out
            hover:scale-110 active:scale-95
            ${badge.isUnlocked ? 'cursor-pointer animate-subtle-bounce' : 'cursor-default'}
            ${badge.isUnlocked ? 'hover:bg-opacity-30' : ''}
          `}
        >
          <div className={colors.icon}>
            {getBadgeIcon(badge.tier, size)}
          </div>
        </Button>
        
        {showLabel && (
          <div className="text-center">
            <p className={`text-xs font-medium ${
              badge.isUnlocked ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {badge.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {badge.requiredCount} courses
            </p>
          </div>
        )}
      </div>

      {/* Badge Details Modal */}
      {badge.isUnlocked && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className={`
                  w-12 h-12 rounded-full p-2 flex items-center justify-center
                  ${colors.bg} ${colors.border} ${colors.glow} border-2
                `}>
                  <div className={colors.icon}>
                    {getBadgeIcon(badge.tier, 'md')}
                  </div>
                </div>
                {badge.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="text-sm">{badge.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  Achievement Requirement
                </h4>
                <p className="text-sm">
                  Complete {badge.requiredCount} courses from the Top 100 list
                </p>
              </div>
              
              {badge.earnedAt && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Earned On
                  </h4>
                  <p className="text-sm">
                    {badge.earnedAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Keep playing courses to unlock more achievements!
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AchievementBadge;