import React from 'react';
import { cn } from '@/lib/utils';
import { SeasonalPodiumEntry } from '@/types/podium';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatNameTwoLines } from '@/utils/formatters';

interface TrophyPodiumSlotProps {
  entry: SeasonalPodiumEntry | undefined;
  position: 1 | 2 | 3;
  seasonThemeColor?: string;
  isCurrentUser?: boolean;
  onClick?: () => void;
  animationDelay?: number;
}

const POSITION_CONFIG = {
  1: {
    mobileAvatarSize: 120,
    nameClass: 'text-[17px] font-bold',
    crownSize: 36,
    verticalOffset: 0,
    boxShadow: '0 8px 28px hsl(var(--accent-amber) / 0.25)',
    statSize: 24,
    statWeight: 800,
    labelSize: 13,
    badgeSize: 26,
    badgeBg: 'hsl(var(--accent-amber))',
  },
  2: {
    mobileAvatarSize: 88,
    nameClass: 'text-[15px] font-semibold',
    crownSize: 0,
    verticalOffset: 24,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    statSize: 20,
    statWeight: 700,
    labelSize: 12,
    badgeSize: 22,
    badgeBg: '#A8B4C0',
  },
  3: {
    mobileAvatarSize: 88,
    nameClass: 'text-[15px] font-semibold',
    crownSize: 0,
    verticalOffset: 40,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    statSize: 20,
    statWeight: 700,
    labelSize: 12,
    badgeSize: 22,
    badgeBg: '#C4956A',
  },
} as const;

export const TrophyPodiumSlot: React.FC<TrophyPodiumSlotProps> = ({
  entry,
  position,
  seasonThemeColor = 'hsl(var(--accent-amber))',
  isCurrentUser = false,
  onClick,
  animationDelay = 0,
}) => {
  const config = POSITION_CONFIG[position];

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
      transition={{
        duration: 0.3,
        delay: animationDelay,
        ease: 'easeOut',
      }}
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

      {/* Course count */}
      <motion.p
        className="font-bold mt-0.5"
        style={{ color: seasonThemeColor, fontSize: config.statSize, fontWeight: config.statWeight }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
      >
        {entry.courses_logged}
        <span className="font-normal text-muted-foreground ml-1" style={{ fontSize: config.labelSize }}>courses</span>
      </motion.p>
    </motion.div>
  );
};
