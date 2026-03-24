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

const POSITION_CONFIG = {
  1: {
    mobileAvatarSize: 120,
    nameClass: 'text-[17px] font-bold',
    crownSize: 36,
    verticalOffset: 0,
    boxShadow: '0 8px 28px hsl(var(--accent-amber) / 0.25)',
    podiumHeight: 88,
    courseSize: 22,
    courseWeight: 900,
    badgeSize: 26,
    badgeBg: 'hsl(var(--accent-amber))',
  },
  2: {
    mobileAvatarSize: 88,
    nameClass: 'text-[15px] font-semibold',
    crownSize: 0,
    verticalOffset: 24,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    podiumHeight: 68,
    courseSize: 18,
    courseWeight: 700,
    badgeSize: 22,
    badgeBg: '#A8B4C0',
  },
  3: {
    mobileAvatarSize: 88,
    nameClass: 'text-[15px] font-semibold',
    crownSize: 0,
    verticalOffset: 40,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    podiumHeight: 52,
    courseSize: 18,
    courseWeight: 700,
    badgeSize: 22,
    badgeBg: '#C4956A',
  },
} as const;

const ANIMATION_DELAYS = { 1: 0.15, 2: 0, 3: 0.3 } as const;

interface SlotProps {
  entry: AllTimePodiumEntry | undefined;
  position: 1 | 2 | 3;
  isCurrentUser?: boolean;
  onClick?: () => void;
  animationDelay?: number;
}

const HallOfFameSlot: React.FC<SlotProps> = ({ entry, position, isCurrentUser = false, onClick, animationDelay = 0 }) => {
  const config = POSITION_CONFIG[position];
  const themeColor = 'hsl(var(--accent-amber))';

  if (!entry) {
    return (
      <div className="flex flex-col items-center flex-1" style={{ marginTop: config.verticalOffset }}>
        <div
          className="bg-muted flex items-center justify-center text-muted-foreground text-xl font-medium"
          style={{ width: config.mobileAvatarSize, height: config.mobileAvatarSize, borderRadius: '50%' }}
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
      {/* Crown for 1st place */}
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
            style={{ color: 'hsl(var(--accent-amber))' }}
            fill="#f59e0b"
            strokeWidth={1.5}
          />
        </motion.div>
      )}

      {/* Avatar */}
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

        {/* Avatar image */}
        <div
          className="relative overflow-hidden"
          style={{
            width: config.mobileAvatarSize,
            height: config.mobileAvatarSize,
            borderRadius: '50%',
            border: isCurrentUser ? `3px solid hsl(var(--accent-amber))` : 'none',
            boxShadow: config.boxShadow,
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

        {/* Rank badge */}
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

      {/* Podium base block */}
      <div
        className="w-full mt-2 flex flex-col items-center justify-center"
        style={{
          height: config.podiumHeight,
          borderRadius: '10px 10px 0 0',
          background: position === 1
            ? `linear-gradient(180deg, ${themeColor}20 0%, ${themeColor}08 100%)`
            : '#F8FAFC',
          borderTop: position === 1
            ? `2px solid ${themeColor}40`
            : '1px solid #E2E8F0',
        }}
      >
        {/* Name */}
        <p className={cn('text-foreground leading-tight text-center', config.nameClass)}>
          {nameParts.firstName}
        </p>
        {nameParts.lastName && (
          <p className={cn('text-foreground leading-tight text-center', config.nameClass)}>
            {nameParts.lastName}
          </p>
        )}

        {/* Course count */}
        <motion.div
          className="text-center mt-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
        >
          <span
            className="font-black leading-none"
            style={{
              color: position === 1 ? themeColor : '#0F172A',
              fontSize: config.courseSize,
              fontWeight: config.courseWeight,
            }}
          >
            {entry.all_time_courses}
          </span>
          <span className="text-[10px] text-muted-foreground ml-0.5 block">courses</span>
        </motion.div>
      </div>
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
                className="bg-muted flex items-center justify-center text-muted-foreground text-2xl font-medium"
                style={{ width: pos === 1 ? 120 : 88, height: pos === 1 ? 120 : 88, borderRadius: '50%' }}
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
      {/* Hall of Fame Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div
            className="h-px w-20"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--accent-amber) / 0.3), transparent)' }}
          />
          <div
            className="relative"
            style={{ filter: 'drop-shadow(0 0 12px hsl(var(--accent-amber) / 0.2))' }}
          >
            <Trophy size={32} style={{ color: 'hsl(var(--accent-amber))' }} />
          </div>
          <div
            className="h-px w-20"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--accent-amber) / 0.3), transparent)' }}
          />
        </div>

        <h2 className="text-2xl font-bold text-foreground tracking-tight mt-2">
          Hall of Fame
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Lifetime leaders across all seasons
        </p>
      </div>

      {/* Podium Layout — same as seasonal */}
      <div className="relative flex items-start justify-center gap-6 pb-6">
        <HallOfFameSlot
          entry={second}
          position={2}
          isCurrentUser={second?.user_id === currentUserId}
          onClick={() => second && onUserClick?.(second.user_id)}
          animationDelay={ANIMATION_DELAYS[2]}
        />
        <HallOfFameSlot
          entry={first}
          position={1}
          isCurrentUser={first?.user_id === currentUserId}
          onClick={() => first && onUserClick?.(first.user_id)}
          animationDelay={ANIMATION_DELAYS[1]}
        />
        <HallOfFameSlot
          entry={third}
          position={3}
          isCurrentUser={third?.user_id === currentUserId}
          onClick={() => third && onUserClick?.(third.user_id)}
          animationDelay={ANIMATION_DELAYS[3]}
        />
      </div>
    </div>
  );
};

export default HallOfFamePodium;
