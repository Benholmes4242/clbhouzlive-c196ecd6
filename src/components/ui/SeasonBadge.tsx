import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonBadgeProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
  label?: string;
}

const getTierIcon = (tier: string, size: string) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  
  switch (tier) {
    case 'diamond':
    case 'platinum':
    case 'gold':
      return <Trophy className={sizeClass} />;
    case 'silver':
    case 'bronze':
      return <Medal className={sizeClass} />;
    default:
      return <Award className={sizeClass} />;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'diamond':
      return 'text-cyan-500';
    case 'platinum':
      return 'text-slate-400';
    case 'gold':
      return 'text-yellow-500';
    case 'silver':
      return 'text-gray-400';
    case 'bronze':
      return 'text-orange-600';
    default:
      return 'text-muted-foreground';
  }
};

export const SeasonBadge: React.FC<SeasonBadgeProps> = ({
  tier,
  size = 'md',
  className,
  showTooltip = false,
  label,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-background/50 p-1',
        getTierColor(tier),
        className
      )}
      title={showTooltip ? `${tier} tier${label ? ` - ${label}` : ''}` : undefined}
    >
      {getTierIcon(tier, size)}
    </div>
  );
};
