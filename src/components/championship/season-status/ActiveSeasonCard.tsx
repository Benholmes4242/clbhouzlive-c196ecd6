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

  // Progress ring geometry — scaled up for premium feel
  const ringSize = 96;
  const ringStroke = 6;
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
      className={cn('space-y-4 py-4 px-3', className)}
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
              stroke="hsl(var(--border) / 0.3)"
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
            <span className="text-[28px] font-bold text-foreground leading-none">{daysRemaining}</span>
          </div>
        </div>

        {/* Season Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase" style={{ letterSpacing: '0.05em', fontSize: '12px' }}>
              Current Season
            </span>
            {/* Active badge — season-colored pill with pulsing dot */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full"
              style={{ backgroundColor: gradient.tint, padding: '6px 14px' }}
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
        </div>
      </div>

      {/* Season strip — compact horizontal pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {SEASON_ORDER.map((id) => {
          const seasonConfig = getSeasonConfig(id);
          const SeasonIcon = seasonConfig.Icon;
          const state = getSeasonState(id);
          const isLocked = state === 'locked';
          const isActive = state === 'active';
          const isCompleted = state === 'completed';
          const tabColor = getTabSeasonColor(id);

          return (
            <button
              key={id}
              onClick={() => !isLocked && onSeasonSelect?.(id)}
              disabled={isLocked}
              className="flex items-center gap-2 flex-shrink-0 active:scale-[0.97] transition-all duration-200"
              style={{
                padding: '7px 14px',
                borderRadius: 99,
                border: isActive
                  ? `1.5px solid ${tabColor}40`
                  : '1.5px solid hsl(var(--border) / 0.4)',
                background: isActive
                  ? 'hsl(var(--card))'
                  : isCompleted
                  ? 'hsl(var(--muted) / 0.3)'
                  : 'hsl(var(--muted) / 0.15)',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.45 : 1,
                boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <SeasonIcon
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: isActive ? tabColor : 'hsl(var(--muted-foreground))' }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? tabColor : 'hsl(var(--muted-foreground))',
                  fontFamily: 'DM Sans, system-ui, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {getShortName(id)}
              </span>
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: tabColor }}
                />
              )}
              {isCompleted && (
                <span style={{ fontSize: 11 }}>✓</span>
              )}
              {isLocked && (
                <Lock className="w-3 h-3 flex-shrink-0 opacity-40" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ActiveSeasonCard;
