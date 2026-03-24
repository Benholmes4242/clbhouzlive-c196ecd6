import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSeasonConfig, SEASON_ORDER, type SeasonId } from '@/lib/seasonConfig';
import { getSeasonGradient } from '@/lib/colorUtils';
import { Lock, Check } from 'lucide-react';
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

  // Progress ring geometry — compact 80px
  const ringSize = 80;
  const ringStroke = 6;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = ringRadius * 2 * Math.PI;
  const ringOffset = ringCircumference - (animatedProgress / 100) * ringCircumference;

  // Unique gradient ID to avoid SVG conflicts
  const gradientId = `seasonRingGradient-${seasonId}`;

  // Urgency states
  const isUrgent = daysRemaining <= 14;
  const isCritical = daysRemaining <= 7;
  const isFinal = daysRemaining <= 3;

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

  return (
    <motion.div
      className={cn('space-y-4 py-5 px-5', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Season Header Row */}
      <div className="flex items-center gap-4">
        {/* Progress Ring — 80px compact */}
        <div className="flex-shrink-0 relative" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="transform -rotate-90">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradient.dark} />
                <stop offset="50%" stopColor={gradient.mid} />
                <stop offset="100%" stopColor={gradient.light} />
              </linearGradient>
            </defs>
            {/* Track — urgency tint when <=14 days */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke={isUrgent ? `${color}20` : 'hsl(var(--border) / 0.3)'}
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
              className={cn(
                'transition-all duration-[800ms] ease-out',
                isCritical && 'animate-pulse'
              )}
            />
          </svg>
          {/* Center number + label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[28px] font-bold leading-none"
              style={{ color: isUrgent ? color : 'hsl(var(--foreground))' }}
            >
              {daysRemaining}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
              days left
            </span>
          </div>
        </div>

        {/* Season Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-muted-foreground uppercase" style={{ letterSpacing: '0.05em', fontSize: '10px' }}>
              Current Season
            </span>
            {/* Active badge — season-colored pill with pulsing dot */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full"
              style={{ backgroundColor: gradient.tint, padding: '4px 10px' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: color }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
              </span>
              <span className="font-semibold uppercase tracking-wide" style={{ color, fontSize: '13px' }}>
                Active
              </span>
            </div>
          </div>

          <h3 className="text-[22px] font-bold text-foreground leading-tight">
            {config.title}
          </h3>
          <p className="text-[14px] text-muted-foreground mt-0.5">
            {config.subtitle}
          </p>
          {isFinal && (
            <p className="text-[11px] font-bold mt-1" style={{ color }}>
              Final days!
            </p>
          )}
        </div>
      </div>

      {/* Season Selector — Horizontal pill strip */}
      <div
        className="flex gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {SEASON_ORDER.map((id) => {
          const seasonConfig = getSeasonConfig(id);
          const state = getSeasonState(id);
          const isLocked = state === 'locked';
          const isActive = state === 'active';
          const isCompleted = state === 'completed';
          const tabColor = seasonConfig.themeColor;
          const daysUntil = seasonData[id]?.daysUntilAvailable;

          return (
            <button
              key={id}
              onClick={() => !isLocked && onSeasonSelect?.(id)}
              disabled={isLocked}
              className="flex-shrink-0 flex items-center gap-1.5 transition-all duration-200 active:scale-[0.96]"
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 18,
                fontSize: 13,
                fontWeight: 600,
                opacity: isLocked ? 0.6 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                ...(isActive ? {
                  backgroundColor: `${tabColor}18`,
                  border: `1.5px solid ${tabColor}60`,
                  color: tabColor,
                } : isCompleted ? {
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  color: '#64748B',
                } : {
                  backgroundColor: 'transparent',
                  border: '1px solid #E2E8F0',
                  color: '#94A3B8',
                }),
              }}
            >
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: tabColor }}
                />
              )}
              {isCompleted && (
                <Check className="w-3 h-3" style={{ color: '#64748B' }} />
              )}
              {isLocked && (
                <Lock className="w-3 h-3" style={{ color: '#94A3B8' }} />
              )}
              {getShortName(id)}
              {isLocked && daysUntil && daysUntil <= 14 && (
                <span className="text-[11px] opacity-70 ml-0.5">in {daysUntil}d</span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ActiveSeasonCard;
