import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExplorationLeaderboardEntry, ExplorationMetric } from '@/types/leaderboards';

// Premium awards stage configuration — matches TrophyPodiumSlot
const POSITION_CONFIG = {
  1: {
    avatarSize: 110,
    mobileAvatarSize: 90,
    borderWidth: 0.5,
    badgeSize: 28,
    nameClass: 'text-lg font-bold',
    statClass: 'text-base',
    borderColor: '#D4A853',        // Gold
    borderGradient: ['#D4A853', '#F0D78C', '#D4A853'],
    badgeBg: '#D4A853',
    shadowColor: 'rgba(212, 168, 83, 0.25)',
    crownSize: 36,
    verticalOffset: 0,
  },
  2: {
    avatarSize: 80,
    mobileAvatarSize: 68,
    borderWidth: 0.5,
    badgeSize: 24,
    nameClass: 'text-sm font-semibold',
    statClass: 'text-sm',
    borderColor: '#A8B4C0',        // Silver
    borderGradient: ['#A8B4C0'],
    badgeBg: '#A8B4C0',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 20,
  },
  3: {
    avatarSize: 80,
    mobileAvatarSize: 68,
    borderWidth: 0.5,
    badgeSize: 24,
    nameClass: 'text-sm font-semibold',
    statClass: 'text-sm',
    borderColor: '#C4956A',        // Bronze
    borderGradient: ['#C4956A'],
    badgeBg: '#C4956A',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 32,
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

const getShortContinent = (continent: string): string => {
  const map: Record<string, string> = {
    'Europe': 'Europe',
    'Asia': 'Asia',
    'North America': 'N. America',
    'South America': 'S. America',
    'Africa': 'Africa',
    'Oceania': 'Oceania',
  };
  return map[continent] || continent;
};

function formatNameTwoLines(displayName: string | null): { firstName: string; lastName: string | null } {
  const name = displayName || 'Golfer';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// Stagger order: #2 first (0ms), #1 second (100ms), #3 third (200ms)
const ANIMATION_DELAYS = { 1: 0.1, 2: 0, 3: 0.2 } as const;

export function ExplorationPodium({ entries, metric, currentUserId }: ExplorationPodiumProps) {
  if (entries.length < 3) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Globe className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Not enough explorers yet!</p>
      </div>
    );
  }

  const arranged = [
    { entry: entries[1], position: 2 as const },
    { entry: entries[0], position: 1 as const },
    { entry: entries[2], position: 3 as const },
  ];

  return (
    <div className="relative w-full py-8 overflow-visible">
      {/* Spotlight background behind #1 */}
      <div
        className="absolute pointer-events-none inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(82, 183, 136, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* Podium Layout: 2nd - 1st (elevated) - 3rd */}
      <div className="relative flex items-start justify-center">
        {arranged.map(({ entry, position }) => {
          const config = POSITION_CONFIG[position];
          const metricValue = getMetricValue(entry, metric);
          const nameParts = formatNameTwoLines(entry.display_name);
          const avatarFallback = entry.display_name?.charAt(0) || '?';
          const delay = ANIMATION_DELAYS[position];

          return (
            <motion.div
              key={entry.user_id}
              className="flex flex-col items-center flex-1 relative"
              style={{ marginTop: config.verticalOffset }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay, ease: 'easeOut' }}
            >
              <Link to={`/profile/${entry.user_id}`} className="flex flex-col items-center">
                {/* Crown for 1st place */}
                {position === 1 && (
                  <motion.div
                    className="mb-1"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: delay + 0.2,
                      duration: 0.4,
                      type: 'spring',
                      stiffness: 200,
                    }}
                  >
                    <Crown
                      size={config.crownSize}
                      className="drop-shadow-md"
                      style={{ color: '#D4A853' }}
                      fill="#D4A853"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                )}

                {/* Avatar with metallic ring */}
                <div className="relative">
                  {/* Golden glow for #1 */}
                  {position === 1 && (
                    <div
                      className="absolute -z-10"
                      style={{
                        top: '-1.5rem',
                        left: '-2rem',
                        right: '-2rem',
                        bottom: '-2rem',
                        background: 'radial-gradient(ellipse at center, rgba(212, 168, 83, 0.3) 0%, rgba(212, 168, 83, 0.1) 50%, transparent 80%)',
                        filter: 'blur(12px)',
                      }}
                    />
                  )}

                  {/* Avatar image */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      width: config.mobileAvatarSize,
                      aspectRatio: '1 / 1.05',
                      borderRadius: '34%',
                      border: `${config.borderWidth}px solid ${config.borderColor}`,
                      boxShadow: `0 ${position === 1 ? '8px 24px' : '4px 12px'} ${config.shadowColor}`,
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

                  {/* Rank badge — bottom-right */}
                  <div
                    className="absolute -bottom-1.5 -right-0.5 flex items-center justify-center font-bold text-white shadow-md"
                    style={{
                      width: config.badgeSize,
                      height: config.badgeSize,
                      borderRadius: '34%',
                      backgroundColor: config.badgeBg,
                      border: '2px solid white',
                      fontSize: config.badgeSize * 0.45,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {position}
                  </div>
                </div>

                {/* Name */}
                <div className="mt-3 text-center">
                  <p className={cn('text-foreground leading-tight', config.nameClass)}>
                    {nameParts.firstName}
                  </p>
                  {nameParts.lastName && (
                    <p className={cn('text-foreground leading-tight', config.nameClass)}>
                      {nameParts.lastName}
                    </p>
                  )}
                </div>

                {/* Stat — green number + muted label */}
                <motion.p
                  className={cn('font-bold mt-0.5', config.statClass)}
                  style={{ color: '#40916C' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.3, duration: 0.3 }}
                >
                  {metricValue}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {getMetricLabel(metric)}
                  </span>
                </motion.p>

                {/* Continent tags */}
                {entry.continent_list && entry.continent_list.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap justify-center max-w-[110px]">
                    {entry.continent_list.filter(c => c !== 'Antarctica').slice(0, 3).map((continent) => (
                      <span
                        key={continent}
                        className="text-[9px] px-1.5 py-0.5 text-muted-foreground rounded-md whitespace-nowrap"
                        style={{
                          background: 'rgba(0, 0, 0, 0.04)',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        {getShortContinent(continent)}
                      </span>
                    ))}
                    {entry.continent_list.filter(c => c !== 'Antarctica').length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{entry.continent_list.filter(c => c !== 'Antarctica').length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
