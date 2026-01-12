/**
 * RankMedal - Medal-style rank display with delta overlay
 * #1-3: Gold/Silver/Bronze with glow, #4-10: earned, #11+: neutral
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RankMedalProps {
  rank: number;
  delta?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { container: 'w-7 h-7', text: 'text-xs', deltaSize: 'w-3.5 h-3.5' },
  md: { container: 'w-9 h-9', text: 'text-sm', deltaSize: 'w-4 h-4' },
  lg: { container: 'w-11 h-11', text: 'text-base', deltaSize: 'w-5 h-5' },
};

export const RankMedal: React.FC<RankMedalProps> = ({
  rank,
  delta,
  size = 'md',
  className,
}) => {
  const config = sizeConfig[size];
  const isTop3 = rank <= 3;
  const isTop10 = rank <= 10;

  // Medal colors
  const getMedalStyle = () => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
          shadow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
          text: 'text-white',
          ring: 'ring-2 ring-amber-300/50',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-slate-300 to-slate-500',
          shadow: 'shadow-[0_0_10px_rgba(148,163,184,0.3)]',
          text: 'text-white',
          ring: 'ring-2 ring-slate-300/40',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-br from-orange-400 to-orange-700',
          shadow: 'shadow-[0_0_10px_rgba(234,88,12,0.3)]',
          text: 'text-white',
          ring: 'ring-2 ring-orange-300/40',
        };
      default:
        return isTop10
          ? {
              bg: 'bg-slate-100 dark:bg-slate-800',
              shadow: '',
              text: 'text-foreground',
              ring: 'ring-1 ring-slate-200 dark:ring-slate-700',
            }
          : {
              bg: 'bg-slate-50 dark:bg-slate-900',
              shadow: '',
              text: 'text-muted-foreground',
              ring: 'ring-1 ring-border/50',
            };
    }
  };

  const style = getMedalStyle();

  return (
    <div className={cn('relative', className)}>
      {/* Medal circle */}
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold',
          config.container,
          config.text,
          style.bg,
          style.shadow,
          style.text,
          style.ring
        )}
      >
        {rank}
      </div>

      {/* Delta overlay */}
      {delta !== undefined && delta !== null && delta !== 0 && (
        <div
          className={cn(
            'absolute -top-1 -right-1 rounded-full flex items-center justify-center',
            config.deltaSize,
            delta > 0
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          )}
        >
          {delta > 0 ? (
            <TrendingUp className="w-2.5 h-2.5" />
          ) : (
            <TrendingDown className="w-2.5 h-2.5" />
          )}
        </div>
      )}
    </div>
  );
};

export default RankMedal;
