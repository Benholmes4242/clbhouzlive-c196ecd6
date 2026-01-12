/**
 * CollegePodium - Prestige top 3 display for college leaderboards
 * Apple-ish, not esports - clean and premium
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CollegeCrestTile } from './CollegeCrestTile';
import { CollegeRankBadge } from './CollegeRankBadge';

interface PodiumCollege {
  rank: 1 | 2 | 3;
  collegeName: string;
  logoUrl?: string | null;
  metric?: string | number;
  metricLabel?: string;
  onClick?: () => void;
}

interface CollegePodiumProps {
  colleges: PodiumCollege[];
  className?: string;
}

const medalConfig = {
  1: {
    glow: 'shadow-[0_0_20px_rgba(212,175,55,0.25)]',
    ringColor: 'ring-amber-400/40',
    bgGradient: 'bg-gradient-to-b from-amber-50/50 to-transparent',
  },
  2: {
    glow: 'shadow-[0_0_16px_rgba(192,192,192,0.2)]',
    ringColor: 'ring-slate-400/30',
    bgGradient: 'bg-gradient-to-b from-slate-100/50 to-transparent',
  },
  3: {
    glow: 'shadow-[0_0_14px_rgba(205,127,50,0.2)]',
    ringColor: 'ring-orange-400/30',
    bgGradient: 'bg-gradient-to-b from-orange-50/30 to-transparent',
  },
};

const PodiumCard: React.FC<PodiumCollege> = ({
  rank,
  collegeName,
  logoUrl,
  metric,
  metricLabel,
  onClick,
}) => {
  const config = medalConfig[rank];
  const isFirst = rank === 1;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex flex-col items-center p-4 rounded-sq-md',
        'bg-white/70 dark:bg-white/5',
        'border border-border/20 dark:border-white/8',
        config.bgGradient,
        // Hover & press
        onClick && [
          'hover:bg-white/90 dark:hover:bg-white/10',
          'active:scale-[0.97]',
        ],
        'transition-all duration-motion-fast ease-out',
        // First place gets more prominence
        isFirst && 'flex-1 py-5',
        !isFirst && 'flex-1'
      )}
    >
      {/* Rank badge - larger for podium */}
      <CollegeRankBadge rank={rank} size="md" />

      {/* Crest with medal glow */}
      <div className={cn(
        'mt-3 rounded-sq-sm',
        config.glow,
        isFirst && 'ring-2',
        !isFirst && 'ring-1',
        config.ringColor,
      )}>
        <CollegeCrestTile
          logoUrl={logoUrl}
          collegeName={collegeName}
          size={isFirst ? 'trophy' : 'hero'}
          variant="highlighted"
        />
      </div>

      {/* College name */}
      <p className={cn(
        'mt-3 font-semibold text-center text-foreground line-clamp-2',
        isFirst ? 'text-sm' : 'text-xs',
      )}>
        {collegeName}
      </p>

      {/* Metric */}
      {metric !== undefined && (
        <div className="mt-2 text-center">
          <p className={cn(
            'font-bold tabular-nums',
            isFirst ? 'text-lg text-brand-orange' : 'text-sm text-foreground',
          )}>
            {typeof metric === 'number' ? metric.toLocaleString() : metric}
          </p>
          {metricLabel && (
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">
              {metricLabel}
            </p>
          )}
        </div>
      )}
    </button>
  );
};

export const CollegePodium: React.FC<CollegePodiumProps> = ({
  colleges,
  className,
}) => {
  // Sort to ensure order: 2, 1, 3 (for visual centering)
  const sorted = [...colleges].sort((a, b) => {
    const order = { 2: 0, 1: 1, 3: 2 };
    return order[a.rank] - order[b.rank];
  });

  return (
    <div className={cn(
      'flex items-end gap-2',
      className
    )}>
      {sorted.map((college) => (
        <PodiumCard key={college.rank} {...college} />
      ))}
    </div>
  );
};

export default CollegePodium;
