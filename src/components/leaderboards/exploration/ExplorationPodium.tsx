import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExplorationLeaderboardEntry, ExplorationMetric } from '@/types/leaderboards';

// Position-specific styling - Modern Country Club palette
const POSITION_CONFIG = {
  1: {
    ringSize: 130,
    borderWidth: 1.5,
    gap: 0.5,
    badgeSize: 32,
    platformHeight: 48,
    nameSize: 'text-base font-bold',
    countSize: 'text-xl',
    borderColor: '#C1A84C', // Chartreus Gold
    badgeBg: 'bg-[#C1A84C]',
  },
  2: {
    ringSize: 104,
    borderWidth: 1.5,
    gap: 0.5,
    badgeSize: 28,
    platformHeight: 32,
    nameSize: 'text-sm font-semibold',
    countSize: 'text-lg',
    borderColor: '#B8C6C9', // Sky Blue Silver
    badgeBg: 'bg-[#B8C6C9]',
  },
  3: {
    ringSize: 104,
    borderWidth: 1.5,
    gap: 0.5,
    badgeSize: 28,
    platformHeight: 24,
    nameSize: 'text-sm font-semibold',
    countSize: 'text-lg',
    borderColor: '#8B7355', // Warm Bronze
    badgeBg: 'bg-[#8B7355]',
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
 * Short continent abbreviations
 */
const getShortContinent = (continent: string): string => {
  const map: Record<string, string> = {
    'Europe': 'Europe',
    'Asia': 'Asia',
    'North America': 'N. America',
    'South America': 'S. America',
    'Africa': 'Africa',
    'Oceania': 'Oceania',
    'Antarctica': 'Antarctica',
  };
  return map[continent] || continent;
};

/**
 * Format name as two lines: First name, then Last name
 */
function formatNameTwoLines(displayName: string | null): { firstName: string; lastName: string | null } {
  const name = displayName || 'Golfer';
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#334E3D]/10 mb-4">
          <Globe className="w-8 h-8 text-[#334E3D]" />
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
    <div className="relative w-full pt-12 pb-4 overflow-visible animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Airplane with clouds and jet stream - positioned above podium */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        {/* Cloud elements - spaced out around plane */}
        <div className="absolute -left-6 top-0 w-4 h-2.5 bg-muted/80 rounded-full blur-[2px]" />
        <div className="absolute -left-3 top-4 w-3 h-2 bg-muted-foreground/20 rounded-full blur-[1px]" />
        <div className="absolute right-7 top--1 w-3 h-2 bg-muted/70 rounded-full blur-[2px]" />
        <div className="absolute right-4 top-3 w-2.5 h-1.5 bg-muted-foreground/15 rounded-full blur-[1px]" />
        
        {/* Jet stream trails - behind plane */}
        <div 
          className="absolute top-3 -left-10 w-8 h-[2px] bg-gradient-to-r from-transparent via-[#C1A84C]/50 to-[#C1A84C]/60 rounded-full"
          style={{ transform: 'rotate(-15deg)' }}
        />
        <div 
          className="absolute top-4 -left-8 w-6 h-[1.5px] bg-gradient-to-r from-transparent via-[#C1A84C]/40 to-[#C1A84C]/50 rounded-full"
          style={{ transform: 'rotate(-15deg)' }}
        />
        
        {/* Airplane icon - Chartreus gold to match crowns */}
        <Plane 
          size={26} 
          className="drop-shadow-lg"
          style={{ color: '#C1A84C', transform: 'rotate(30deg)' }}
          fill="#C1A84C"
          strokeWidth={1.5}
        />
      </div>

      {/* Chartreus gold ambient glow for 1st place */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '25%',
          right: '25%',
          bottom: '30%',
          background: 'radial-gradient(ellipse at center, rgba(193, 168, 76, 0.15) 0%, transparent 70%)',
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
          const nameParts = formatNameTwoLines(entry.display_name);
          const avatarFallback = entry.display_name?.charAt(0) || '?';

          return (
            <motion.div
              key={entry.user_id}
              whileTap={{ scale: 0.97 }}
              className="flex-1"
            >
            <Link
              to={`/profile/${entry.user_id}`}
              className="flex flex-col items-center"
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
              <div className="relative overflow-visible">
                {/* Radial glow effect for 1st place - Chartreus gold */}
                {position === 1 && (
                  <div 
                    className="absolute -z-10"
                    style={{
                      top: '-1rem',
                      left: '-2.5rem',
                      right: '-2.5rem',
                      bottom: '-2.5rem',
                      background: 'radial-gradient(ellipse at center, rgba(193, 168, 76, 0.6) 0%, rgba(193, 168, 76, 0.35) 30%, rgba(193, 168, 76, 0.1) 60%, transparent 80%)',
                      filter: 'blur(16px)',
                    }}
                  />
                )}

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
                      alt={nameParts.firstName}
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
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center font-bold text-white shadow-md bg-[#C1A84C]"
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

              {/* Name + metric + chips with consistent spacing */}
              <div className="flex flex-col items-center gap-0.5 mt-2">
                <div className="text-center">
                  <p
                    className={cn(
                      'text-foreground leading-tight',
                      config.nameSize
                    )}
                  >
                    {nameParts.firstName}
                  </p>
                  {nameParts.lastName && (
                    <p
                      className={cn(
                        'text-foreground leading-tight',
                        config.nameSize
                      )}
                    >
                      {nameParts.lastName}
                    </p>
                  )}
                </div>

                {/* Metric count - uses podium position color */}
                <p
                  className={cn('font-bold', config.countSize)}
                  style={{ color: config.borderColor }}
                >
                  {metricValue}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {getMetricLabel(metric)}
                  </span>
                </p>

                {/* Continent chips - smaller & more subtle */}
                {entry.continent_list && entry.continent_list.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap justify-center max-w-[110px]">
                    {entry.continent_list.slice(0, 3).map((continent) => (
                      <span
                        key={continent}
                        className="text-[8px] px-1.5 py-0.5 bg-[#334E3D]/5 text-[#334E3D] rounded-full border border-[#334E3D]/10 whitespace-nowrap"
                      >
                        {getShortContinent(continent)}
                      </span>
                    ))}
                    {entry.continent_list.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">
                        +{entry.continent_list.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
