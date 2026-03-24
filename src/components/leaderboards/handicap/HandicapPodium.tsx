import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { formatHcp, getHandicapStatusLabel, getHandicapBadgeStyle } from '@/lib/formatHcp';
import type { LowestHandicapEntry, HandicapImprovementEntry, SeasonImprovementEntry } from '@/types/leaderboards';

type PodiumEntry = LowestHandicapEntry | HandicapImprovementEntry | SeasonImprovementEntry;

interface HandicapPodiumProps {
  entries: PodiumEntry[];
  currentUserId?: string;
  mode: 'lowest' | 'improved' | 'season';
  seasonColor?: string;
}

function getHandicapValue(entry: PodiumEntry): number {
  if ('handicap_index' in entry) return entry.handicap_index;
  if ('current_handicap' in entry) return entry.current_handicap;
  return 0;
}

// Matches ExplorationPodium A* spec exactly
const POSITION_CONFIG = {
  1: {
    avatarSize: 120,
    badgeSize: 26,
    nameSize: 17,
    nameWeight: 700,
    statSize: 24,
    statWeight: 800,
    labelSize: 13,
    badgeBg: 'hsl(var(--accent-amber))',
    shadowColor: 'hsl(var(--accent-amber) / 0.25)',
    crownSize: 36,
    verticalOffset: 0,
  },
  2: {
    avatarSize: 88,
    badgeSize: 22,
    nameSize: 15,
    nameWeight: 600,
    statSize: 20,
    statWeight: 700,
    labelSize: 12,
    badgeBg: '#A8B4C0',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 24,
  },
  3: {
    avatarSize: 88,
    badgeSize: 22,
    nameSize: 15,
    nameWeight: 600,
    statSize: 20,
    statWeight: 700,
    labelSize: 12,
    badgeBg: '#C4956A',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 40,
  },
} as const;

const ANIMATION_DELAYS = { 1: 0.1, 2: 0, 3: 0.2 } as const;

function formatNameTwoLines(displayName: string | null): { firstName: string; lastName: string | null } {
  const name = displayName || 'Golfer';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function HandicapPodium({ entries, currentUserId, mode }: HandicapPodiumProps) {
  if (entries.length < 3) return null;

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
          background: 'radial-gradient(ellipse at 50% 40%, hsl(var(--accent-amber) / 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Podium Layout: 2nd - 1st (elevated) - 3rd */}
      <div className="relative flex items-start justify-center gap-2">
        {arranged.map(({ entry, position }) => {
          const config = POSITION_CONFIG[position];
          const handicap = getHandicapValue(entry);
          const nameParts = formatNameTwoLines(entry.display_name);
          const avatarFallback = entry.display_name?.charAt(0) || '?';
          const delay = ANIMATION_DELAYS[position];
          const statusLabel = getHandicapStatusLabel(handicap);
          const badgeStyle = getHandicapBadgeStyle(handicap);

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

                {/* Avatar with ring — CIRCULAR */}
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
                      width: config.avatarSize,
                      height: config.avatarSize,
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

                  {/* Rank badge — filled circle */}
                  <div
                    className="absolute -bottom-1.5 -right-0.5 flex items-center justify-center font-bold text-white shadow-md"
                    style={{
                      width: config.badgeSize,
                      height: config.badgeSize,
                      borderRadius: '50%',
                      backgroundColor: config.badgeBg,
                      border: '2px solid hsl(var(--background))',
                      fontSize: config.badgeSize * 0.45,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {position}
                  </div>
                </div>

                {/* Name — two lines */}
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

                {/* Handicap stat — amber number + tier label */}
                <motion.p
                  className="font-bold mt-0.5"
                  style={{ color: 'hsl(var(--accent-amber))', fontSize: config.statSize, fontWeight: config.statWeight }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.3, duration: 0.3 }}
                >
                  {formatHcp(handicap)}
                  {statusLabel && (
                    <span
                      className="font-normal text-muted-foreground ml-1"
                      style={{ fontSize: config.labelSize }}
                    >
                      {statusLabel}
                    </span>
                  )}
                </motion.p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
