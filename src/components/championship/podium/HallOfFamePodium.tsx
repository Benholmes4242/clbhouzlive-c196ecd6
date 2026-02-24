import React from 'react';
import { cn } from '@/lib/utils';
import { Crown, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePodiumAllTime } from '@/hooks/championship/usePodiumAllTime';
import type { AllTimePodiumEntry, PodiumScope } from '@/types/podium';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNameTwoLines } from '@/utils/formatters';

interface HallOfFamePodiumProps {
  entries?: AllTimePodiumEntry[];
  scope?: PodiumScope;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

// Premium awards stage configuration — matching TrophyPodiumSlot with richer All-Time gold
const POSITION_CONFIG = {
  1: {
    avatarSize: 110,
    mobileAvatarSize: 90,
    borderWidth: 3,
    badgeSize: 28,
    nameClass: 'text-lg font-bold',
    statClass: 'text-base',
    // Richer gold for All-Time — deeper multi-stop gradient feel
    borderColor: '#D4A853',
    badgeBg: '#D4A853',
    shadowColor: 'rgba(212, 168, 83, 0.3)', // Slightly stronger than seasonal 0.25
    crownSize: 36,
    verticalOffset: 0,
  },
  2: {
    avatarSize: 80,
    mobileAvatarSize: 68,
    borderWidth: 2.5,
    badgeSize: 24,
    nameClass: 'text-sm font-semibold',
    statClass: 'text-sm',
    borderColor: '#A8B4C0',
    badgeBg: '#A8B4C0',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 20,
  },
  3: {
    avatarSize: 80,
    mobileAvatarSize: 68,
    borderWidth: 2.5,
    badgeSize: 24,
    nameClass: 'text-sm font-semibold',
    statClass: 'text-sm',
    borderColor: '#C4956A',
    badgeBg: '#C4956A',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 32,
  },
} as const;

// Stagger order: 2nd → 1st → 3rd
const ANIMATION_DELAYS = { 1: 0.15, 2: 0, 3: 0.3 } as const;

interface SlotProps {
  entry: AllTimePodiumEntry | undefined;
  position: 1 | 2 | 3;
  onClick?: () => void;
  animationDelay?: number;
}

const HallOfFameSlot: React.FC<SlotProps> = ({ entry, position, onClick, animationDelay = 0 }) => {
  const config = POSITION_CONFIG[position];

  if (!entry) {
    return (
      <div className="flex flex-col items-center flex-1" style={{ marginTop: config.verticalOffset }}>
        <div
          className="rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xl font-medium"
          style={{ width: config.mobileAvatarSize, height: config.mobileAvatarSize }}
        >
          ?
        </div>
      </div>
    );
  }

  const nameParts = formatNameTwoLines(entry.display_name, entry.username);
  const avatarFallback = entry.display_name?.charAt(0) || entry.username?.charAt(0) || '?';

  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer relative flex-1"
      style={{ marginTop: config.verticalOffset }}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay, ease: 'easeOut' }}
    >
      {/* Crown for 1st place — large and dramatic */}
      {position === 1 && (
        <motion.div
          className="mb-1"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: animationDelay + 0.2,
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
        {/* Golden glow for #1 — warm spotlight, slightly stronger for All-Time */}
        {position === 1 && (
          <div
            className="absolute -z-10"
            style={{
              top: '-1.5rem',
              left: '-2rem',
              right: '-2rem',
              bottom: '-2rem',
              background: 'radial-gradient(ellipse at center, rgba(212, 168, 83, 0.35) 0%, rgba(212, 168, 83, 0.12) 50%, transparent 80%)',
              filter: 'blur(12px)',
            }}
          />
        )}

        {/* Avatar image */}
        <div
          className="relative rounded-full overflow-hidden"
          style={{
            width: config.mobileAvatarSize,
            height: config.mobileAvatarSize,
            border: `${config.borderWidth}px solid ${config.borderColor}`,
            boxShadow: `0 ${position === 1 ? '8px 28px' : '4px 12px'} ${config.shadowColor}`,
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

        {/* Rank badge — bottom-right overlapping border */}
        <div
          className="absolute -bottom-1 -right-1 flex items-center justify-center font-bold text-white shadow-md"
          style={{
            width: config.badgeSize,
            height: config.badgeSize,
            borderRadius: '50%',
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
        transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
      >
        {entry.all_time_courses}
        <span className="text-xs font-normal text-muted-foreground ml-1">courses</span>
      </motion.p>

      {/* Season wins for 1st place */}
      {position === 1 && entry.seasons_won > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {entry.seasons_won} season{entry.seasons_won !== 1 ? 's' : ''} won
        </p>
      )}
    </motion.div>
  );
};

export const HallOfFamePodium: React.FC<HallOfFamePodiumProps> = ({
  entries: entriesProp,
  scope,
  currentUserId,
  onUserClick,
}) => {
  const { data: fetchedEntries, isLoading } = usePodiumAllTime({
    scope: scope || 'global',
    currentUserId,
    enabled: !entriesProp && !!scope,
  });

  const entries = entriesProp || fetchedEntries;

  if (!entriesProp && isLoading) {
    return (
      <div className="w-full py-6">
        <div className="flex items-end justify-center gap-3 max-w-lg mx-auto px-4">
          <Skeleton className="h-36 w-[100px] rounded-xl" />
          <Skeleton className="h-44 w-[120px] rounded-xl" />
          <Skeleton className="h-36 w-[100px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <div className="flex items-end justify-center gap-4 opacity-40">
          {[2, 1, 3].map((pos) => (
            <div key={pos} className="flex flex-col items-center">
              <div
                className="rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl font-medium"
                style={{ width: pos === 1 ? 90 : 68, height: pos === 1 ? 90 : 68 }}
              >
                ?
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">No all-time leaders yet!</p>
      </div>
    );
  }

  const first = entries.find((e) => e.podium_position === 1);
  const second = entries.find((e) => e.podium_position === 2);
  const third = entries.find((e) => e.podium_position === 3);

  return (
    <div className="relative w-full overflow-visible">
      {/* Hall of Fame Header — prestige inscription */}
      <div className="text-center py-6">
        {/* Decorative gold gradient lines flanking trophy */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div 
            className="h-px w-20"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212, 168, 83, 0.3), transparent)' }}
          />
          <div 
            className="relative"
            style={{ filter: 'drop-shadow(0 0 12px rgba(212, 168, 83, 0.2))' }}
          >
            <Trophy size={32} style={{ color: '#D4A853' }} />
          </div>
          <div 
            className="h-px w-20"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212, 168, 83, 0.3), transparent)' }}
          />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground tracking-tight mt-2">
          Hall of Fame
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Lifetime leaders across all seasons
        </p>
      </div>

      {/* Spotlight background behind #1 */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '40%',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(82, 183, 136, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* Podium Layout: 2nd - 1st (elevated) - 3rd */}
      <div className="relative flex items-start justify-center pb-6">
        <HallOfFameSlot
          entry={second}
          position={2}
          onClick={() => second && onUserClick?.(second.user_id)}
          animationDelay={ANIMATION_DELAYS[2]}
        />
        <HallOfFameSlot
          entry={first}
          position={1}
          onClick={() => first && onUserClick?.(first.user_id)}
          animationDelay={ANIMATION_DELAYS[1]}
        />
        <HallOfFameSlot
          entry={third}
          position={3}
          onClick={() => third && onUserClick?.(third.user_id)}
          animationDelay={ANIMATION_DELAYS[3]}
        />
      </div>
    </div>
  );
};

export default HallOfFamePodium;
