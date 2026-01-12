/**
 * CollegeSpotlight - Horizontal strip showing top colleges
 * Huge engagement hook for gamification
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { CollegeCrestTile } from './CollegeCrestTile';
import { CollegeRankBadge } from './CollegeRankBadge';

interface SpotlightCollege {
  rank: number;
  collegeName: string;
  logoUrl?: string | null;
  metric?: string | number;
  metricLabel?: string;
  onClick?: () => void;
}

interface CollegeSpotlightProps {
  colleges: SpotlightCollege[];
  title?: string;
  subtitle?: string;
  onViewAll?: () => void;
  className?: string;
}

const SpotlightCard: React.FC<SpotlightCollege> = ({
  rank,
  collegeName,
  logoUrl,
  metric,
  metricLabel,
  onClick,
}) => {
  const isTop3 = rank <= 3;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex-shrink-0 flex flex-col items-center p-3 rounded-sq-md w-[100px]',
        'bg-white/60 dark:bg-white/5',
        'border border-border/20 dark:border-white/5',
        // Hover & press
        onClick && [
          'hover:bg-white/80 dark:hover:bg-white/8',
          'active:scale-[0.97]',
        ],
        'transition-all duration-motion-fast ease-out'
      )}
    >
      {/* Crest tile with rank badge */}
      <div className="relative">
        <CollegeCrestTile
          logoUrl={logoUrl}
          collegeName={collegeName}
          size="standard"
          variant={isTop3 ? 'highlighted' : 'standard'}
        />
        <div className="absolute -bottom-1 -right-1">
          <CollegeRankBadge rank={rank} size="sm" showCrown={false} />
        </div>
      </div>

      {/* College name */}
      <p className="mt-2 text-xs font-medium text-center text-foreground line-clamp-2 leading-tight">
        {collegeName}
      </p>

      {/* Metric */}
      {metric !== undefined && (
        <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
          {typeof metric === 'number' ? metric.toLocaleString() : metric}
          {metricLabel && ` ${metricLabel}`}
        </p>
      )}
    </button>
  );
};

export const CollegeSpotlight: React.FC<CollegeSpotlightProps> = ({
  colleges,
  title = 'College Spotlight',
  subtitle = 'Where the talent comes from.',
  onViewAll,
  className,
}) => {
  return (
    <div className={cn('py-4', className)}>
      {/* Header */}
      <div className="flex items-end justify-between px-4 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-0.5 text-xs font-medium text-brand-orange hover:opacity-80 transition-opacity"
          >
            Full Rankings
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
        {colleges.map((college) => (
          <SpotlightCard key={college.rank} {...college} />
        ))}
      </div>
    </div>
  );
};

export default CollegeSpotlight;
