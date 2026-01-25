import React from 'react';
import { cn } from '@/lib/utils';
import { Crown, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePodiumAllTime } from '@/hooks/championship/usePodiumAllTime';
import type { AllTimePodiumEntry, PodiumScope } from '@/types/podium';
import { Skeleton } from '@/components/ui/skeleton';

interface HallOfFamePodiumProps {
  // Option 1: Pass entries directly
  entries?: AllTimePodiumEntry[];
  // Option 2: Fetch data internally using scope
  scope?: PodiumScope;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

// Position-specific styling - matching TrophyPodium sizes (130px/104px) with consistent ring
const POSITION_CONFIG = {
  1: {
    ringSize: 130, // Match TrophyPodium 1st place
    borderWidth: 1.5, // Same thin ring as TrophyPodium
    gap: 0.5, // Same gap as TrophyPodium
    borderColor: '#F59E0B', // Gold
    badgeSize: 24,
    badgeBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    nameSize: 'text-sm font-bold',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    scoreColor: '#D97706',
    crownSize: 'w-9 h-9',
  },
  2: {
    ringSize: 104, // Match TrophyPodium 2nd place
    borderWidth: 1.5,
    gap: 0.5,
    borderColor: '#9CA3AF', // Silver
    badgeSize: 24,
    badgeBg: 'bg-gradient-to-br from-slate-400 to-gray-500',
    nameSize: 'text-xs font-semibold',
    glowColor: 'rgba(156, 163, 175, 0.25)',
    scoreColor: '#6B7280',
    crownSize: null,
  },
  3: {
    ringSize: 104, // Match TrophyPodium 3rd place
    borderWidth: 1.5,
    gap: 0.5,
    borderColor: '#CD7F32', // Bronze
    badgeSize: 24,
    badgeBg: 'bg-gradient-to-br from-orange-400 to-amber-600',
    nameSize: 'text-xs font-semibold',
    glowColor: 'rgba(205, 127, 50, 0.25)',
    scoreColor: '#B45309',
    crownSize: null,
  },
} as const;

/**
 * Calculate inner image size based on ring size, border, and gap
 */
function getImageSize(ringSize: number, borderWidth: number, gap: number): number {
  return ringSize - (borderWidth * 2) - (gap * 2);
}

/**
 * Truncate name to "First L." format
 */
function formatName(displayName: string | null, username: string | null): string {
  const name = displayName || username || 'Unknown';
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].length > 12 ? parts[0].slice(0, 11) + '…' : parts[0];
  }
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  const formatted = `${firstName} ${lastInitial}.`;
  
  return formatted.length > 14 ? `${firstName.slice(0, 10)}… ${lastInitial}.` : formatted;
}

interface SlotProps {
  entry: AllTimePodiumEntry | undefined;
  position: 1 | 2 | 3;
  onClick?: () => void;
  animationDelay?: number;
}

const HallOfFameSlot: React.FC<SlotProps> = ({ entry, position, onClick, animationDelay = 0 }) => {
  const config = POSITION_CONFIG[position];
  const isFirst = position === 1;
  const imageSize = getImageSize(config.ringSize, config.borderWidth, config.gap);

  if (!entry) {
    return (
      <div className="flex flex-col items-center flex-1">
        <div
          className="rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground text-2xl"
          style={{ width: imageSize, height: imageSize }}
        >
          ?
        </div>
      </div>
    );
  }

  const formattedName = formatName(entry.display_name, entry.username);
  const avatarFallback = entry.display_name?.charAt(0) || entry.username?.charAt(0) || '?';

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center cursor-pointer flex-1',
        isFirst && 'mb-4'
      )}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: animationDelay,
        ease: 'easeOut',
      }}
    >
      {/* Crown for 1st place - larger and legendary */}
      {isFirst && (
        <motion.div
          className="relative mb-1.5"
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
            className={config.crownSize || 'w-7 h-7'}
            style={{ color: '#F59E0B' }}
            fill="#FCD34D"
            strokeWidth={1.5}
          />
          {/* Animated sparkle */}
          <Sparkles 
            className="absolute -top-1 -right-2.5 w-3.5 h-3.5 text-yellow-400 animate-pulse" 
          />
          {/* Second sparkle for extra legendary feel */}
          <Sparkles 
            className="absolute -top-0.5 -left-2 w-2.5 h-2.5 text-amber-300 animate-pulse" 
            style={{ animationDelay: '0.5s' }}
          />
        </motion.div>
      )}

      {/* Position badge (above image for 2nd/3rd) */}
      {!isFirst && (
        <div
          className={cn(
            'mb-2 flex items-center justify-center font-bold text-white shadow-md',
            config.badgeBg
          )}
          style={{
            width: config.badgeSize,
            height: config.badgeSize,
            borderRadius: '50%',
            fontSize: config.badgeSize * 0.5,
          }}
        >
          {position}
        </div>
      )}

      {/* Avatar with glow and metallic frame - using box-shadow for ring+gap effect */}
      <div className="relative">
        {/* Glow effect */}
        {isFirst && (
          <div 
            className="absolute -z-10"
            style={{
              top: '-1rem',
              left: '-2.5rem',
              right: '-2.5rem',
              bottom: '-2.5rem',
              background: `radial-gradient(ellipse at center, ${config.glowColor} 0%, rgba(251, 191, 36, 0.35) 30%, rgba(251, 191, 36, 0.1) 60%, transparent 80%)`,
              filter: 'blur(14px)',
            }}
          />
        )}

        {/* Avatar with box-shadow for ring + gap effect (matching TrophyPodium technique) */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            width: imageSize,
            height: imageSize,
            // Inner shadow creates the gap (matches background), outer creates the ring
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

        {/* 1st place badge */}
        {isFirst && (
          <div
            className={cn(
              'absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center font-bold text-white shadow-lg',
              config.badgeBg
            )}
            style={{
              width: config.badgeSize,
              height: config.badgeSize,
              borderRadius: '50%',
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
          'mt-4 text-center text-foreground leading-tight',
          config.nameSize
        )}
      >
        {formattedName}
      </p>

      {/* Course count */}
      <motion.p
        className="text-sm mt-0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
      >
        <span 
          className="font-bold"
          style={{ color: config.scoreColor }}
        >
          {entry.all_time_courses}
        </span>
        <span className="text-muted-foreground text-xs ml-1">courses</span>
      </motion.p>

      {/* Season wins for 1st place */}
      {isFirst && entry.seasons_won > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {entry.seasons_won} season{entry.seasons_won !== 1 ? 's' : ''} won
        </p>
      )}
    </motion.div>
  );
};

