import { Link } from 'react-router-dom';
import { Crown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExplorationLeaderboardEntry, ExplorationMetric } from '@/types/leaderboards';

// Position-specific styling - EXACT match to TrophyPodiumSlot.tsx
const POSITION_CONFIG = {
  1: {
    ringSize: 130,
    borderWidth: 1.5,
    gap: 0.5,
    badgeSize: 32,
    platformHeight: 48,
    nameSize: 'text-base font-bold',
    countSize: 'text-xl',
    borderColor: '#eab308', // Gold
    badgeBg: 'bg-amber-500',
  },
  2: {
    ringSize: 104,
    borderWidth: 1.5,
    gap: 0.5,
    badgeSize: 28,
    platformHeight: 32,
    nameSize: 'text-sm font-semibold',
    countSize: 'text-lg',
    borderColor: '#94a3b8', // Silver
    badgeBg: 'bg-slate-400',
  },
  3: {
    ringSize: 104,
    borderWidth: 1.5,
    gap: 0.5,
    badgeSize: 28,
    platformHeight: 24,
    nameSize: 'text-sm font-semibold',
    countSize: 'text-lg',
    borderColor: '#d97706', // Bronze
    badgeBg: 'bg-amber-600',
  },
} as const;

interface ExplorationPodiumProps {
  entries: ExplorationLeaderboardEntry[];
  metric: ExplorationMetric;
  currentUserId?: string;
}

const getMetricValue = (entry: ExplorationLeaderboardEntry, metric: ExplorationMetric): number => {
  switch (metric) {
    case 'continents':
      return entry.continents_count;
    default:
      return entry.countries_count;
  }
};

const getMetricLabel = (metric: ExplorationMetric): string => {
  switch (metric) {
    case 'continents':
      return 'continents';
    default:
      return 'countries';
  }
};

/**
 * Truncate name to "First L." format (matching TrophyPodiumSlot)
 */
function formatName(displayName: string | null): string {
  const name = displayName || 'Golfer';
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].length > 12 ? parts[0].slice(0, 11) + '…' : parts[0];
  }
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  const formatted = `${firstName} ${lastInitial}.`;
  
  return formatted.length > 14 ? `${firstName.slice(0, 10)}… ${lastInitial}.` : formatted;
}

/**
 * Calculate inner image size based on ring size, border, and gap
 */
function getImageSize(ringSize: number, borderWidth: number, gap: number): number {
  return ringSize - (borderWidth * 2) - (gap * 2);
}

export function ExplorationPodium({ entries, metric, currentUserId }: ExplorationPodiumProps) {
  if (entries.length < 3) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
          <Globe className="w-8 h-8 text-teal-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          Not enough explorers yet!
        </p>
      </div>
    );
  }

  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  // Podium order: 2nd - 1st - 3rd
  const arranged = [
    { entry: second, position: 2 as const },
    { entry: first, position: 1 as const },
    { entry: third, position: 3 as const },
  ];

  return (
    <div className="relative w-full pt-6 pb-4 overflow-visible">
      {/* Crown above #1 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
        <Crown 
          size={28} 
          className="drop-shadow-sm"
          style={{ color: '#14B8A6' }}
          fill="#14B8A6"
          strokeWidth={1.5}
        />
      </div>

      {/* Teal ambient glow for 1st place */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '25%',
          right: '25%',
          bottom: '30%',
          background: 'radial-gradient(ellipse at center, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Podium Layout: 2nd - 1st (elevated) - 3rd - full width, no gaps */}
      <div className="relative flex items-end justify-between">
        {arranged.map(({ entry, position }) => {
          const config = POSITION_CONFIG[position];
          const imageSize = getImageSize(config.ringSize, config.borderWidth, config.gap);
          const isCurrentUser = entry.user_id === currentUserId;
          const metricValue = getMetricValue(entry, metric);
          const formattedName = formatName(entry.display_name);
          const avatarFallback = entry.display_name?.charAt(0) || '?';

          return (
            <Link
              key={entry.user_id}
              to={`/profile/${entry.user_id}`}
              className="flex flex-col items-center flex-1"
            >
              {/* Position badge (above avatar for 2nd and 3rd) */}
              {position !== 1 && (
                <div
                  className={cn(
                    'mb-2 flex items-center justify-center font-bold text-white shadow-sm',
                    config.badgeBg
                  )}
                  style={{
                    width: config.badgeSize,
                    height: config.badgeSize * 1.05,
                    borderRadius: '34%',
                    fontSize: config.badgeSize * 0.5,
                  }}
                >
                  {position}
                </div>
              )}

              {/* Avatar with squircle ring + gap effect (matching TrophyPodiumSlot exactly) */}
              <div className="relative">
                {/* Squircle avatar with box-shadow for ring + gap effect */}
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: imageSize,
                    height: imageSize * 1.05,
                    borderRadius: '34%',
                    boxShadow: `0 0 0 ${config.gap}px hsl(var(--background)), 0 0 0 ${config.gap + config.borderWidth}px ${config.borderColor}`,
                  }}
                >
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={formattedName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xl">
                      {avatarFallback}
                    </div>
                  )}
                </div>

                {/* 1st place badge below avatar */}
                {position === 1 && (
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center font-bold text-white shadow-md bg-amber-500"
                    style={{
                      width: config.badgeSize,
                      height: config.badgeSize * 1.05,
                      borderRadius: '34%',
                      fontSize: config.badgeSize * 0.5,
                    }}
                  >
                    1
                  </div>
                )}
              </div>

              {/* Name */}
              <p
                className={cn(
                  'mt-2 text-center text-foreground leading-tight',
                  config.nameSize,
                  isCurrentUser && 'text-primary'
                )}
              >
                {formattedName}
              </p>

              {/* Metric count */}
              <p
                className={cn('font-bold', config.countSize)}
                style={{ color: position === 1 ? '#14B8A6' : config.borderColor }}
              >
                {metricValue}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {getMetricLabel(metric)}
                </span>
              </p>

            </Link>
          );
        })}
      </div>
    </div>
  );
}
