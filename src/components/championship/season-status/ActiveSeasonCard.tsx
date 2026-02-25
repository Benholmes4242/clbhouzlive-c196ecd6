import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSeasonConfig, SEASON_ORDER, type SeasonId } from '@/lib/seasonConfig';
import { getSeasonGradient } from '@/lib/colorUtils';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface SeasonData {
  daysUntilAvailable?: number;
}

interface ActiveSeasonCardProps {
  seasonId: SeasonId;
  daysRemaining: number;
  progressPercent: number;
  seasonData?: Record<SeasonId, SeasonData>;
  onSeasonSelect?: (seasonId: SeasonId) => void;
  seasonColor?: string;
  className?: string;
}

export const ActiveSeasonCard: React.FC<ActiveSeasonCardProps> = ({
  seasonId,
  daysRemaining,
  progressPercent,
  seasonData = {},
  onSeasonSelect,
  seasonColor,
  className,
}) => {
  const config = getSeasonConfig(seasonId);
  const color = seasonColor || config.themeColor;
  const gradient = getSeasonGradient(color);

  // Animated progress ring fill
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 150);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  // Progress ring geometry
  const ringSize = 80;
  const ringStroke = 5;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = ringRadius * 2 * Math.PI;
  const ringOffset = ringCircumference - (animatedProgress / 100) * ringCircumference;

  // Unique gradient ID to avoid SVG conflicts
  const gradientId = `seasonRingGradient-${seasonId}`;

  // Season state logic
  const getSeasonState = (id: SeasonId): 'active' | 'completed' | 'locked' => {
    const currentIndex = SEASON_ORDER.indexOf(seasonId);
    const targetIndex = SEASON_ORDER.indexOf(id);
    if (id === seasonId) return 'active';
    if (targetIndex < currentIndex) return 'completed';
    return 'locked';
  };

  const getShortName = (id: SeasonId): string => {
    switch (id) {
      case 'preseason': return 'Pre-Season';
      case 'major': return 'Major';
      case 'summer': return 'Summer';
      case 'offseason': return 'Off-Season';
      default: return id;
    }
  };

  // Get the color for each season tab icon
  const getTabSeasonColor = (id: SeasonId): string => {
    return getSeasonConfig(id).themeColor;
  };

  return (
    <motion.div
      className={cn('space-y-5', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Season Header Row */}
      <div className="flex items-center gap-4">
        {/* Progress Ring — Statement piece with gradient stroke */}
        <div className="flex-shrink-0 relative" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="transform -rotate-90">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradient.dark} />
                <stop offset="50%" stopColor={gradient.mid} />
                <stop offset="100%" stopColor={gradient.light} />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke="rgba(0, 0, 0, 0.06)"
              strokeWidth={ringStroke}
            />
            {/* Progress arc */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={ringStroke}
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              className="transition-all duration-[800ms] ease-out"
            />
          </svg>
          {/* Center number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{daysRemaining}</span>
          </div>
        </div>

        {/* Season Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Current Season
            </span>
            {/* Active badge — season-colored pill with pulsing dot */}
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: gradient.tint }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: color }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
                Active
              </span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-foreground leading-tight">
            {config.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Season Selector Tabs — Pill container */}
      <div
        className="rounded-[14px] p-[3px]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
      >
        <div className="flex gap-1">
          {SEASON_ORDER.map((id) => {
            const seasonConfig = getSeasonConfig(id);
            const SeasonIcon = seasonConfig.Icon;
            const state = getSeasonState(id);
            const isLocked = state === 'locked';
            const isActive = state === 'active';
            const tabColor = getTabSeasonColor(id);

            return (
              <button
                key={id}
                onClick={() => !isLocked && onSeasonSelect?.(id)}
                disabled={isLocked}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl min-w-0',
                  'transition-all duration-200 active:scale-[0.97]',
                  isActive && 'bg-card shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]',
                  isLocked && 'cursor-not-allowed',
                  !isLocked && !isActive && 'hover:opacity-60'
                )}
              >
                <div className="relative">
                  <SeasonIcon
                    className={cn('w-4.5 h-4.5', isLocked && 'opacity-50')}
                    style={{ color: isActive ? tabColor : 'hsl(var(--muted-foreground))' }}
                  />
                  {isLocked && (
                    <Lock className="absolute -bottom-0.5 -right-1 w-2.5 h-2.5 text-muted-foreground/60" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium leading-tight text-center whitespace-nowrap',
                    isActive ? 'text-foreground font-semibold' : 'text-muted-foreground',
                    isLocked && 'opacity-50'
                  )}
                >
                  {getShortName(id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveSeasonCard;
