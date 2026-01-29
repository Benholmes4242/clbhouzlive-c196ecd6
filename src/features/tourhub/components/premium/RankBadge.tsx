import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTrophy?: boolean;
}

/**
 * Premium rank badge with gold/silver/bronze styling
 */
export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  size = 'md',
  className,
  showTrophy = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-xl',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 16,
  };

  const isTopThree = rank <= 3;

  const getBadgeStyles = () => {
    if (rank === 1) {
      return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30';
    }
    if (rank === 2) {
      return 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-800 shadow-lg shadow-slate-400/30';
    }
    if (rank === 3) {
      return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30';
    }
    return 'bg-white/10 backdrop-blur-sm border border-white/20 text-white/90';
  };

  const getRoundedClass = () => {
    if (size === 'lg') return 'rounded-2xl';
    if (size === 'md') return 'rounded-xl';
    return 'rounded-lg';
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center font-bold',
        sizeClasses[size],
        getRoundedClass(),
        getBadgeStyles(),
        className
      )}
    >
      {showTrophy && isTopThree ? (
        <Trophy size={iconSizes[size]} className="fill-current" />
      ) : (
        rank
      )}
    </div>
  );
};
