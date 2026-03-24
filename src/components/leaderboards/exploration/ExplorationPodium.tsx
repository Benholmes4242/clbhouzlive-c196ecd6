import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSeasonGradient } from '@/lib/colorUtils';
import type { ExplorationLeaderboardEntry, ExplorationMetric } from '@/types/leaderboards';

// Premium awards stage configuration — matches TrophyPodiumSlot A* spec
// Gold uses accent-amber CSS var; silver (#A8B4C0) and bronze (#C4956A) are decorative — no semantic var available
const POSITION_CONFIG = {
  1: {
    avatarSize: 120,
    mobileAvatarSize: 120,
    borderWidth: 0.5,
    badgeSize: 26,
    nameSize: 17,
    nameWeight: 700,
    statSize: 24,
    statWeight: 800,
    labelSize: 13,
    borderColor: 'hsl(var(--accent-amber))',
    borderGradient: ['hsl(var(--accent-amber))', '#F0D78C', 'hsl(var(--accent-amber))'],
    badgeBg: 'hsl(var(--accent-amber))',
    shadowColor: 'hsl(var(--accent-amber) / 0.25)',
    crownSize: 36,
    verticalOffset: 0,
  },
  2: {
    avatarSize: 88,
    mobileAvatarSize: 88,
    borderWidth: 0.5,
    badgeSize: 22,
    nameSize: 15,
    nameWeight: 600,
    statSize: 20,
    statWeight: 700,
    labelSize: 12,
    borderColor: '#A8B4C0',
    borderGradient: ['#A8B4C0'],
    badgeBg: '#A8B4C0',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 24,
  },
  3: {
    avatarSize: 88,
    mobileAvatarSize: 88,
    borderWidth: 0.5,
    badgeSize: 22,
    nameSize: 15,
    nameWeight: 600,
    statSize: 20,
    statWeight: 700,
    labelSize: 12,
    borderColor: '#C4956A',
    borderGradient: ['#C4956A'],
    badgeBg: '#C4956A',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 40,
  },
} as const;

interface ExplorationPodiumProps {
  entries: ExplorationLeaderboardEntry[];
  metric: ExplorationMetric;
  currentUserId?: string;
  seasonColor?: string;
}

const getMetricValue = (entry: ExplorationLeaderboardEntry, metric: ExplorationMetric): number => {
  switch (metric) {
    case 'continents':
      return entry.continents_count;
    case 'courses':
      return entry.courses_count;
    default:
      return entry.countries_count;
  }
};

const getMetricLabel = (metric: ExplorationMetric): string => {
  switch (metric) {
    case 'continents':
      return 'continents';
    case 'courses':
      return 'courses';
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

export function ExplorationPodium({ entries, metric, currentUserId, seasonColor = 'hsl(var(--accent-amber))' }: ExplorationPodiumProps) {
  const gradient = getSeasonGradient(seasonColor);

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
          background: `radial-gradient(ellipse at 50% 40%, ${gradient.subtleTint} 0%, transparent 70%)`,
        }}
      />

      {/* Podium Layout: 2nd - 1st (elevated) - 3rd */}
      <div className="relative flex items-start justify-center gap-2">
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
                      style={{ color: 'hsl(var(--accent-amber))' }}
                      fill="#f59e0b"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                )}

                {/* Avatar with metallic ring — CIRCULAR */}
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
                        background: 'radial-gradient(ellipse at center, hsl(var(--accent-amber) / 0.3) 0%, hsl(var(--accent-amber) / 0.1) 50%, transparent 80%)',
                        filter: 'blur(12px)',
                      }}
                    />
                  )}

                  {/* Avatar image — circle */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      width: config.mobileAvatarSize,
                      height: config.mobileAvatarSize,
                      borderRadius: '50%',
                      border: 'none',
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

                  {/* Rank badge — filled circle matching TrophyPodiumSlot */}
                  <div
                    className="absolute -bottom-1.5 -right-0.5 flex items-center justify-center font-bold text-white shadow-md"
                    style={{
                      width: position === 1 ? 26 : 22,
                      height: position === 1 ? 26 : 22,
                      borderRadius: '50%',
                      backgroundColor: position === 1 ? 'hsl(var(--accent-amber))' : position === 2 ? '#A8B4C0' : '#C4956A',
                      border: '2px solid hsl(var(--background))',
                      fontSize: (position === 1 ? 26 : 22) * 0.45,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {position}
                  </div>
                </div>

                {/* Name */}
                <div className="mt-3 text-center">
                  <p
                    className="text-foreground leading-tight"
                    style={{ fontSize: config.nameSize, fontWeight: config.nameWeight }}
                  >
                    {nameParts.firstName}
                  </p>
                  {nameParts.lastName && (
                    <p
                      className="text-foreground leading-tight"
                      style={{ fontSize: config.nameSize, fontWeight: config.nameWeight }}
                    >
                      {nameParts.lastName}
                    </p>
                  )}
                </div>

                {/* Stat — season-colored number + muted label */}
                <motion.p
                  className="font-bold mt-0.5"
                  style={{ color: 'hsl(var(--accent-amber))', fontSize: config.statSize, fontWeight: config.statWeight }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.3, duration: 0.3 }}
                >
                  {metricValue}
                  <span
                    className="font-normal text-muted-foreground ml-1"
                    style={{ fontSize: config.labelSize }}
                  >
                    {getMetricLabel(metric)}
                  </span>
                </motion.p>

                {/* Continent tags */}
                {entry.continent_list && entry.continent_list.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap justify-center max-w-[110px]">
                    {entry.continent_list.filter(c => c !== 'Antarctica').slice(0, 3).map((continent) => (
                      <span
                        key={continent}
                        className="text-[11px] px-2 py-0.5 text-muted-foreground rounded-md whitespace-nowrap"
                        style={{
                          background: 'hsl(var(--muted) / 0.5)',
                          border: '1px solid hsl(var(--border) / 0.3)',
                        }}
                      >
                        {getShortContinent(continent)}
                      </span>
                    ))}
                    {entry.continent_list.filter(c => c !== 'Antarctica').length > 3 && (
                      <span className="text-[11px] text-muted-foreground">
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