/**
 * HallOfFamePodium - Premium all-time leaderboard podium
 * 
 * Features:
 * - Gold/Silver/Bronze styling
 * - Crown for 1st place
 * - Golden glow effect
 * - Decorative stars background
 * 
 * Supports two modes:
 * 1. Pass `entries` directly for controlled mode
 * 2. Pass `scope` to fetch data internally
 */
export const HallOfFamePodium: React.FC<HallOfFamePodiumProps> = ({
  entries: entriesProp,
  scope,
  currentUserId,
  onUserClick,
}) => {
  // Fetch data if scope is provided and entries are not
  const { data: fetchedEntries, isLoading } = usePodiumAllTime({
    scope: scope || 'global',
    currentUserId,
    enabled: !entriesProp && !!scope,
  });

  const entries = entriesProp || fetchedEntries;

  // Loading state (only when fetching internally)
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

  // Empty state
  if (!entries || entries.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <div className="flex items-end justify-center gap-4 opacity-40">
          {[2, 1, 3].map((pos) => (
            <div
              key={pos}
              className="flex flex-col items-center"
            >
              <div
                className="rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-2xl font-medium"
                style={{
                  width: pos === 1 ? 100 : 80,
                  height: pos === 1 ? 100 : 80,
                }}
              >
                ?
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          No all-time leaders yet!
        </p>
      </div>
    );
  }

  const first = entries.find((e) => e.podium_position === 1);
  const second = entries.find((e) => e.podium_position === 2);
  const third = entries.find((e) => e.podium_position === 3);

  // Animation delays for staggered entrance (2nd → 1st → 3rd)
  const delays = { 2: 0, 1: 0.15, 3: 0.3 };

  return (
    <div className="relative py-6 px-4 overflow-visible">
      {/* Subtle gradient background */}
      <div 
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(251, 191, 36, 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Hall of Fame Header */}
      <div className="text-center mb-8">
        {/* Subtle gold divider line */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300/60" />
          <Trophy className="w-5 h-5 text-amber-500" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300/60" />
        </div>
        
        {/* Title */}
        <h2 className="text-lg font-semibold text-foreground">
          Hall of Fame
        </h2>
        
        {/* Subtitle */}
        <p className="text-xs text-muted-foreground mt-1 font-normal">
          Lifetime leaders across all seasons
        </p>
      </div>

      {/* Podium Layout: 2nd - 1st (elevated) - 3rd */}
      <div className="flex items-end justify-center gap-2">
        {/* 2nd Place - Left */}
        <HallOfFameSlot
          entry={second}
          position={2}
          onClick={() => second && onUserClick?.(second.user_id)}
          animationDelay={delays[2]}
        />

        {/* 1st Place - Center (elevated) */}
        <HallOfFameSlot
          entry={first}
          position={1}
          onClick={() => first && onUserClick?.(first.user_id)}
          animationDelay={delays[1]}
        />

        {/* 3rd Place - Right */}
        <HallOfFameSlot
          entry={third}
          position={3}
          onClick={() => third && onUserClick?.(third.user_id)}
          animationDelay={delays[3]}
        />
      </div>

    </div>
  );
};

export default HallOfFamePodium;
