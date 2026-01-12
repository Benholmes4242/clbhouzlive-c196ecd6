/**
 * MomentumChip - Compact momentum indicator
 * Shows rank/position changes: ▲ +2, ▼ -3, • 0
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type MomentumVariant = 'positive' | 'negative' | 'neutral';

interface MomentumChipProps {
  value: number;
  showValue?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const MomentumChip: React.FC<MomentumChipProps> = ({
  value,
  showValue = true,
  size = 'sm',
  className,
}) => {
  const variant: MomentumVariant = 
    value > 0 ? 'positive' : 
    value < 0 ? 'negative' : 
    'neutral';

  const config = {
    positive: {
      icon: TrendingUp,
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      prefix: '+',
    },
    negative: {
      icon: TrendingDown,
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-600 dark:text-rose-400',
      prefix: '',
    },
    neutral: {
      icon: Minus,
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-muted-foreground',
      prefix: '',
    },
  }[variant];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-sq-pill font-semibold',
        config.bg,
        config.text,
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        className
      )}
    >
      <Icon className={cn(size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      {showValue && value !== 0 && (
        <span className="tabular-nums">
          {config.prefix}{Math.abs(value)}
        </span>
      )}
    </div>
  );
};

export default MomentumChip;
